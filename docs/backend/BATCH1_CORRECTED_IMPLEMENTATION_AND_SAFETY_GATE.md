# Batch 1 — corrected implementation findings and remaining safety gate

**Date:** 2026-11-23  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Authority:** NAASCONNECT Nigeria V1.0; this note does not amend it.

## Why the two previously reported findings do not block the project

- The Supabase development branch named `main` with `MIGRATIONS_FAILED` is a separate database branch/environment, not a missing source file or a production migration. It is unsuitable for validation and must remain untouched until separately diagnosed.
- The 56 unused-index advisor findings are index-usage observations, not 56 missing files or failed migrations. They are not a Batch 1 blocker. No index is to be dropped under this work.

## New source-to-live reconciliation

### 1. The current application uses editable Auth metadata for category and region

The branch's `app/auth/actions.ts` writes these exact metadata keys at registration:
- `member_category` = `student` or `non_student`
- `state_of_admission` for students
- `institution_name`, `course_of_study`, `level_of_study` for students
- `residential_state` for non-students
- `onboarding_version` = `naasconnect-v1`

The current `app/app/actions.ts` reads `user.user_metadata.member_category` to decide whether the selected organization must be a campus or church. It then inserts directly into `org_memberships`.

The profile editor also writes category/region to Auth user metadata and writes only the pre-existing profile fields to `public.profiles`.

**Security correction:** Auth `user_metadata` is user-editable and must not be the database's final eligibility source. Move the authoritative member category and admission/residential fields into the existing one-row-per-user `public.profiles` record. Do not create a second onboarding table unless V1.0 expressly requires an independent reviewable application entity. The current V1.0 database blueprint and Stage 5.2 implementation both establish `profiles` as the personal profile and `org_memberships` as the membership request record.

### 2. Existing live data model is sufficient to extend, not replace

Verified live objects:
- `profiles` already stores display name, phone, institution, course, study level, state of origin and profile-completed flag.
- `org_units` stores organization type/status, state name and institution name.
- `org_memberships` is unique on `(org_id,user_id)`; current statuses are pending/active/suspended/ended.
- `membership_events` already supports `membership_requested`, `membership_approved`, and `membership_rejected`.
- `get_membership_review_queue` already returns pending memberships within the `private.can_administer_org` hierarchy.
- `manage_membership_status` handles suspension/reactivation/termination only; it is not the initial approval operation.

No duplicate profile, organization, membership or membership-history table is needed.

### 3. Important correction to the earlier SQL proposal

The existing `docs/database/PROPOSED_MEMBER_ONBOARDING_EXTENSION.md` is a proposal, not an applied migration. Its review RPC alone is insufficient to finish Batch 1 because:
- it does not close the current direct self-INSERT route that bypasses category and region checks;
- it does not add a strict database-side membership request RPC;
- it does not implement same-organization resubmission;
- it does not compare the authoritative profile category/region/institution with the selected organization;
- it does not demonstrate regression compatibility with the transfer RPC.

Do not apply that earlier proposal as-is.

### 4. Correct target workflow

The final package should make the following changes, after full SQL review and isolated validation:

1. Add nullable, constrained columns to the existing `profiles` table for `member_category`, `state_of_admission`, and `residential_state`. Existing institution/course/level fields remain in place. No new member-onboarding table.
2. Backfill these columns from the exact Auth metadata keys above, preserving existing Auth metadata. Report users whose metadata is missing/invalid; do not invent values.
3. Replace the direct ordinary-member self-INSERT policy with a database RPC-only submission path. Preserve the separate scoped-admin pending INSERT path and service-role administrator appointment path.
4. Add a request RPC that requires `auth.uid()`, a complete profile, a valid category, an active campus for students or active church for non-students, and matching organization location/institution based on the final V1.0 rule. It must create a pending basic membership only.
5. For same-organization resubmission after rejection, lock and reuse the existing unique `(org_id,user_id)` row, transition rejected → pending, clear prior decision fields, and append a new `membership_requested` event. Never delete earlier rejection events.
6. Add a separate scoped approval/rejection RPC. Lock the pending membership; disallow self-review; require `private.can_administer_org(org_id)`; approve/reject atomically with `membership_events`.
7. Keep `manage_membership_status`, transfer RPCs, leadership/admin appointment, org applications, global statuses, and all existing V1 authorization helpers intact.

### 5. Region rule requiring V1.0 source confirmation

The current registration form captures:
- student: state of study/admission and institution;
- non-student: residential state and preferred regional state.

The live `org_units` record has `state_name` and `institution_name`, but not a typed preferred-zone relationship in the profile. The previous proposal's `preferred_zone_id` is not yet established as an approved V1.0 requirement and must not be added without source confirmation.

Before SQL is frozen, the exact V1.0 matching rule must be applied:
- student campus matching: institution and state-of-admission, or institution only if V1.0 explicitly allows multi-state campus attendance;
- non-student church matching: residential state or preferred regional state, according to the V1.0 definition of local church affiliation.

Do not guess between residential and preferred region.

### 6. Existing compatibility risk explicitly checked

The current transfer RPC reuses an existing destination membership only when its status is `ended`. It rejects other existing statuses. The new rejected state and resubmission route must not alter that transfer behavior. A rejected membership must not be treated as a completed transfer or silently reactivated by transfer acceptance.

The membership review queue currently filters `status='pending'`; it will continue to show resubmitted requests once they return to pending. Existing membership status-management RPC rejects pending requests and must remain unchanged.

### 7. Production environment and validation

Current production directory has one active national root, three pending unions and twenty pending zones; there are no active campus/church records. `org_memberships` is currently empty. This does not prevent adding the schema/RPC, but real membership-request success cannot be demonstrated until authorized campus/church organizations exist.

The existing Supabase `main` development branch reports `MIGRATIONS_FAILED` and is not a clean test target. Do not reset it or replay migrations. A disposable validation database is required. A new Supabase branch can incur charges; do not create one without explicit cost confirmation.

## Current completion state

- Existing architecture/source reconciliation: completed for the objects and code listed above.
- Batch 1 final SQL: **not yet frozen**; V1.0 region rule must be confirmed and transfer/admin paths included in regression.
- Isolated database validation: not performed; no clean disposable database is currently available.
- Production migration: not applied.
- Production migration ledger: unchanged.
- No index removals, branch resets, paid branch creation, or migration replay.

## Next action

Finalize the V1.0 region rule from the controlling Master Project Control Document, then prepare the complete request/review/resubmission SQL plus rollback and role-based regression SQL. Present that exact package for final approval before any production DDL.
