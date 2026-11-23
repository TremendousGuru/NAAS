# NAASCONNECT Batch 1 — final pre-approval gate report

**Inspection date:** 2026-11-23  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Architecture authority:** NAASCONNECT Nigeria V1.0 and approved decision register  
**Scope:** Final read-only production catalog review and Batch 1 readiness assessment.

## Decision

**Batch 1 is not ready for production SQL application.** The existing system foundations are reusable, but two concrete integrity gaps remain and the proposed migration has not been validated against an isolated copy of the production schema. This report deliberately does not mark the batch complete or authorize a database change.

## Freshly verified production facts

### Current migration ledger

The latest live migration is Stage 5.7.2:
- `20261121152734_stage5_7_global_community_statuses`
- `20261121152827_stage5_7_1_status_policy_and_fk_index_hardening`
- `20261121152909_stage5_7_2_restrict_authenticated_status_table_grants`

The ledger also contains Stage 5.6.7 membership review/reporting, Stage 5.6.4 membership lifecycle, Stage 5.6.3 transfer review and the prior Stage 5.2 onboarding foundations. No Batch 1 or Phase 5.9 migration was added during this inspection.

### Current membership data model

`public.org_memberships`:
- unique key: `(org_id,user_id)`
- statuses: `pending`, `active`, `suspended`, `ended`
- no `rejected` status
- role constraint includes ordinary and all V1.0 administrative role values
- existing status reason length constraint: 10–1000 trimmed characters

`public.membership_events` already supports `membership_requested`, `membership_approved`, `membership_rejected`, suspension/reactivation/termination and transfer event types. Its `membership_id` FK is `ON DELETE SET NULL`, allowing historical event retention if a membership row is ever removed, although the proposed same-organization resubmission design should preserve the canonical membership row.

### Exact current RLS behavior

Policies on `public.org_memberships`:
- SELECT: member sees own row; scoped administrator sees rows where `private.can_administer_org(org_id)`.
- INSERT: either a scoped administrator inserts pending membership, or a user inserts their own pending membership with null approval/join timestamps and the basic role selected by organization type. The self-insert branch currently accepts either an active campus **or** an active church; it does not itself check durable student/non-student category or the user's admission/residential region.
- UPDATE: scoped administrators may update rows in their authorized organization scope.

Policies on `public.profiles` remain owner-scoped for read, insert and update. `membership_events` SELECT is member-own-history or scoped-admin history. No user-facing event INSERT policy is present in the inspected policy set.

### Critical frontend/database mismatch

The frontend milestone says its server action checks member category against the requested organization type before submitting a membership request. The database self-insert policy does not enforce that category-to-organization match. Since the category currently lives in user-editable Auth metadata and is not durably represented in a database onboarding record, the present database boundary is weaker than the approved strict eligibility rule.

**Required correction:** the database must become the final enforcement point. The member request must be submitted through a narrowly scoped RPC that reads durable onboarding data and the authoritative organization row. Direct authenticated self-insert must no longer be an alternate path around those checks. Any change to the existing self-insert policy must preserve the separate scoped-administrator insert path and the trusted service-role administrator appointment workflow.

## Strict eligibility proposal to validate against V1.0

The frontend milestone describes:
- student path: state of study/admission, institution, course and study level; membership intake is for campus/ASF;
- non-student path: residential state and preferred regional state; membership intake is for participating churches.

The database currently has `org_units.state_name` and `org_units.institution_name`, so a strict rule can compare the member's durable onboarding values with the selected active campus/church. However, the approved V1.0 decision register must be checked for the exact matching rules (for example, whether a campus can serve students from multiple institutions or whether a church's region means state or a lower administrative region) before freezing SQL.

**No active campus or church organizations were present in the latest inspected production directory.** Thus no valid production membership destination currently exists, and a successful strict-eligibility end-to-end production test cannot be performed with current data. Do not fabricate organizations or relax eligibility to make the UI appear functional.

## Proposed minimal data and workflow shape — not executable yet

1. Add one private-to-user, one-to-one durable onboarding record keyed by `auth.users.id`. Store member category and only the category-specific regional fields that are absent from `profiles`. Reuse existing profile fields for display name, institution, course, study level and state of origin; do not duplicate them.
2. Expose owner-scoped onboarding read/write only. These values are descriptive eligibility inputs, never roles or authorization claims.
3. Replace direct self-insert into `org_memberships` with a submit-membership RPC that checks `auth.uid()`, verified profile/onboarding completeness, strict category-to-org type mapping, active org status, and exact approved regional/institution matching.
4. Preserve the unique `(org_id,user_id)` membership key. Same-organization resubmission must reuse the same canonical membership row after a prior rejection, without deleting prior `membership_rejected` events.
5. Implement a transactional scoped review RPC. It must lock the membership row, require `private.can_administer_org(org_id)`, accept only a pending request, record approver/time or rejection reason, and append the appropriate membership event in the same transaction.
6. Decide the rejected-state representation only after all existing membership lifecycle, transfer, reporting, and frontend filters are regression-tested. Adding `rejected` to the status check is a candidate because the event taxonomy already supports rejection, but it is not approved merely by this report.
7. Preserve existing `manage_membership_status`, transfer RPCs, role-validation trigger, reserved administrator seats, and service-role administrator appointment Edge Function.

## Mandatory tests before production approval

- Direct self INSERT to `org_memberships` is denied after the RPC path is installed.
- Scoped administrator and service-role appointment writes still work.
- Student + active matching campus succeeds; student + church fails.
- Non-student + active matching church succeeds; non-student + campus fails.
- Inactive/pending organization fails.
- Region/institution mismatch fails.
- Auth metadata forgery does not change eligibility.
- User cannot submit for another user.
- Unrelated administrator cannot review.
- Authorized scoped administrator can review only within the permitted hierarchy.
- Approve/reject are atomic with event insertion and cannot be replayed on stale rows.
- Same-org resubmission after rejection reuses the canonical membership row and retains all earlier rejection events.
- Existing suspension, reactivation, termination, transfer, administrator appointment and leadership workflows pass regression tests.
- RLS and grants are tested using actual authenticated roles, not only the SQL editor's postgres role.
- Supabase security/performance advisors show no new unresolved finding attributable to the migration.

## Remaining gate items

1. Verify exact category/region matching semantics in the canonical V1.0 decision register.
2. Obtain a complete local repository checkout and run a repository-wide search for all direct membership writes, status filters, and RPC callsites; the connector source search is not a substitute for local ripgrep.
3. Finalize SQL only after reviewing all dependent functions/triggers, including transfer and administrator appointment paths.
4. Validate the migration and regression suite on a disposable schema/database. Do not create a paid Supabase branch without cost disclosure and explicit agreement.
5. Present the exact migration, rollback SQL, regression SQL and advisor output for separate production approval.

## Change-control record

- Supabase schema/data: **unchanged**
- Supabase migration ledger: **unchanged**
- Migration replay: **none**
- Paid Supabase branch: **none**
- Phase 5.9 DDL: **not implemented**
- GitHub: documentation only
- Production database approval: **still required**
