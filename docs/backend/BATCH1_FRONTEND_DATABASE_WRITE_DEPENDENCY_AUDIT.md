# NAASCONNECT Batch 1 — frontend/database write dependency audit

**Date:** 2026-11-23  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Scope:** Read-only source review of membership/onboarding call sites and the database contract.  
**Change control:** No Supabase writes, no migration-ledger edits, no migration replay, no Phase 5.9 DDL.

## Executive conclusion

The frontend/database audit confirms that the existing Stage 5.2 member self-enrollment policy and Stage 5.6.7 review queue do not by themselves provide a complete ordinary-member approval workflow.

- The self-enrollment policy permits a signed-in user to insert a pending basic membership only for an active campus or church. The policy independently enforces the user's identity, pending status, null approval fields, basic role, and eligible organization type/status.
- The Stage 5.6.7 `get_membership_review_queue` RPC is read-only. It returns pending membership data scoped through `private.can_administer_org`.
- The existing `manage_membership_status` RPC handles suspension, reactivation and termination; it does not approve or reject pending ordinary-member requests.
- `org_memberships.status` has the lifecycle values `pending`, `active`, `suspended`, and `ended`; there is no `rejected` membership status. Rejection therefore needs a deliberate model, not a casual new enum/check value.
- The existing `membership_events` table already has a `membership_rejected` event type. It can retain a rejected attempt as audit history while leaving the canonical membership row in a valid resubmittable state, provided the transaction and event semantics are explicitly designed.

## 1. Source-level write inventory

### A. Ordinary member self-enrollment

Source: `supabase/migrations/20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql`, refined by `20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql` and `20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql`.

The current policy allows the authenticated member to INSERT their own row with:
- `user_id = auth.uid()`
- `status = 'pending'`
- `approved_by`, `approved_at`, and `joined_at` all null
- `role = member` or `church_member` according to the target organization
- target organization active and of type `campus` or `church`

The policy also allows a scoped administrator to insert a pending membership under `private.can_administer_org(org_id)`. This is distinct from ordinary member self-enrollment.

A repository code search did not identify a browser-side direct `from('org_memberships')` or `from("org_memberships")` write callsite. The current onboarding milestone says the server checks organization type/category and submits only a pending basic-member role, with the database policy independently enforcing the self-request boundary. This is a source-search result, not proof that no dynamically constructed or indirect callsite exists; a final local repository-wide ripgrep/build check should be run before changing grants.

### B. Administrator review queue

Source: `supabase/migrations/20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql`.

- `public.get_membership_review_queue(...)` is a `SECURITY INVOKER` wrapper over `private.get_membership_review_queue(...)`.
- The private implementation is `SECURITY DEFINER`, has an empty search path, requires `auth.uid()`, checks `private.can_administer_org(p_org_id)`, and bounds pagination/search inputs.
- It recursively scopes to the selected organization and descendants.
- It returns pending memberships with profile display name, institution, course and level fields.
- It does not mutate membership rows or record an approval/rejection.

### C. Existing lifecycle management

Source: Stage 5.6.4 and the live RPC catalog.

`public.manage_membership_status(p_membership_id,p_action,p_reason)` supports:
- active → suspended
- suspended → active
- active/suspended → ended

It rejects pending-state changes and is not the missing ordinary membership approval/rejection operation. Its audit event is written transactionally with the status transition.

### D. Privileged administrator appointment Edge Function

Source: `supabase/functions/admin-appointment/index.ts` (current branch file SHA: `794578e44ca02a010ba388e04791bbd17ac5e3f2`).

This Edge Function uses a service-role client only after verifying the caller's JWT with `userClient.auth.getUser()` and checking the approved appointment request/seat.

It performs privileged writes to:
- `org_memberships`: upsert a pending administrator membership when an approved appointee is invited.
- `org_memberships`: update that pending membership to active when the invited appointee accepts.
- `org_admin_seats`: mark the reserved seat active.
- `admin_appointment_requests`: move the appointment to invited/accepted.

These are service-role writes and bypass ordinary RLS. They are part of the separate reserved-administrator appointment workflow and must not be broken by Batch 1 member-intake changes. The accept path directly activates the administrator membership in this Edge Function; the current file does not explicitly insert a `membership_events` row. That is a separate audit-consistency issue to assess against V1.0 appointment/leadership history before any change. Do not fold administrator seat activation into ordinary member approval.

## 2. Data ownership and separation

