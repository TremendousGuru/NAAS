# NAASCONNECT Batch 1 — live-schema reconciliation

**Date:** 2026-11-23  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Authority:** NAASCONNECT V1.0 and the approved decision register  
**Execution status:** Read-only inspection. No Supabase writes or migration-ledger changes.

## Executive result

The earlier Batch 1 SQL draft is **not approved for execution**. Live inspection found existing Stage 5.2 onboarding/profile foundations and Stage 5.6 membership review/reporting functions that the draft did not correctly integrate. The draft must be revised around these objects rather than layering a second workflow over them.

## Existing live objects

### `public.profiles`

Existing columns include `display_name`, `phone`, `avatar_url`, `institution_name`, `course_of_study`, `level_of_study`, `state_of_origin`, and `profile_completed`. There are no durable `member_category`, `state_of_admission`, or `state_of_residence` columns in this table.

The frontend milestone records that student/non-student classification and admission/residence region currently remain in Auth user metadata. That metadata is descriptive only and must not authorize access.

### `public.org_applications`

This is the existing organization-creation application workflow (union/zone/campus/church), not a member's personal membership intake. It must not be repurposed as a member intake table.

Its existing review states are `pending`, `under_review`, `approved`, `rejected`, and `withdrawn`, with reviewer and created-organization fields.

### `public.org_memberships`

Existing columns include `org_id`, `user_id`, `role`, `status`, `approved_by`, `approved_at`, `joined_at`, `status_reason`, `status_changed_by`, and `status_changed_at`.

Existing constraints:
- Unique `(org_id, user_id)`, enabling same-organization resubmission without a duplicate row.
- Roles are already constrained to the V1.0 organization role set.
- Status currently permits only `pending`, `active`, `suspended`, and `ended`.
- `status_reason` must be null or 10–1000 trimmed characters.

Existing triggers:
- `org_memberships_touch_updated_at`
- `org_memberships_validate_role`

The role-validation trigger enforces role compatibility with organization type.

### `public.membership_events`

Existing event types already include:
- `membership_requested`
- `membership_approved`
- `membership_rejected`
- `membership_suspended`
- `membership_reactivated`
- `membership_ended`
- Existing transfer lifecycle events

Therefore, a rejection audit event is already representable. The missing part is a compatible membership status/transition and review action, not a new event table.

## Existing membership authorization and RPCs

Existing RLS policies include:
- Members see their own membership and scoped administrators see membership rosters.
- The current self-insert policy allows a user to create a pending basic membership for an active organization, with the role derived from whether the organization is a church.
- Scoped administrators have a direct membership UPDATE policy.
- Membership history is visible to the member and scoped administrators.

Existing private security-definer functions include:
- `private.can_administer_org(uuid)`
- `private.get_membership_review_queue(...)`
- `private.get_scoped_membership_directory(...)`
- `private.get_scoped_membership_statistics(uuid)`
- `private.get_membership_activity_report(...)`
- `private.manage_membership_status(uuid,text,text)`
- Existing membership transfer review/cancellation functions

The public RPC wrappers exist for the membership queue, directory, statistics, activity report, status management, and transfer operations.

Important behavioral findings:
- `get_membership_review_queue` is read-only and returns pending memberships in the administrator's selected organization and descendant scope.
- `manage_membership_status` only handles suspend, reactivate, and terminate. It is not an approval/rejection function.
- The existing direct scoped-administrator UPDATE policy is currently the status-mutation path available to scoped admins. Any replacement must preserve transfer, suspension, reactivation, termination, and other V1.0 workflows.
- The ordinary membership review queue does not currently expose student/non-student classification because that classification is not durably stored in `profiles`.

## Organization availability

The inspected live directory reported:
- 1 active national organization.
- 3 pending unions.
- 20 pending zones.
- 0 active campuses.
- 0 active churches.

The frontend must not fabricate campus/church destinations or allow an ineligible request. Real campus/ASF and church membership requests depend on authorized organization applications being reviewed and the corresponding organizations becoming active.

## Why the earlier proposed SQL must be revised

1. It proposed a new onboarding table without first completing the mapping to existing Stage 5.2 profile and Auth metadata behavior.
2. It proposed replacing membership RLS policies using policy names that do not match the exact live policy names.
3. It proposed adding `rejected` to the membership status constraint without a complete transition design covering existing direct admin updates and every legacy membership lifecycle function.
4. It proposed a new review RPC even though the existing review queue and lifecycle functions need to be integrated rather than duplicated.
5. It did not establish a complete frontend call-site inventory before revoking authenticated UPDATE privileges.
6. It must not confuse `org_applications` (organization registration) with a member's own onboarding/membership application.

## Revised implementation direction

The minimal V1.0-aligned approach is:

1. Keep `profiles` as the member profile source of truth.
2. Add only the durable member-onboarding data that is genuinely missing; do not create a duplicate organization-application workflow.
3. Keep the organization hierarchy and `private.can_administer_org` authorization model unchanged.
4. Extend the existing pending-membership review workflow with a narrowly scoped transactional decision operation, or prove an existing approved implementation already supplies that operation.
5. Keep all status changes auditable through `membership_events`.
6. Preserve the unique `(org_id,user_id)` key and implement same-organization resubmission as a controlled transition on the existing row, retaining previous rejection history.
7. Keep suspension, reactivation, termination, transfers, and leadership appointments on their existing designated workflows.
8. Inspect every frontend and server-side membership write before changing table privileges or RLS.
9. Test the complete migration on a disposable database with the same schema before requesting production approval.

## Approval and safety boundary

This document records evidence and design corrections only.

- No Supabase DDL or DML was executed.
- No migration was applied or replayed.
- The Supabase migration ledger was not changed.
- No paid Supabase branch was created.
- No Phase 5.9 DDL was implemented.
- A separate, explicit approval is required before any production database write.

## Evidence sources

- Live Supabase catalog inspection of tables, columns, constraints, triggers, RLS policies, function definitions, and migration history.
- `docs/frontend/AUTHENTICATION_AND_MEMBER_ONBOARDING_MILESTONE.md` on `feature/naasconnect-frontend-foundation`.
- `supabase/migrations/20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` on `main`.
- Live migration ledger entries through Stage 5.7.2, including Stage 5.6.7 membership review queues and reporting.
