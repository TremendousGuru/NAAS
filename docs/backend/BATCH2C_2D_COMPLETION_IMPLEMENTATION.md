# Batch 2C / 2D Completion Implementation

**Date:** 28 November 2026  
**Branch:** feature/batch2c-2d-regional-completion  
**Supabase project:** csytneubatlaakpmnsfk

## Batch 2C — Community

- Personal member posts publish directly for users with an active NAAS membership.
- Organization announcements require an active administrator assignment at the selected organization.
- Optional post attachments reuse the existing private community-media bucket. Supported types: JPEG, PNG, WebP, GIF, MP4 and WebM. The application limit is 3 MB per file.
- Feed media uses short-lived signed URLs. Storage policies and community post RLS preserve the active-member and organization-descendant visibility rules.
- Reporting, duplicate-report protection, application-level report throttling, National global personal-post moderation and organization-scoped announcement moderation remain in place.
- Reporting does not mean every ordinary personal post is held for National pre-approval.

## Batch 2D — Events and in-app notifications

- Active members can submit events with a title, description, event mode, start/end time, optional venue/meeting link, registration deadline, capacity, registration requirement and optional cover image.
- Member-submitted events enter pending status and are not listed publicly until approved by the appropriate administrator. Personal/global submissions require National authority; organization events are reviewed within the parent/assigned organizational scope.
- Published events are visible only to active members in the applicable audience scope. Organization audience visibility includes descendants (for example, campus members can see events addressed to their Zone or Union).
- Registration is performed through a database function that locks the event row, checks membership, deadline and capacity, and prevents duplicate active registrations.
- Event publication and registrations generate in-app notifications. Members can mark their own notifications as read.
- Event covers reuse the private community-media bucket. Server Action request limit is 4 MB; the UI enforces a 3 MB file limit.
- Email, push, scheduled reminders, event cancellation workflows and member self-service registration cancellation are not represented as complete in this batch.

## Regional classification and hierarchy

- A normalized state coverage table maps all 37 Nigerian states/FCT to the currently configured 20 Zones and their three parent Union Conferences.
- The profile trigger assigns assigned_zone_id and assigned_union_id when a student saves their institution state, or a non-student saves their preferred church/administrative region.
- The assignment is a provisional administrative classification, not an approved campus/church membership. It does not create university records or grant access to an organization.
- Existing profile data was backfilled by the trigger. Read-only verification showed 37 state mappings across 20 Zones and 3 Unions; two existing member profiles are classified, while incomplete profiles remain unclassified.
- National, Union and Zone administrators can open the scoped hierarchy dashboard. It displays real organization counts, state coverage, classified profile totals, student totals and campus records. Campus/university records remain empty until the owner supplies the verified institution dataset.

## Database migrations applied and source files committed

- 20261128172428_batch2c_2d_events_and_regional_hierarchy
- 20261128172625_batch2d_event_scope_and_notification_hardening
- 20261128173023_batch2d_event_audience_scope_and_registration_notification_fix
- 20261128173150_batch3_scoped_regional_structure_summary
- 20261128173305_batch2c_org_announcement_descendant_visibility

Each new applied migration has a matching SQL source file in supabase/migrations on this branch. These are additive migrations and do not replay or rewrite the historical Stage 5.6 ledger entries. The four historical Stage 5.6 SQL statement payloads remain preserved in docs/backend/recovered-ledger-statements; the reconstructed drafts remain evidence artifacts, not migration-runner inputs.

## Verification status

- Database schema, state mapping count and hierarchical state grouping were checked against the live Supabase project.
- A sample regional descendant check confirmed that Abia Zone is inside Eastern Nigeria Union Conference and Lagos Zone is not.
- Full TypeScript/build/Playwright and controlled-account RLS acceptance tests are still required before merging this branch.
- Vercel currently reports a build-rate-limit failure for preview creation; a canceled/ignored build is not a successful deployment. Do not promote this branch to production until the CI and preview gates pass.