| Concern | Existing source of truth | Batch 1 rule |
|---|---|---|
| Person identity | Supabase Auth `auth.users` | Do not duplicate identity |
| Person profile | `public.profiles` | Reuse existing fields; add only approved missing durable attributes |
| Student/non-student and admission/residence region | Currently descriptive Auth user metadata | Do not use metadata for authorization; propose a durable onboarding record for reviewable fields |
| Organization creation | `public.org_applications` | Keep distinct from personal membership intake |
| Organization hierarchy/status | `public.org_units` | Do not create shadow directory |
| Organization membership | `public.org_memberships` | Keep canonical relation; preserve unique `(org_id,user_id)` |
| Membership history | `public.membership_events` | Reuse; do not create duplicate event log |
| Transfer workflow | `public.membership_transfer_requests` + transfer RPCs | Preserve untouched |
| Administrator appointment | `admin_appointment_requests`, `org_admin_seats`, trusted Edge Function | Keep separate from ordinary member intake |
| Scoped authorization | `private.can_administer_org` | Reuse unchanged |

## 3. Required design corrections before writing final SQL

1. **Durable onboarding data:** Auth metadata is currently the only persisted location identified for member category and admission/residence region. Add a dedicated, one-to-one member onboarding record only for these durable, reviewable member attributes and any explicitly approved onboarding state. Do not put them in `org_applications`.
2. **Eligibility:** Enforce the strict agreed rule on the server and database side. A student request must resolve to an active campus organization within the permitted regional/institutional scope. A non-student request must resolve to an eligible active local church (or the exact V1.0 permitted category). Never trust a client-supplied category or organization type without joining to the authoritative profile/onboarding and organization rows.
3. **Approval/rejection:** Add one narrowly scoped transactional review operation if no existing live RPC already implements it. It must require an authenticated actor, `private.can_administer_org` for the correct organization, lock the pending membership row, validate its current state, record reviewer/time/reason, and insert the corresponding `membership_events` row atomically.
4. **Rejected attempt/resubmission:** Do not add a rejected value to `org_memberships.status` without full compatibility analysis. Keep the canonical row in a valid state and retain the rejected attempt in `membership_events` or a specifically approved application record. Same-organization resubmission must reuse the existing unique membership row and must not erase the prior rejection event.
5. **Permissions:** Do not revoke authenticated table UPDATE globally until every app, server action, Edge Function and admin workflow callsite is inventoried. Prefer an RPC for ordinary member review while preserving the service-role appointment workflow.
6. **Profile update:** Existing profile self-update RLS remains owner-scoped. New onboarding fields must not grant membership, organization admin, executive or leadership permissions.
7. **No duplicate workflow:** `org_applications` remains for creating organizations; membership intake is a separate member-to-existing-organization flow.

## 4. Minimum regression test matrix

Tests must run against a disposable database cloned from the current schema or an isolated test project, never production. Use controlled identities and fixtures; do not create real production members as test data.

| Scenario | Expected result |
|---|---|
| Unauthenticated member intake | Denied |
| Student submits to eligible active campus | Pending request only |
| Student submits to church when V1.0 disallows it | Denied |
| Non-student submits to eligible active church | Pending request only |
| User submits to pending/inactive organization | Denied |
| User forges category/organization type in request payload | Denied |
| User submits for another user | Denied |
| Ordinary user reads another user's onboarding/profile | Denied |
| Unrelated organization admin reviews request | Denied |
| Correct scoped admin reads review queue | Only own organization/descendant scope |
| Correct scoped admin approves pending request | Membership active + approval fields + one approval event atomically |
| Correct scoped admin rejects pending request | Rejection reason + one rejection event; no active membership |
| Duplicate/stale review action | Denied; no duplicate event |
| Same-org resubmission after rejection | Reuses unique membership row; previous rejection event retained |
| Second organization membership | Allowed only where V1.0 permits; existing memberships remain intact |
| Suspension/reactivation/termination RPC | Existing semantics and event records unchanged |
| Membership transfer source/destination review | Existing two-stage workflow unchanged |
| Approved administrator invitation/acceptance | Existing service-role workflow still functions |
| Auth metadata manipulation | Does not grant authorization |
| No direct client write to audit events | Denied |

## 5. Gate status and next work

**Frontend-to-database dependency audit:** Completed at source-review level.

**Remaining before a production SQL package is ready:**
- Complete local repository-wide callsite search (including generated/indirect access) and verify server action implementation against this branch.
- Confirm exact V1.0 student/non-student eligibility semantics from the approved decision register.
- Inspect the full live definitions of the existing membership review and RLS policies in a compact, independently reviewable output.
- Finalize the minimal onboarding table shape and RPC signatures.
- Prepare migration SQL with explicit preconditions, constraints, indexes, grants, policies, rollback strategy and regression SQL.
- Validate against a disposable schema and run security advisors.
- Present exact SQL for separate approval.

## 6. Change-control boundary

No database object or row was changed during this audit. No migration was applied or replayed. The migration ledger remains untouched. No paid branch was created. Phase 5.9 DDL was not implemented. Production database writes remain blocked pending separate approval of the exact SQL.
