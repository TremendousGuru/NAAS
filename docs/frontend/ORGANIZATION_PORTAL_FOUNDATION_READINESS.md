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
- A confirmed member account with a durable profile can enter the member workspace before requesting or receiving an organizational membership.
- A profile-incomplete member can enter and complete setup; a member with no affiliation sees the membership-request empty state.
- Pending membership remains pending and does not become an active membership through login.
- National, Union, Zone and Institution portal checks remain assignment-based and reject accounts without the matching active administrator role.
- Appointment, review, invitation and acceptance flows pass end-to-end with verified test accounts.
- Mobile and desktop navigation and all five portal entry points pass Playwright checks.

## Portal separation correction — 28 November 2026

### What was wrong
The shared sign-in action authenticated credentials before validating portal assignment and did not clear the session when the account lacked an assignment for the selected portal. Middleware also redirected any authenticated visitor away from `/login`, preventing a user from deliberately switching portal entry points.

### Implemented correction
- Every portal now has a portal-specific login experience and visual identity: member (white/light), national (navy/gold), union (green), zone (teal), institution/campus/church (purple).
- Administrative portals no longer expose public self-registration. Administrator accounts are invitation/appointment-only; an authorized appointing authority must create the assignment and invite the nominee.
- Sign-in starts by clearing any previous session, then authenticates the submitted credentials and verifies an active `org_memberships` assignment for the selected portal and matching organization type.
- The member portal accepts a confirmed Supabase Auth identity when its durable `profiles` row exists. It does not require an approved campus/church membership merely to enter the member workspace; membership requests remain pending until an authorized organization approves them.
- National, Union, Zone and Institution portals continue to require their corresponding active administrator membership assignment and matching organization type.
- National, Union, Zone and Institution portals accept only their corresponding active administrator roles and matching organization types.
- A mismatch signs out the session and returns a portal-specific error. It cannot fall through to the member workspace.
- Middleware no longer forces an authenticated user away from the portal-selection/login page, so a deliberate portal switch is possible. Protected server routes still perform their own authorization checks.
- Multi-assignment administrators are sent to the organization selector and can only see their own active assignments.

### Important identity model
The login credential is a Supabase Auth identity; portal authorization is a separate, database-backed active assignment. The same Auth identity can legitimately enter more than one portal only if it has an active assignment in each. If NAAS requires completely separate human identities per portal, each portal must be provisioned with a separate invited Auth account/email and its own scoped assignment; the login UI cannot manufacture that separation.

### Operational access / preview limitation
A National/Union/Zone/Institution administrator cannot self-register or gain access merely by visiting a portal. The portal interface is available at its entry point, but the live workspace requires an active appointment. Do not create a universal test password or bypass RLS to make the dashboards appear accessible. A safe read-only demo/preview identity can be provisioned separately if stakeholder visual inspection is needed.


## Member authentication correction — 28 November 2026

### Verified cause
The live Supabase project has three confirmed Auth identities and three linked profile rows, but zero rows in `public.org_memberships`. The sign-in action previously required an active `member` or `church_member` assignment even for the ordinary member portal. That made a successfully registered member account appear to have invalid portal credentials before it had an opportunity to request an organizational affiliation.

### Corrected contract
- Member portal access requires a valid Supabase Auth session and the user's durable `profiles` row.
- An approved organization membership is not a prerequisite for entering the member workspace.
- Incomplete profiles can enter and complete setup; users with no organization membership see the existing membership empty state and request workflow.
- Membership approval, directory eligibility, posting permissions and other organization-scoped actions remain governed by their existing database RPC/RLS checks.
- Administrator portals still require active, matching role assignments and organization types. This correction does not weaken administrator authorization.
- No database records, memberships, roles, admin seats or credentials are created by this frontend correction.
