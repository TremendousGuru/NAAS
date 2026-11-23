# NAASCONNECT frontend stabilization and Batch 2 preparation

**Date:** 2026-11-23  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Vercel project:** `naasconnect-nigeria`  
**Supabase project:** `csytneubatlaakpmnsfk`

## Stabilization changes committed

1. Signup now preserves the non-student preferred church region in Auth metadata as `preferred_region_state`, while keeping `residential_state` separate. The selected state remains category-specific: student admission state versus non-student preferred region.
2. Added `app/app/MemberProfileForm.tsx`, a client-side profile editor that shows only the relevant section after category selection:
   - Student: institution, course, level, state of admission.
   - Non-student: residential state and preferred church region.
   - Existing signup metadata is used as a safe initial value when a durable profile has not yet been completed.
3. The member page now derives the category from the durable profile first, then Auth metadata while onboarding is incomplete. Organization filters use that resolved category.
4. Added a clearer profile form hierarchy, accessible field grouping, input focus states and mobile single-column layout.
5. No Supabase schema changes or migrations were made during this stabilization pass.

## Database facts rechecked

- The live `profiles` table contains `member_category`, `state_of_admission`, `residential_state`, and `preferred_region_state`.
- RLS is enabled on `profiles`.
- Authenticated users have own-row SELECT, INSERT and UPDATE policies.
- The live runtime error aggregation returned no errors for the last 24 hours at inspection time.

The user-reported profile loading alert is emitted when the profile SELECT returns an error. The current page query's selected columns are present in the live schema and the own-row SELECT policy exists. A controlled authenticated browser session is still required to prove the actual user flow and isolate any remaining session/PostgREST/runtime issue; no fake successful profile save is claimed.

## Latest commit and deployment

Latest stabilization commit at documentation time: `aca74374f2623fc528190859b564185854d0fcc0`.

Vercel automatically queues a preview for commits on the feature branch. The last deployment queried before the final commit was still BUILDING and its GitHub Vercel/predeploy checks were pending. The final commit has therefore **not** yet been verified READY. Do not promote to production until the preview is READY, visual QA passes and controlled-account tests pass.

## Required stabilization acceptance tests

- Create a student account, verify email, sign in, confirm profile form defaults to Student, save profile and reload.
- Create a non-student account, verify email, sign in, confirm profile form defaults to Non-student, save residential and preferred-region fields independently, reload and confirm both values persist.
- Confirm campus list appears only for students and church list only for non-students.
- Submit an eligible request and confirm pending state; attempt an ineligible organization and confirm database rejection.
- Confirm profile SELECT and UPDATE work under authenticated RLS, and that another user cannot read or update the profile.
- Inspect screenshots at desktop and mobile widths; verify logo, intro, overflow, form controls, focus, and responsive navigation.
- Verify administrator routes and actions using controlled accounts before enabling any decision UI.

## Batch 2 — preparation only; no feature implementation started

The V1 dossier's Phase 6 is the source of truth for the next core member/community feature batch. Proposed scope is to be refined into small deliverable slices:

### Batch 2A — Member workspace and profile completion
- Finish the member dashboard information architecture and profile completion states.
- Membership history, pending/rejected/active states and permitted resubmission.
- Account settings and session/security affordances.
- Reuse the existing `profiles`, `org_memberships` and `membership_events`; do not duplicate lifecycle data.

### Batch 2B — Organization and church directories
- Member-facing association/campus directory and independent church directory.
- Search, filters, organization detail pages and eligibility-aware calls to action.
- Reuse existing `org_units` hierarchy and existing scoped directory RPCs where appropriate.
- Preserve organization visibility and administrator jurisdiction boundaries.

### Batch 2C — Community experience
- Distinguish the existing 24-hour global Status feature from the broader moderated community feed and announcements.
- Plan author identity, organization representation, report/moderation, media handling and retention.
- Reuse existing community/status backend where it fits; do not assume media upload, reactions or moderation already exist.

### Batch 2D — Events and notifications (design/implementation sequencing to be agreed)
- Events/calendar and notification inbox/preferences are later Phase 6 capabilities.
- No messaging schema or new notification delivery system should be invented before checking the dossier and live schema.

## Batch 2 technical gates

- Inspect the existing schema, RPCs, RLS, storage buckets and migration ledger before proposing backend changes.
- The migration source-integrity/synchronization gate documented in the dossier remains unresolved. Do not replay, rename, reconstruct as original, or apply migrations; do not create paid Supabase branches.
- Prefer existing backend contracts. If new DDL is genuinely required, prepare exact SQL and security checks for separate review and approval before applying.
- Keep the existing GitHub branch, Vercel project, Supabase project, visual identity and V1.0 authorization boundaries.
- All feature commits must pass the existing predeploy quality gate, Vercel preview build, desktop/mobile visual tests and controlled end-to-end checks before release.

**Status:** Stabilization code committed; Vercel preview and authenticated visual/functional acceptance remain pending. Batch 2 is documented for preparation only and has not been implemented.
