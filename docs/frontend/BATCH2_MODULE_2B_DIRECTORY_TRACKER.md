# Batch 2B — Association and Church Directories

**Repository:** `TremendousGuru/NAAS`  
**Working branch:** `feature/naasconnect-mobile-multipage-intro`  
**Controlling scope:** NAASCONNECT V1.0 dossier, Phase 6.2 Association directory/pages and Phase 6.3 Church directory/pages.  
**Status:** Existing member directory implementation hardened; acceptance and public-facing pages remain open.

## Existing implementation verified

| Capability | Evidence | Status |
|---|---|---|
| Authenticated directory route | `app/app/directory/page.tsx` | Present |
| Campus / ASF directory | `?type=campus`, active `org_units` records | Present |
| Independent church directory | `?type=church`, active `org_units` records | Present |
| Search and state filter | Search form and state selector | Present; currently filtered after fetching a capped set |
| Organization detail page | `app/app/directory/[id]/page.tsx` | Present |
| Organization contact links | Email, validated HTTP(S) website/WhatsApp links | Present |
| Member eligibility messaging | Student/non-student and region/institution matching | Present |
| Membership request action | `requestDirectoryMembership` server action / database RPC | Present; actual database policy remains authoritative |
| Inactive listing suppression | Directory and detail queries constrain `status = active` | Present |
| Completed-profile gating | Directory/detail now require durable `profiles.profile_completed = true` before presenting request eligibility | Hardened in this pass |

## Changes committed in this pass

- Directory list now selects the durable `profile_completed` flag and does not present a member as eligible when the profile read fails or the profile is incomplete.
- Organization detail now explicitly requires a successfully read, completed profile before enabling the membership request path.
- Membership submission remains enforced by the database RPC/RLS; frontend checks are user guidance, not a replacement for backend authorization.
- No Supabase DDL, migration, storage bucket, or production data was changed.

Commits:
- `2b1e754d4a6f8c67ffbe4b097732d503e66414ed`
- `fec4c2e2a1250498a8bed7202b2fdaa9ed223da5`

## Remaining work before 2B acceptance

1. Decide and implement the approved public-facing association/campus/church detail surface; current directory is authenticated under `/app`.
2. Replace client-side filtering of only the first 250 active organizations with server-side filtering and pagination so large directories are complete and scalable.
3. Add deterministic empty, loading, read-error and invalid-organization states.
4. Verify all organization types and hierarchy display correctly without hard-coded union/zone assumptions.
5. Verify contact fields and external links against real records and sanitize all displayed destinations.
6. Test member eligibility for student, non-student, incomplete-profile, mismatched-institution, mismatched-region and existing/pending membership scenarios.
7. Verify database RLS/RPC denies unauthorized or cross-scope membership requests regardless of frontend state.
8. Add Playwright coverage for campus/church tabs, search, state filter, pagination, detail navigation, mobile layout and membership request outcomes.
9. Confirm accessible labels, keyboard navigation, focus states and no horizontal overflow on mobile.
10. Pass GitHub quality gate and Vercel preview checks.

## Database and safety boundaries

- GitHub remains the source of truth for application structure; Supabase live schema remains the source of truth for deployed data structures.
- Do not apply new production migrations while the V1 migration source-integrity/recovery gate remains unresolved.
- Do not create a paid validation branch. The owner will perform environment testing.
- Do not mark public pages, scale pagination, RLS acceptance or end-to-end membership outcomes complete until implemented and verified.

## Completion rule

2B is accepted only after public/member directory scope is delivered, large-directory search is complete, all member eligibility and backend authorization scenarios pass, responsive/browser checks pass, and the GitHub/Vercel quality gates are green.
