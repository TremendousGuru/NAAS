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
- Leadership handover workflow (separate process).
- End-to-end tests using real accounts at each level.
- SMTP delivery test after configuration.

Migration: `supabase/migrations/20261121142100_stage5_3_admin_appointment_approval_engine.sql`
