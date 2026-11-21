# NAASCONNECT — Organizational Foundation Implementation

**Status:** Implemented and verified  
**Date:** 21 November 2026  
**Supabase project:** NAAS (`csytneubatlaakpmnsfk`)  
**GitHub repository:** `TremendousGuru/NAAS`

## Scope delivered

This is the first database foundation slice. It establishes the flexible organizational tree and scoped membership authorization required by the approved NAASCONNECT architecture.

### Organizational hierarchy

- National
  - Union
    - Zone
      - Campus
      - Church

The schema intentionally does not preload the full state/conference/institution directory. The supplied territorial list contains areas that still require authoritative validation. The hierarchy is data-driven so national administrators can add verified unions, zones, campuses and churches later without schema changes.

### Tables

- `public.org_units`: organization identity, parent-child hierarchy, type, status, geography/contact metadata and timestamps.
- `public.org_memberships`: user-to-organization membership, scoped role, approval state and approver references.

### Security

- RLS enabled on both public tables.
- No `anon` table grants.
- Authenticated users can discover active organizations.
- Members can read their own membership; scoped administrators can read membership rosters within their authority.
- Scoped administrators can create pending child organizations and pending memberships within their jurisdiction.
- Administrative scope is inherited down the organizational tree: national administrators can manage descendants; union administrators can manage descendants of their union; zone administrators can manage descendants of their zone; campus/church administrators are confined to their own unit.
- Role-to-organization-type validation prevents assigning a campus role to a union or vice versa.
- Parent-type validation enforces the approved hierarchy.
- The authorization helper is kept in the non-exposed `private` schema, uses a fixed empty search path, and is executable only by authenticated users.
- No user-editable Auth metadata is used for authorization.

## Verification performed

1. Confirmed the target Supabase project is `ACTIVE_HEALTHY`.
2. Confirmed the public schema started with no application tables.
3. Created both foundation tables and confirmed they exist.
4. Confirmed RLS is enabled on both tables.
5. Confirmed six RLS policies are installed.
6. Confirmed the `anon` role has no SELECT grants on either table.
7. Confirmed authenticated SELECT grants are present.
8. Confirmed exactly one active national root organization exists: `naas-nigeria`.
9. Tested rejection of a union without a national parent.
10. Tested rejection of a campus directly under the national root.
11. Ran a transactional role-scope test using temporary Auth users and temporary organization records:
    - A zone administrator could administer their own zone.
    - The same zone administrator could not administer a sibling zone.
    - Creating a pending campus under their own zone succeeded.
    - Creating a pending campus under a sibling zone was rejected by RLS.
    - All temporary test records were rolled back.
12. Re-ran Supabase security, performance and health advisors.

## Advisor results

- **Security:** no findings.
- **Health:** no findings.
- **Performance:** no unindexed foreign keys remain. The remaining INFO-level unused-index notices are expected at this stage because the tables contain only the national root and no real membership traffic yet; indexes are retained to support hierarchy traversal, membership lookups and foreign-key maintenance.

## Migration source

`supabase/migrations/20261121133000_org_foundation.sql`

The migration is committed to the repository. The live database was built with direct SQL and verified; the migration file is the version-controlled reproducibility artifact. It has not been represented as a CLI migration-history entry.

## Explicitly not yet implemented

These belong to later slices and must not be treated as complete:

- Organization registration/application and approval workflow.
- Member profile and basic student sign-up/email confirmation.
- Executive appointment records and formal handover requests/approvals at campus, zone, union and national levels.
- National notification when leadership transitions are approved.
- Full authoritative Nigerian state/conference/zone/institution directory.
- Church contact directory and WhatsApp joining links.
- Events, posts/status updates, chat, notifications, Bible and lesson-study resources.
- Audit event history and administrative reporting.

## Next implementation slice

Build the registration/application workflow and the member profile layer on top of this foundation. Preserve the principle that users may apply to establish an organization, but it must not become active or receive administrative authority until the correct higher-level administrator approves it.
