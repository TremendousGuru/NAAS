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
- `org_memberships`: one active `national_admin` assignment has been provisioned for the project owner's initial National administrator. No Union or Zone administrator memberships are active yet.
- The initial National administrator account is owner-provisioned and has successfully signed in. No Union or Zone nominee identities have been supplied yet; their accounts must be created through the invitation workflow.

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

The portal routes are wired to the existing authorization model. The initial National administrator has signed in successfully. The National seat is active; the three Union and twenty Zone seats remain reserved and are not active administrator accounts.

The Stage 5.3 backend appointment and invitation workflow and its frontend nomination, review, invitation and acceptance screens are present. End-to-end testing with controlled Union and Zone nominees remains outstanding. The first National administrator was provisioned directly by the project owner because the National seat cannot approve itself.

The remaining onboarding work is operational verification of the scoped workflow:
- National administrator nominates and submits Union presidents for the three Union seats.
- Each Union administrator nominates Zone presidents only for its own nine/eight/three Zone seats.
- Parent authority reviews the nomination.
- Approved nominee receives an individual invitation; nominee accepts, verifies email and activates the assigned role.
- First login requires personal password setup and completion of executive profile.
- Dashboard loads only after the active assignment exists.
- Executive portfolio and appointment management are configured by the appointed president; no names, EXCO profiles or portfolios are fabricated.

## Batch placement

Portal login segmentation is implemented and the National entry path is confirmed by the owner. Union/Zone onboarding and scoped isolation tests remain open. The Batch 3 organization-management slice has now started with a live, read-only scoped organization overview; the underlying database schema remains unchanged.

## Database and deployment safety

No schema migration or organization activation was applied during this portal and Batch 3 UI work. The initial National administrator's Auth metadata, profile, active membership and reserved seat were provisioned/activated through the owner-controlled setup process on 28 November 2026. The three Union and twenty Zone organization records remain pending, and their seats remain reserved. Production migration history remains frozen pending the documented source-integrity recovery gate.

## Acceptance requirements

- GitHub quality gate passes.
- National, union, zone and institution portal login rejects wrong-role accounts.
- Each union/zone administrator sees only their assigned organization and descendants.
- A user with multiple same-level assignments can select one; switching scope remains constrained to active assignments.
- Member login remains unchanged.
- Appointment, review, invitation and acceptance flows pass end-to-end with controlled Union and Zone test accounts.
- Mobile and desktop navigation and all five portal entry points pass Playwright checks.

## Portal separation correction — 28 November 2026

### What was wrong
The shared sign-in action authenticated credentials before validating portal assignment and did not clear the session when the account lacked an assignment for the selected portal. Middleware also redirected any authenticated visitor away from `/login`, preventing a user from deliberately switching portal entry points.

### Implemented correction
- Every portal now has a portal-specific login experience and visual identity: member (white/light), national (navy/gold), union (green), zone (teal), institution/campus/church (purple).
- Administrative portals no longer expose public self-registration. Administrator accounts are invitation/appointment-only; an authorized appointing authority must create the assignment and invite the nominee.
- Sign-in starts by clearing any previous session, then authenticates the submitted credentials and verifies an active `org_memberships` assignment for the selected portal and matching organization type.
- The member portal accepts only active `member` or `church_member` memberships in campus/church organizations.
- National, Union, Zone and Institution portals accept only their corresponding active administrator roles and matching organization types.
- A mismatch signs out the session and returns a portal-specific error. It cannot fall through to the member workspace.
- Middleware no longer forces an authenticated user away from the portal-selection/login page, so a deliberate portal switch is possible. Protected server routes still perform their own authorization checks.
- Multi-assignment administrators are sent to the organization selector and can only see their own active assignments.

### Important identity model
The login credential is a Supabase Auth identity; portal authorization is a separate, database-backed active assignment. The same Auth identity can legitimately enter more than one portal only if it has an active assignment in each. If NAAS requires completely separate human identities per portal, each portal must be provisioned with a separate invited Auth account/email and its own scoped assignment; the login UI cannot manufacture that separation.

### Operational access / preview limitation
A National/Union/Zone/Institution administrator cannot self-register or gain access merely by visiting a portal. The portal interface is available at its entry point, but the live workspace requires an active appointment. Do not create a universal test password or bypass RLS to make the dashboards appear accessible. A safe read-only demo/preview identity can be provisioned separately if stakeholder visual inspection is needed.
