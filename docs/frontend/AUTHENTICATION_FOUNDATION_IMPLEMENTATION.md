# NAASCONNECT authentication foundation — implementation record

**Branch:** `feature/naasconnect-frontend-foundation`  
**Delivery:** Initial authenticated application shell (not a production launch approval)  
**Backend project:** `csytneubatlaakpmnsfk` (NAAS, eu-west-1)

## Delivered in this increment
- Copied the repository's official NAASCONNECT, NAAS and Adventist logo assets into `public/brand/`; copied the official favicon to `public/favicon.ico`.
- Updated application metadata to use the public favicon.
- Added a five-second branded launch screen that routes a valid session to `/app` and a visitor to `/login`.
- Added Supabase SSR browser/server clients using the publishable key only.
- Added Next.js middleware session refresh and protection for `/app` and `/admin`.
- Added email/password sign-in, email registration, confirmation callback, password reset request, password update and sign-out actions.
- Added a protected authenticated app route that reads the signed-in profile and active memberships.
- Added the Supabase public URL and publishable key to Vercel environments; added the canonical site URL for email redirects. No service-role key was added to Vercel or browser code.

## Existing backend facts confirmed before wiring
- The live Supabase project already contains profiles, organization units, memberships, reserved administrator seats, applications, appointment requests, leadership workflows/history, membership transfers/events and community statuses.
- RLS is enabled on all listed public application tables; scoped policies call private authorization helpers such as `private.can_administer_org`.
- There are 24 reserved administrator seats and 24 organization rows; there are no membership rows yet.
- The existing `admin-appointment` Edge Function is active and JWT verification is enabled.
- The Stage 5.2 onboarding documentation explicitly says administrator seats are not Auth users and no administrator credentials have been provisioned.

## Explicitly not completed by this increment
- No administrator Auth users were created. The 24 reserved seats need verified appointee names and unique email addresses and must be activated through the approved invitation/appointment flow.
- No shared/default password has been placed in code or database. The historic temporary password policy is not safe to distribute as a universal login; individual invitation links and forced password setup are the production path.
- Supabase Auth email confirmation, production SMTP sender, allowed redirect URLs, password policy and site URL still need dashboard configuration and end-to-end email verification.
- The member shell and administrator screens still contain preview/sample content. Their business modules are not yet fully connected to live records or all approved RPCs.
- Administrator UI visibility is not a security boundary. Every action must be authorized by the server and existing RLS/RPC policies.
- General audit-log Phase 5.9 remains outside this increment and must not be treated as implemented by the placeholder audit-history screen.
- No database migrations, schema changes, production data changes or Edge Function deployments were made.

## Verification / release gate
- Vercel preview deployment created from the recorded feature branch commit; build result must be checked before treating this increment as verified.
- Complete browser/device testing, email confirmation, password reset, session refresh, authorization negative tests and scoped admin workflow tests before production promotion.
- The provisional geography / organization seed must be confirmed by NAAS before public institutional launch.
