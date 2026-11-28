# NAASCONNECT — Organization Portal Foundation & Access Readiness

**Date:** 28 November 2026  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-mobile-multipage-intro`  
**Scope:** National, union, zonal, institution/church administrator portals and ordinary member portal.

## Agreed organization model

```
National — Nigeria Association of Adventist Students
├── Western Nigeria Union Conference
│   └── 9 provisioned zones
├── Eastern Nigeria Union Conference
│   └── 8 provisioned zones
└── Northern Nigeria Union Conference
    └── 3 provisioned zones

Each zone may later contain approved campus / ASF and local church units.
```

This preserves the agreed hierarchy: National → Union → Zone → Campus / ASF and Church / Local Church. Campus and church are separate child organization types. Administrators can manage only their assigned organization and permitted descendants; lower-level administrators cannot access higher-level scopes.

## Verified live Supabase state

- `org_units`: 1 active national root, 3 pending union records, 20 pending zone records.
- `org_admin_seats`: 1 reserved national seat, 3 reserved union seats, 20 reserved zone seats.
- `org_memberships`: currently zero records; no administrator assignment has yet been activated.
- No named executive identities or email addresses have been supplied for appointment.
- No Auth accounts or passwords were created by this work.

The pending organization status is intentionally preserved: the seed migration marks this geography provisional pending formal confirmation. Portal scaffolding and reserved seats do not require promoting these records to active or inventing officers. The owner must explicitly approve any activation that makes these organization records discoverable to signed-in members.

## Frontend implementation committed

1. Administrator login now loads the signed-in user's active role assignments with their organization identity and type.
2. A requested portal must match the actual assigned role and organization type; choosing a portal never grants a role.
3. A single matching assignment routes to its exact organization dashboard.
4. Multiple assignments at the same level route to a new organization selector at `/admin/select`.
5. The admin dashboard now filters to the selected `org_id`, rather than combining all same-role organizations in one dashboard.
6. The existing member portal remains the ordinary member destination.
7. Existing National, Union, Zone, Institution/Chapter and Member portal entry points remain available from `/portals`.

Commits:
- `45846e6b7676c71499da3181e1f6b752ffbcfa96` — resolve administrator login to assigned organization scope.
- `4b50d9520f1dc150725a52191e553a434d5cfa26` — enforce selected organization isolation in the dashboard.
- `96a789071dd760231eb3b87a670f6e7e8e980ff4` — add multi-organization assignment selector.

## Important operational distinction

The portal routes are now wired to the existing authorization model, but they are not yet usable by national/union/zone officers because there are no active admin memberships. The 24 seats are reserved, not accounts.

The existing Stage 5.3 backend appointment and invitation workflow is present. The frontend appointment submission/review/invite and acceptance screens remain outstanding, as recorded in `docs/backend/STAGE5_3_ADMIN_APPOINTMENTS.md`. The first national administrator also requires the documented owner/church-authority bootstrap because the national seat cannot approve itself.

The next required implementation slice is the scoped administrator onboarding UI:
- National bootstrap/appointment screen for the verified first national appointee.
- National administrator can nominate and submit union presidents for the three union seats.
- Union administrator can nominate zone presidents for only its own nine/eight/three zone seats.
- Parent authority reviews the nomination.
- Approved nominee receives an individual invitation; nominee accepts, verifies email and activates the assigned role.
- First login requires personal password setup and completion of executive profile.
- Dashboard loads only after the active assignment exists.
- Executive portfolio and appointment management are configured by the appointed president; no names, EXCO profiles or portfolios are fabricated.

## Batch placement

This portal architecture and login segmentation is a prerequisite foundation for the remaining Batch 2 workspace and should be completed before Batch 3. The underlying organization records, seat reservations, approval RPCs and executive portfolio backend belong to the existing Stage 5 foundation. Their frontend onboarding and operational verification are still open; do not mark them complete merely because the portal links render.

## No database changes

This pass changed GitHub frontend code and documentation only. No Supabase migration, SQL write, organization activation, membership insertion, invitation, Auth user creation or credential operation was performed.

## Acceptance requirements

- GitHub quality gate passes.
- National, union, zone and institution portal login rejects wrong-role accounts.
- Each union/zone administrator sees only their assigned organization and descendants.
- A user with multiple same-level assignments can select one; switching scope remains constrained to active assignments.
- Member login remains unchanged.
- Appointment, review, invitation and acceptance flows pass end-to-end with verified test accounts.
- Mobile and desktop navigation and all five portal entry points pass Playwright checks.
