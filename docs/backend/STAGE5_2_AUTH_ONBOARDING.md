# NAASCONNECT Stage 5.2 — Authentication and Onboarding Foundation

## Database implementation
- `profiles`: private, per-user profile fields; users can read/update only their own row.
- An `auth.users` insert trigger creates a minimal profile using display-name metadata only. It does not assign roles or privileges.
- `org_applications`: records applications to establish unions, zones, campuses and churches. The applicant can read their own application; the administrator chain for the parent organization can review it.
- `org_memberships`: users can request basic membership in an active campus or local church. Requests are always pending and constrained to the basic member role (church requests use `church_member`). This does not grant access until an authorized administrator approves the membership.
- Anonymous table access is revoked and RLS is enabled on both new tables.
- Membership INSERT authorization is consolidated into one policy; application foreign-key columns are indexed.

## Approval routing encoded
The applicant selects a parent organization:
- Union application → national parent administrator.
- Zone application → union parent administrator.
- Campus or local church application → zone parent administrator.

The database records the application and enforces who can read/review it through the existing `private.can_administer_org(parent_org_id)` helper.

## Important boundary
These migrations do not create or activate Auth users for the 24 reserved administrator seats. They do not create administrator credentials. The agreed temporary handover password is not stored in the database. Admin activation must be implemented as a trusted server-side workflow after identity and appointment verification.

## Still required before production
1. Confirm Supabase Auth email confirmation is enabled.
2. Configure allowed production and preview redirect URLs.
3. Configure a production email sender (SMTP) and branded confirmation template.
4. Implement server-side invitation/activation for administrator seats using Supabase Auth Admin API; never expose a secret/service-role key in the browser.
5. Implement an atomic approval operation that creates/activates the organization or membership and records reviewer identity/time. Applicants must not be able to self-approve.
6. Add integration tests for applicant, unrelated user, correct jurisdiction admin, wrong jurisdiction admin, and unauthenticated access.

## Applied migration files
- `supabase/migrations/20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql`
- `supabase/migrations/20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql`
- `supabase/migrations/20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql`
