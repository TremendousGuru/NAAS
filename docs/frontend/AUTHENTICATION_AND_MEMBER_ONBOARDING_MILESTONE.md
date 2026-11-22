# NAASCONNECT Nigeria — Authentication, registration and member application milestone

**Branch:** `feature/naasconnect-frontend-foundation`
**Architecture authority:** V1.0 system architecture and approved decision register
**Supabase project:** `csytneubatlaakpmnsfk`
**Status:** Implemented in application code; preview build and real-account journey verification pending

## Root cause of the reported login stall

The authenticated route `app/app/page.tsx` imported `HomePage` from `app/page.tsx`. The root page rendered `SplashGate`, whose session check redirected authenticated users to `/app`. This caused an authenticated redirect loop:

`signIn -> /app -> SplashGate -> /app -> ...`

The root page is now a dynamic server component that verifies the Supabase user and routes to `/app`; the authenticated route now renders the actual member workspace rather than the root splash page.

## Delivered

- Server-side session verification for the authenticated member route.
- Correct root routing; no client-side timer is used to decide whether an authenticated user may enter the app.
- Sign-in validation and clearer generic errors without exposing Auth internals.
- Sign-up captures full name, phone, email, password and membership category.
- Student path captures state of study/admission, institution, course and study level.
- Non-student path captures residential state and preferred regional state.
- Registration metadata uses both `display_name` and `full_name`, matching the existing Auth profile trigger's accepted metadata keys.
- Email confirmation callback exchanges the PKCE code, verifies the user, and upserts the profile using columns already present in `public.profiles`.
- Callback rejects protocol-relative redirect destinations to prevent open redirects.
- Password reset request and password update screens retained.
- Authenticated member dashboard reads the signed-in profile, the user's own membership rows, and active global statuses through the existing RLS policies.
- Text status publishing is available only to users with an active membership; the server action verifies the user and active membership, while the existing database INSERT policy independently enforces the same boundary.
- Supplied KJV and 4th Quarter 2026 Lesson Study PDF assets are linked from the member workspace.
- Existing color system, typography direction, logo assets and favicon are retained.

## Live Supabase evidence inspected (read-only)

- Supabase Auth profile trigger creates `profiles` rows from `raw_user_meta_data.full_name` or `name`; the previous sign-up action supplied only `display_name`, causing the trigger to fall back to the email local-part.
- `profiles` currently contains `display_name`, `phone`, `institution_name`, `course_of_study`, `level_of_study`, `state_of_origin`, and `profile_completed`.
- `org_memberships` currently contains zero rows.
- The live organization table contains 24 provisional records: one national root, three union records and twenty zone records. The 23 subordinate union/zone records are currently `pending`; there are no active campus or church records in the inspected data.
- The existing self-membership INSERT policy only permits a pending basic-member request for an active campus or church. It does not permit self-creation of union/zone membership or administrator roles.
- The Global Status read policy permits authenticated users to read unexpired statuses globally. The INSERT policy requires the author to be the current user and an active membership for individual publishing. Organization publishing is checked by the existing scoped `private.can_administer_org` authorization helper.
- RLS is enabled on the inspected application tables.
- The current schema has no durable `member_category` or `state_of_admission` columns on `profiles`; the registration classification and admission/residence region are therefore preserved in Supabase Auth user metadata for now. These metadata fields are descriptive onboarding data only and must never be used to authorize access.

## Deliberate boundaries

- Account creation is not membership approval.
- Email verification does not grant membership, executive status or administrator authority.
- The provisional geography records are not treated as verified or active organizations.
- The app does not fabricate campus or church memberships where the live database has no active campus/church organizations.
- A user cannot self-approve a membership or assign themselves an administrative role.
- Status publishing remains unavailable until an active membership exists.
- No Supabase database write, migration replay, migration-ledger edit, paid branch, or Edge Function deployment was performed in this milestone.

## Remaining work before the onboarding journey is fully complete

1. Design and approve a durable member onboarding-intake record for student/non-student classification and preferred zone/campus/church. Current Auth metadata is not a substitute for a formal review queue.
2. Approve and verify provisional unions/zones and add the real campus/ASF and church organization records through authorized onboarding.
3. Add an authorized, transactional membership-request path that can route applicants to the correct jurisdiction without allowing self-approval.
4. Add member-facing profile editing and multi-membership request/transfer screens.
5. Add status media upload, view tracking, reactions and moderation, using private storage policies and approved retention limits.
6. Connect real admin review queues, org management, leadership appointments and audit reporting to their existing RPCs.
7. Verify SMTP, Auth email confirmation, Site URL and redirect allowlist in Supabase dashboard.
8. Complete controlled-account positive and negative tests for session, onboarding, membership and scope boundaries.

## Verification required

- Confirm the Vercel deployment for the current branch commit reaches READY.
- Test a new registration for both student and non-student paths using controlled accounts.
- Confirm the confirmation link returns to the correct Vercel domain, creates the profile, and signs the user in.
- Confirm existing account sign-in reaches the member dashboard without a redirect loop.
- Confirm an unconfirmed user cannot sign in when email confirmation is enabled.
- Confirm unaffiliated users can read global statuses but cannot publish.
- Confirm a user with an active membership can publish a text status and the status expires according to the database default.
- Confirm no ordinary member can see another user's private profile or unrelated membership rows.

**This milestone is not a production launch approval.**
