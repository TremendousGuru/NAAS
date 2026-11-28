# NAASCONNECT Stage 5.3 — Administrator Appointment & Activation
## Implemented
- `admin_appointment_requests` records nominee, jurisdictional review, invitation and acceptance states.
- `submit_admin_appointment` requires authentication and verifies authority over the seat's approval organization.
- `review_admin_appointment` allows only the higher-level authorized administrator to approve/reject.
- Approval moves the seat to `awaiting_appointee`; rejection returns it to `reserved`.
- The JWT-protected `admin-appointment` Edge Function sends invitations for approved nominees and activates a pending admin membership only after the invited user signs in and accepts.
- The service-role key remains server-side.
- RLS permits the requesting administrator and the relevant approval authority to read requests; anonymous access is revoked.

## Required before real invitations
- Configure production SMTP and Supabase Auth email provider.
- Configure Site URL and redirect allow-list for the production Vercel domain.
- Set Edge Function secret `APP_ORIGIN` to the exact production origin.
- Confirm function environment contains Supabase URL, anon key and service-role key.
- Nominees must set their own personal passwords; do not distribute a shared default password as a reusable credential.

## First national administrator bootstrap
There are currently no active administrator memberships. The national seat's approval authority points to the national root, so it cannot self-approve its first administrator. That first appointment requires a separately controlled owner/church-authority verification and bootstrap. Subsequent appointments follow the normal approval chain.

## Remaining
- Frontend appointment/review/invite screens and invitation acceptance UI.
- Mandatory profile/password completion UX.
- Leadership handover workflow is implemented in `docs/backend/STAGE5_4_LEADERSHIP_HANDOVER.md`.
- End-to-end tests using real accounts at each level.
- SMTP delivery test after configuration.

Applied migrations:
- `supabase/migrations/20261121132238_stage5_3_admin_appointment_approval_engine.sql`
- `supabase/migrations/20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql`

## Frontend completion update — 28 November 2026

Implemented in `feature/naasconnect-mobile-multipage-intro`:
- `/admin/onboarding`: lists only RLS-visible reserved seats and appointment requests; authorized administrators can nominate, approve/reject and send invitations through the existing RPC and Edge Function.
- `/admin/invitation`: verifies the signed-in user matches the invited user ID and exact invited email.
- `/admin/invitation/complete`: requires the invitee to set a personal password (minimum 12 characters) and complete their display name/phone profile before the acceptance Edge Function activates the membership and seat.
- The server action rechecks request ownership/status before password/profile changes; the Edge Function independently verifies invitation ownership before activation.
- Onboarding supports national, union, zone, campus and church administrator roles. The database remains the authority for which seats/requests are visible and which actions are permitted.

## Still externally dependent / not declared complete
- The first national administrator bootstrap cannot be self-approved and remains blocked until the designated NAAS/church authority identity is formally verified and the controlled bootstrap is completed.
- Production Supabase Auth SMTP, Site URL, redirect allow-list and Edge Function `APP_ORIGIN` must be configured and email delivery tested.
- No administrator has been appointed, invited or activated in production. No names/emails were supplied, and no account/credentials were created by the code changes.
- Real-account end-to-end tests for each jurisdiction and a full invitation-email acceptance test remain necessary after configuration.


## 6. Follow-up hardening — 28 November 2026

The deployed `admin-appointment` Edge Function is now version 4 (`verify_jwt=true`). The update hardens the invitation lifecycle without changing the database schema:

- The invitation action validates the request UUID and requires a completed approval record.
- Before sending an invitation, it rechecks that the signed-in inviter still has an active administrator membership at the seat's approving organization. Historical visibility as the original nominator is not sufficient.
- The invitation record is marked `invited` before the optional pending-membership upsert, so a failed pending write does not cause the system to send a second invitation on retry.
- Acceptance verifies the invited auth user ID and email, then upserts the active organization membership. This makes acceptance retry-safe if an earlier attempt stopped between membership, seat and request updates.
- The function keeps JWT verification enabled and no longer falls back to wildcard CORS when `APP_ORIGIN` is missing.

The live function was re-read after deployment and confirmed at version 4. The appointment queue currently has no requests; no nominee invitations or administrator assignments were created by this update. Controlled-account invite/accept testing is still required before declaring this workflow fully accepted.
