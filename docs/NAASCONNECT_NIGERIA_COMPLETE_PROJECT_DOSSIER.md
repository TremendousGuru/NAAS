# NAASCONNECT NIGERIA — COMPLETE PROJECT MASTER DOSSIER
Compiled 22 November 2026 | Controlling baseline: NAASCONNECT Nigeria V1.0
Product name must always be written NAASCONNECT (never NASCONNECT).
Organization: Nigeria Association of Adventist Students (NAAS).
GitHub: https://github.com/TremendousGuru/NAAS
Supabase project ref: csytneubatlaakpmnsfk (project NAAS; recorded region eu-west-1; PostgreSQL 17).
Vercel project: naasconnect-nigeria (previously reported SSO-protected; live production status not established).

## Executive answer: the project does not have to be abandoned
The migration-integrity problem is a source-control/deployment-provenance problem, not proof that the product cannot proceed. Schema-only export and a full restorable backup are safeguards before further production database writes. They do not block Figma UI/UX, frontend work against mock/API-contract data, local development, automated tests, documentation or handover planning.
The unsafe shortcut is to ignore the live database state and blindly run migrations against it. Keep production Supabase schema/data/history frozen. Continue design and frontend in a local/non-production environment. Later reconcile the backend after backup and a reviewed baseline plan. Do not delete the existing Supabase project or assume a clean slate.
A clean new Supabase project is an option for a future non-production baseline only after deciding how to preserve existing data and explicitly approving the target. Restarting the whole product is unnecessary; V1.0 and existing evidence remain valuable.

## 1. Product vision
NAASCONNECT Nigeria is a centrally coordinated digital platform connecting NAAS structures, Adventist Students Fellowships (ASF), participating local churches and individual members across Nigeria. It connects existing organizations; it does not replace, absorb or compete with their governance structures. It must ultimately be operable by NAAS leadership without ongoing developer intervention.
Principles: respect governance; one person/one account with multiple memberships; configurable hierarchy; scoped authority; approval before authority; secure-by-default RLS/server authorization; modular shared identity/organization/permission/notification foundations; auditable decisions; institutional ownership.

## 2. Organization hierarchy
Types: National NAAS → Union → Zone → Campus/ASF, with Local Churches connected according to verified church oversight and affiliation. Three Nigerian NAAS unions are represented. Do not hard-code geography. Do not assume every church is a child of a campus or every campus has one church. Model cross-affiliations explicitly. Missing geography must not block onboarding.

## 3. Identity, memberships and roles
Supabase Auth supplies identity. One person has one platform account/profile and can hold multiple memberships and scoped roles. Membership is separate from login and admin role. Roles: national/union/zone/campus/church administrator and executive; pastor/elder with limited church duties; ordinary member. Executive portfolios (president, VP, secretary, treasurer, chaplain, PRO, welfare, etc.) are scoped positions/appointments, not hard-coded permission systems.
Jurisdiction: national admins oversee national/authorized descendants; union admins their union/descendants; zonal admins their zone/descendants; campus admins their campus; church admins their church; executives only expressly granted capabilities; members their own account and member features. Lower levels cannot access peer/unrelated branches. UI hiding is not security: enforce server-side and RLS.

## 4. Onboarding and organization approvals
Individual onboarding: basic details, email verification, membership request/association with campus/church; email verification never grants admin authority. Organization application: submit details → pending (no authority) → correct jurisdiction review → approval creates/activates org/contact or rejection/correction with reason → audit. Campus → Zone; Zone → Union; Union → National. Church approval follows verified Conference/Mission/Region/church oversight, not assumed NAAS hierarchy.

## 5. Admin provisioning and handover
Each verified organization should have an admin access path. Admin appointment requires higher-level approval. The requested default password 123456789 is not safe for production and must not be hard-coded, committed or shared. Implement one-time secure invitation/provisioning, pending/limited state until approval, mandatory password setup/reset and profile completion, approver/timestamp audit, recovery/revocation/handover. Never store plaintext passwords.

## 6. Leadership appointments and handovers
Campus changes require Zone approval; Zone changes Union approval; Union changes National approval; National authority remains to be formally defined. Current leader submits transition and incoming team details; next higher authority approves/rejects; incoming leader confirms; new term activates and outgoing roles end by effective date; new leader appoints team subject to policy; notifications issue; immutable history remains. Rejection must not alter current authority.

## 7. Membership management (Stage 5.6)
Transfers between organizations; scoped transfer review/approval/rejection; member cancellation; suspension/reactivation/termination; lifecycle event history; scoped directory/search; aggregate statistics; organization review queues and reports. All operations must respect member/campus/church/zone/union/national jurisdiction. membership_events remains membership lifecycle/transfer history. leadership_history remains leadership succession history. Do not duplicate these in generic audit logs.

## 8. Community, posts and global Status/Stories
Persistent community feed supports individual and authorized organization posts/announcements with ownership/moderation. Explicitly approved WhatsApp-like global Status: every authenticated individual can post; authorized representatives can post for campus/church/zone/union/national; every authenticated account can view all statuses across the platform; default expiry 24 hours; author deletes own active status; view tracking/privacy policy; optional reactions; text/image/short video; configurable media/rate/retention limits; no unauthenticated public access by default. Stage 5.7 backend contains community_statuses and policy/grant hardening, but that does not prove UI, media uploads, viewer list, expiry scheduler, reactions or end-to-end completion.

## 9. Events, communication and notifications
Scoped organization events; group spaces for national/union/zone/campus/church; private one-to-one messaging was not assumed in initial release and requires separate approval. In-app/email notifications and optional web push for approvals, transitions, events/reminders and posts/statuses where enabled. User preferences control non-essential notifications. Backend event records do not prove delivery integration.

## 10. Spiritual resources and church connection
Bible reader and lesson-study resources with structured navigation. GitHub contains KJV PDF and 4th Quarter 2026 Lesson Study Guide PDF, but file presence does not mean a reader exists. Confirm licensing/attribution before public distribution. Church directory includes verified address, service information, approved contacts and optional WhatsApp links maintained by authorized reps; platform complements rather than replaces church channels.

## 11. Admin dashboards and audit
Dashboards: organization management, user/membership administration, application/review queues, admin appointments, leadership transitions, executive portfolios/terms, membership directory/reports, events/content moderation, notifications and audit history. General audit logs complement—not duplicate—membership_events, leadership_history and notification domain events. Audit retention, PII masking, read permissions, action/entity allowlists and metadata policy require approval before Phase 5.9.

## 12. Technical architecture
Next.js App Router, TypeScript, Tailwind CSS/reusable components; Figma-first design; Vercel hosting; GitHub source; Supabase PostgreSQL/Auth/Storage/Realtime; scoped RBAC + PostgreSQL RLS; Next.js server actions/route handlers and Edge Functions where appropriate; Supabase Cron or verified scheduler; configurable transactional email; Vercel/Supabase monitoring.
Request path: Browser → Next.js/Vercel → Supabase Auth → RLS-protected PostgreSQL, policy-protected Storage, authorized Realtime and server-side privileged workflows. Service-role/secret key never ships to browser or NEXT_PUBLIC variable. Use publishable browser key and server-only secrets. RLS on exposed tables, least privilege, explicit grants, secure uploads, signed private media and audit sensitive actions.

## 13. Figma-first UI process
Owner requires Figma before coding: confirm navigation/requirements; define design system; responsive wireframes; high-fidelity role-based screens; clickable prototypes for onboarding, approvals, leadership handover, transfers, statuses, events, directories and dashboards; owner review/approval; then frontend coding and visual/interaction tests. Approved logo/favicon are in GitHub root: NAAS CONNECT official Logo.png and Favicon (1).ico. Reuse approved assets; do not invent replacements. Spell NAASCONNECT exactly.

## 14. Recorded backend inventory and status
Recorded 14 public tables: org_units, org_memberships, org_admin_seats, profiles, org_applications, admin_appointment_requests, org_leadership_positions, leadership_handover_requests, leadership_history, leadership_notification_events, org_executive_portfolios, membership_transfer_requests, membership_events, community_statuses. RLS enabled on all 14 at the recorded reconciliation snapshot. Remote migration ledger recorded 29 entries. At one inspection org_units had 24 rows and org_admin_seats 24; org_memberships and profiles were empty. These are historical point-in-time values, not current guarantees.
Backend stages: organizational foundation; 5.1 geography/admin seats; 5.2 profiles/org applications/member onboarding; 5.3 admin appointment engine; 5.4 leadership handover/history/notifications and hardening; 5.5 executive portfolios/directory/term management; 5.6 membership lifecycle/transfers/directory/reporting; 5.7 global statuses/security hardening; 5.9 general audit logs designed but DDL not implemented. Stage 5.8 was discussed as reached but its precise V1 acceptance mapping must be checked; do not assume complete.
Recorded V1 reconciliation did not evidence a complete Next.js frontend, full automated test suite or production deployment. Some scoped RLS/security checks passed earlier, but controlled-account end-to-end tests across all roles were deferred to avoid paid Supabase branches/complexity.

## 15. Migration integrity incident
Remote ledger: 29 applied entries, each with one SQL statement in statements[1]. Active migration directory: 26 files at inspection. 12 same-version/name files matched after comment/whitespace normalization; 9 differed; four timestamp-shifted Stage 5.5.2/Stage 5.7 candidates matched after normalization; four original Stage 5.6 files were absent but their applied SQL payloads were recovered from the ledger. Seventeen payloads are archived under docs/backend/recovered-ledger-statements. Repository-only org_foundation has no ledger row; PostgreSQL logs show out-of-band management API execution at 2026-11-21 12:28:48.007 UTC and follow-up indexes at 12:29:14.311 UTC. Logged SQL is archived under docs/backend/recovered-baseline-logs; repository file differs from logged SQL.
Ledger payloads are best available evidence of submitted SQL, not byte-for-byte recovery of original local files. They are evidence only, not replay instructions. Do not copy into active migrations, overwrite source blindly, add org_foundation ledger row, rename based on similarity, run db push/migration repair/apply_migration, create paid branches or implement Phase 5.9 DDL before separate approval.

## 16. Remaining migration-preservation gate
1. Complete schema-only export, archive listing and SHA-256 manifest.
2. Separate full restorable backup and verification; schema-only is not a full backup.
3. Owner review of 29-entry mapping, nine divergent files and out-of-band foundation.
4. Non-mutating local Supabase CLI migration-list/dry-run confirming no replay and all entries accounted for.
5. Approve Phase 5.9 audit governance.
6. Separate explicit approval before any production database write.

## 17. Can work proceed before gate completion?
Yes: Figma, UI prototype, frontend against mock/contract data, local development, test fixtures, API contracts, docs and handover planning can continue without production Supabase writes. Keep production schema/data/history frozen. Later obtain backup and choose a controlled migration baseline or explicitly approved fresh non-production project. Full project restart is unnecessary. If clean-slate backend chosen, preserve V1.0 and data/evidence, build versioned baseline, seed verified geography, test RLS and plan cutover.

## 18. Unresolved policy decisions
National leadership transition authority; church verification authority and Conference/Mission/Region mapping; directory privacy fields; status media limits/viewer privacy/notifications; Bible/lesson-study licensing; audit retention/archival/PII masking/read permissions/action allowlists; cross-hierarchy church relationships; event moderation/group policies; whether one-to-one messaging enters scope.

## 19. Explicit exclusions
Never spell NASCONNECT; never replace approved logo/favicon; do not hard-code geography; do not assume every church is campus child; do not grant admin from email verification; do not cross jurisdiction; do not expose private/audit data; do not store plaintext passwords; do not expose service-role keys; do not duplicate membership_events/leadership_history; do not replay recovered SQL; do not alter remote history/active migrations as shortcut; do not create paid branches; do not implement Phase 5.9 DDL before gate/approval; do not code final UI before Figma approval.

## 20. Recommended continuation sequence
1. Keep existing Supabase read-only and preserve GitHub evidence.
2. Start Figma information architecture, wireframes and clickable prototype from V1.0.
3. Approve design before coding.
4. Build frontend locally using mock data and typed contracts.
5. Build test harness for member/admin workflows and jurisdiction boundaries.
6. Obtain full backup/schema export when local access is available.
7. Complete migration baseline review; choose reconcile-existing or separate clean development project.
8. Implement Phase 5.9 only after audit policy and separate database-write approval.
9. Complete controlled end-to-end tests, security checks and deployment pipeline.
10. Deploy through Vercel after build/secrets validated; transfer ownership and runbooks to NAAS.

## Part II — detailed approved source documents
The following source documents are reproduced in full from GitHub main at dossier compilation time. They retain detailed task-level acceptance and database design. V1.0 remains authoritative.

---

# SOURCE DOCUMENT: docs/architecture/NAASCONNECT_Nigeria_System_Architecture_v1.0.md

# NAASCONNECT Nigeria — System Architecture v1.0

**Status:** Approved baseline  
**Product name:** NAASCONNECT Nigeria  
**Organization served:** Nigeria Association of Adventist Students (NAAS)  
**Architecture version:** 1.0  
**Last updated:** 2026-11-21

## 1. Purpose

NAASCONNECT Nigeria is a centrally coordinated digital platform connecting NAAS structures, Adventist Students Fellowships (ASF), participating local churches, and individual members across Nigeria. It connects existing organizations; it does not replace, absorb, or compete with their governance structures.

The platform is designed for eventual institutional ownership and operation without ongoing developer intervention.

## 2. Architectural principles

1. **Respect existing governance:** authority follows the approved NAAS and church oversight structure.
2. **One person, one account:** a person has one platform identity and may hold multiple memberships and scoped roles.
3. **Organization-first model:** unions, zones, campuses/ASFs, and churches are records in a configurable hierarchy, not hard-coded application instances.
4. **Scoped authority:** administrators can act only within their assigned organization and authorized descendants.
5. **Approval before authority:** organizational registration and leadership changes follow the required upward approval chain.
6. **Developer-independent operations:** authorized administrators manage organizations, users, roles, events, and transitions from the application UI.
7. **Secure by default:** server-side authorization, PostgreSQL Row Level Security (RLS), audit trails, and least privilege.
8. **Modular delivery:** features are separated into modules but share one identity, organization, permission, and notification foundation.
9. **Institutional handover:** production ownership, credentials, documentation, and operating procedures must be transferable to NAAS.

## 3. Organizational model

The platform supports these organizational types:

- National NAAS
- Union
- Zone
- Campus / ASF
- Local Church

The canonical administrative relationship is:

```
NAAS NATIONAL
   ├── UNION
   │    ├── ZONE
   │    │    ├── CAMPUS / ASF
   │    │    └── LOCAL CHURCH (where configured in the approved church hierarchy)
   │    └── ...
   └── ...
```

The hierarchy is data-driven. Each organization has a type and may have a parent organization. The system must support approved exceptions and multiple affiliations without assuming that every church is structurally a child of a campus or that every campus has only one relevant church relationship. Use explicit organization relationships where a simple parent-child relationship is insufficient.

The three Nigerian NAAS unions are represented as union records. Zones and campus chapters are added or corrected by authorized administrators as verified information becomes available. Missing geographical data must never block onboarding: administrators can create an organization application and assign its confirmed union, zone, state, conference/mission, and institution relationships later.

## 4. Identity, memberships, roles, and scope

### 4.1 Identity

Supabase Auth provides authentication. A platform profile is linked one-to-one to the authenticated user ID. A user may belong to several organizations.

### 4.2 Membership

Membership records are separate from login accounts. A person can be a member of a local church, campus ASF, zone, or other recognized body without holding an administrative role.

### 4.3 Role assignments

Roles are assigned to a user within a specific organization scope. A role assignment includes its organization, role, effective dates, status, and the authority that approved it.

Initial role families:

- National administrator / national executive
- Union administrator / union executive
- Zonal administrator / zonal executive
- Campus administrator / campus executive
- Church administrator / authorized church representative
- Pastor / elder (limited church responsibilities)
- Ordinary member

Executive portfolios (president, vice president, secretary, treasurer, chaplain, PRO, welfare, etc.) are modeled as positions/appointments rather than separate hard-coded permission systems.

### 4.4 Scope rules

- National administrators: national scope and authorized subordinate organizations.
- Union administrators: their assigned union and authorized descendants.
- Zonal administrators: their assigned zone and authorized descendants.
- Campus administrators: their assigned campus/ASF only.
- Church administrators: their assigned church only.
- Executives: actions explicitly granted for their appointment and organization.
- Ordinary members: personal account and member-facing features.

A lower-level administrator cannot manage a peer organization or an unrelated branch. A higher-level administrator may exercise authorized oversight over subordinate organizations. UI hiding is not security; every protected operation must also be enforced server-side and by RLS.

## 5. Organization onboarding and verification

Organizations may apply from the platform. Authorized administrators may also create/onboard organizations within their jurisdiction.

Proposed workflow:

1. Applicant supplies minimum organization and contact details.
2. Application is stored as pending; it does not grant administrative authority.
3. The administrator responsible for the organization's geographical/administrative jurisdiction reviews it.
4. Approval creates or activates the organization and its initial authorized contact.
5. Rejection or requests for correction are recorded with reasons.
6. All decisions are auditable.

A higher-level administrator may onboard an organization within their jurisdiction. A campus application is reviewed by the appropriate zone administrator; zonal applications by the union; union applications by the national authority. The exact church approval authority must follow the church's recognized Conference/Mission/Region oversight and be configurable rather than assumed.

Ordinary student registration is intentionally lightweight: basic details, email verification, and notification to the relevant campus administrator for follow-up/approval where applicable. Elevated administrative authority is never granted solely because a user verifies an email address.

## 6. Leadership appointments and handovers

Leadership is term-based and organization-scoped. Campus, zone, and union bodies each have their own executive appointments and handover process.

Approval chain:

| Organization changing leadership | Required approving authority |
|---|---|
| Campus / ASF | Responsible Zone administrator / authorized zonal authority |
| Zone | Responsible Union administrator / authorized union authority |
| Union | National administrator / authorized national authority |
| National | Designated NAAS institutional oversight authority, to be formally established |

Workflow:

1. Current authorized president/administrator submits a transition request.
2. Proposed incoming president and executive team are identified.
3. Required supporting details/documents are submitted.
4. The next higher authority reviews and approves or rejects the request.
5. Incoming leader confirms acceptance/identity as required.
6. On approval, the new term becomes active, new role assignments take effect, and outgoing appointments are ended/revoked according to the effective date.
7. The incoming president can then onboard/appoint their executive team, subject to the organization's approved process.
8. A system-wide or relevant-scope notification announces the approved transition.
9. The full transition history remains immutable and auditable.

No transition should silently overwrite historical appointments. A failed or rejected request must not alter current authority.

## 7. Feature modules

### 7.1 Member and organization directory
Searchable directory of approved unions, zones, campuses/ASFs, and participating churches. Show verified organizational contacts and approved contact links. Public-facing directory fields are explicitly designated; private contact details require appropriate access.

### 7.2 Community feed
Persistent posts and announcements published by individuals and organizations. Authors retain ownership; edit/delete rights follow content ownership and organization moderation policy.

### 7.3 Global Status / Stories
A WhatsApp-Status-style feature for both individual members and authorized organizational publishers.

- Any authenticated platform member can publish text, image, or short-video status updates.
- Authorized representatives can publish on behalf of a campus, church, zone, union, or national body.
- Default visibility is global to all authenticated NAASCONNECT members, regardless of institution, church, zone, or union.
- Statuses expire automatically after 24 hours by default.
- Authors can delete their own active statuses.
- View tracking records who viewed a status; viewers are visible to the author/publishing organization according to privacy policy.
- Reactions may be enabled.
- Status updates are distinct from persistent posts and announcements.
- Upload size, video duration, supported formats, rate limits, and retention are configurable.
- A status must not be publicly accessible to unauthenticated visitors unless a future policy explicitly enables that.

### 7.4 Events
Authorized executives may create events within their organization scope. Editing, cancellation, and removal are restricted to administrators with authority over the event's owning organization. A zone administrator cannot manage another zone's events; a union administrator may manage events in authorized zones under that union; national administrators have national oversight.

### 7.5 Communication
Group spaces support national, union, zone, campus, and church communication. Membership and moderation follow organizational scope. Private one-to-one messaging is not assumed in the initial release unless separately approved.

### 7.6 Notifications
In-app notifications, email notifications, and optional web push notifications. Support event reminders, recurring weekly activity reminders, new posts/status notifications where enabled, approval requests, and leadership-transition announcements. Users control non-essential notification preferences.

### 7.7 Spiritual resources
Bible reading interface and lesson-study resources with structured navigation. The KJV PDF and supplied lesson-study PDF are source materials to be processed into navigable, accessible resource records. The platform must respect applicable copyright/licensing and attribution requirements. Do not expose raw source PDFs publicly until rights and distribution settings are confirmed.

### 7.8 Church connection
A church directory supports verified address, service information, approved contacts, and optional WhatsApp group/community links. Links are moderated and maintained by authorized church representatives. The platform connects users to churches; it does not claim to replace official church communication channels.

### 7.9 Administration and audit
Administrative dashboards, application queues, organization management, role assignment, transition approvals, content moderation, reports, and audit history.

## 8. Technical architecture

| Layer | Technology |
|---|---|
| Web application | Next.js App Router |
| Language | TypeScript |
| Styling | Tailwind CSS and reusable UI components |
| Hosting / deployment | Vercel |
| Source control | GitHub |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Authorization | Scoped RBAC + PostgreSQL RLS |
| File storage | Supabase Storage |
| Realtime | Supabase Realtime |
| Server-side operations | Next.js server actions/route handlers and Supabase Edge Functions where appropriate |
| Scheduled tasks | Supabase Cron/Edge Functions or a verified scheduling service |
| Transactional email | Configurable email delivery provider |
| Monitoring | Vercel and Supabase logs/alerts |

### Request path

```
Browser
  -> Next.js application on Vercel
      -> Supabase Auth (identity/session)
      -> Supabase PostgreSQL (RLS-protected data)
      -> Supabase Storage (policy-protected files)
      -> Supabase Realtime (authorized live updates)
      -> Server-side functions for privileged workflows
```

The Supabase service-role/secret key must never be shipped to the browser or stored in any NEXT_PUBLIC_ variable. Use the publishable key in the browser and server-only secrets in protected server environments.

## 9. Deployment and change management

- GitHub is the canonical source repository.
- Vercel deploys from the approved GitHub repository/branch.
- Supabase schema changes are represented by version-controlled migrations.
- No undocumented production schema changes.
- Use separate development/preview and production configuration where available.
- Environment secrets are configured in Vercel/Supabase secret stores, not committed.
- Every release should include verification of build, database migration state, RLS, and key user journeys.
- The platform must support transfer of GitHub, Vercel, Supabase, domain, email, and storage ownership to NAAS.

## 10. Data protection and security

- Enable RLS on every exposed application table.
- Use explicit grants and least-privilege policies.
- Authorization data must not be read from user-editable Auth metadata.
- Protect all administrative actions on the server and in the database.
- Audit sensitive operations.
- Use signed/controlled access for private documents and media.
- Validate uploads, enforce file limits, and prevent unsafe content.
- Apply retention rules to expired statuses and logs.
- Provide account recovery and administrative recovery procedures.
- Never expose service-role keys, private credentials, or unnecessary personal data.

## 11. Delivery boundaries

The first implementation milestone is the platform foundation: database model, organization engine, identity, memberships, scoped roles, onboarding approvals, leadership transitions, audit logging, and deployment pipeline.

The UI is built after the database and security foundation are stable. Community, status, events, messaging, notifications, resources, and church directory then integrate with the shared foundation.

## 12. Decisions still requiring policy confirmation

These are policy parameters, not reasons to redesign the architecture:

1. The formal national-level leadership transition approving authority.
2. Exact church verification authority and church-to-Conference/Mission mapping.
3. Final directory privacy fields and who can see direct contact details.
4. Status media size/duration limits and notification defaults.
5. Copyright/licensing and access policy for each Bible/lesson-study resource.
6. Retention duration for audit records and deleted media.

The platform should make these configurable where practical and must not invent institutional authority where it has not been formally confirmed.


## Stage 5.5 — Executive Onboarding & Organizational Management (Backend)

The executive management backend extends the approved hierarchy without changing its authority chain:
National → Union → Zone → Campus → Church.

- Organizations configure their own executive portfolios, responsibilities, ordering, required status, and suggested term duration.
- Portfolio management is restricted to administrators whose jurisdiction includes the organization.
- Executive appointment continues through the Stage 5.4 initial-appointment/handover workflow and parent-level approval; nominees must be verified and active members.
- The executive directory is visible only to active members of the organization and administrators with jurisdiction. It exposes only display name and avatar alongside position/term information.
- Term end dates and appointment notes are maintained through a scoped administrative RPC. The directory identifies terms ending within 60 days and expired terms.
- Portfolio and term RPCs are authenticated-only. The directory API wrapper is SECURITY INVOKER and delegates to a private, scope-checking implementation.

Applied migrations:
- `20261121140551_stage5_5_executive_portfolios_directory_term_management`
- `20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes`
- `20261121140749_stage5_5_2_scoped_executive_term_updates`

Frontend dashboards, outbound notification delivery, scheduled reminders, and real-account end-to-end tests remain later implementation work. No live executive records or unconfirmed standard portfolios are seeded.


---

# SOURCE DOCUMENT: docs/architecture/NAASCONNECT_Nigeria_V1_RECONCILIATION_REGISTER.md

# NAASCONNECT Nigeria — V1.0 Implementation Reconciliation Register

**Baseline:** NAASCONNECT Nigeria Master Project Control Document V1.0  
**Baseline date recorded in source:** 21 November 2026  
**Reconciliation snapshot:** 21 November 2026  
**Systems inspected:** Supabase project `csytneubatlaakpmnsfk`; GitHub repository `TremendousGuru/NAAS`, default branch `main`.  
**Purpose:** Map every V1 task to observed implementation evidence and distinguish backend, frontend, verification, deferred and outstanding work.

## 1. Authority and interpretation

The Master Project Control Document V1.0 remains the controlling scope, acceptance and change-control baseline. This register is an implementation-status companion; it does not silently amend V1. Newer engineering stage labels are implementation labels only and must not be confused with V1 task IDs. Existing approved architecture and decisions remain in force.

Status vocabulary:
- **Backend present** — database objects, SQL migrations, functions or backend documentation provide evidence of implementation.
- **Partial** — some supporting foundation exists, but the V1 scope or acceptance condition is not complete.
- **Not evidenced** — no sufficient implementation evidence was found in the inspected live database/repository.
- **Deferred** — deliberately postponed by project-owner decision; not to be represented as complete.
- **Not verified** — implementation may exist, but its V1 acceptance condition has not been demonstrated.
- **Complete** is reserved for a task whose full acceptance condition has been evidenced; no task is marked complete solely because a table exists.

## 2. Current verified inventory

### Supabase
- Project: `csytneubatlaakpmnsfk`.
- 14 public tables were observed: `org_units`, `org_memberships`, `org_admin_seats`, `profiles`, `org_applications`, `admin_appointment_requests`, `org_leadership_positions`, `leadership_handover_requests`, `leadership_history`, `leadership_notification_events`, `org_executive_portfolios`, `membership_transfer_requests`, `membership_events`, and `community_statuses`.
- RLS is enabled on all 14 observed public tables.
- 29 migrations are recorded in the Supabase migration ledger.
- At inspection, `org_units` contained 24 rows and `org_admin_seats` contained 24 rows; `org_memberships` and `profiles` contained zero rows. Empty user tables indicate no populated member/profile data at this snapshot, not proof that the schema is absent.
- Security and health advisor checks were queried during this reconciliation. They are point-in-time checks, not substitutes for the V1 security and release test suite.

### GitHub
- Repository: `TremendousGuru/NAAS`, branch `main`.
- Existing documentation includes the system architecture, database blueprint, approved decisions, organizational foundation, and backend stage documents 5, 5.2, 5.3, 5.4, 5.5, 5.6 and 5.7.
- The repository contains SQL migrations and an `admin-appointment` Edge Function.
- The inspected repository tree did not evidence a complete Next.js/TypeScript application, frontend route/component set, automated test suite, deployment workflow or production configuration. These are therefore not marked complete.
- Existing logo/favicon, denominational logo and resource PDFs are present in the repository. Their presence does not complete the design-system or resource-delivery tasks.

## 3. V1 task-by-task reconciliation

### Phase 1 — Project setup and governance

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 1.1 Project initiation / scope | **Partial.** V1.0 control document, architecture and decision records exist. | Confirm all initiation/ownership acceptance items in the source checklist. |
| 1.2 Platform/account setup | **Partial.** Existing Supabase project and GitHub repository are active and inspected. | Verify all required accounts, access levels and organization-controlled custodians. |
| 1.3 Repository setup | **Partial.** GitHub repository and documentation/migration structure exist. | Approved application structure and complete application code are not evidenced. |
| 1.4 Deployment branches/configuration | **Not evidenced.** No deployment workflow or verified branch behavior found in inspected tree. | Connect and verify Vercel preview/production behavior; do not create paid Supabase branches. |
| 1.5 Domain strategy | **Not evidenced.** No approved production domain/DNS evidence found. | Record domain decision and defer public launch until authorized. |
| 1.6 Local development environment | **Not verified.** No reproducible local application build was demonstrated. | Establish and document local toolchain and successful run/build. |
| 1.7 Project control records | **Partial.** V1.0, architecture and decision documentation exist; this register adds implementation reconciliation. | Maintain change, issue, release and ownership records with named custodians. |
| 1.8 Ownership and access | **Not verified.** Existing integrations/repository are accessible, but organizational ownership transfer is not evidenced. | Document GitHub, Supabase, Vercel and domain ownership/access plan. |

### Phase 2 — Product requirements and architecture lock

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 2.1 Master Product Requirements Document | **Partial / not verified.** V1.0 scope and architecture docs exist. | Confirm a separately approved PRD and acceptance criteria, or record V1.0 as the approved requirements baseline if that was the approval. |
| 2.2 Organizational model | **Backend present.** `org_units` hierarchy supports national, union, zone, campus and church types; architecture/database docs exist. | Verify all independent-church and cross-link cases against the V1 acceptance criteria. |
| 2.3 User types and lifecycle | **Partial.** Profiles, memberships, applications and admin appointment structures exist. | Complete lifecycle specification and test each user/account state. |
| 2.4 Roles and permissions matrix | **Backend foundation present.** Role constraints, admin seats, scoped authorization functions and RLS exist. | Publish/confirm complete role-action-scope matrix and prove every privileged action. |
| 2.5 Registration and verification | **Partial.** Onboarding/application schema and migrations exist. | Verify email confirmation, invitation, rejection, correction and recovery journeys end-to-end. |
| 2.6 Leadership transitions | **Backend present.** Handover requests, history, notification events and hardening migrations exist. | Verify complete governance variants and all outgoing/incoming privilege transitions. |
| 2.7 Database model | **Partial.** Database blueprint and live schema exist. | Reconcile all live objects to approved ERD; document retention, audit and outstanding entities. |
| 2.8 Security model | **Partial.** RLS on 14 public tables, scoped functions and hardening migrations are evidenced. | Complete security design review and positive/negative role/scope tests. |
| 2.9 User journeys/navigation | **Not evidenced.** No complete sitemap/working frontend journeys found. | Approve sitemap and role-specific journeys before frontend implementation. |
| 2.10 Architecture freeze | **Partial.** Architecture and approved-decision documents exist. | Record formal baseline approval and enforce V1 change-control for later changes. |

### Phase 3 — Brand identity and interface design

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 3.1 Approved identity assets | **Partial.** Logo and favicon assets are in GitHub. | Record authorized source/usage guidance and verify approved variants. |
| 3.2 NAASCONNECT identity | **Partial.** Approved name and identity assets are recorded. | Verify full brand package and avoid implying unapproved official endorsement. |
| 3.3 Design system | **Not evidenced.** | Define typography, colors, spacing, components, responsive and accessibility rules. |
| 3.4 Public experience design | **Not evidenced.** | Design and approve public pages and finder flows. |
| 3.5 Authentication experience | **Not evidenced.** | Design registration, login, verification, recovery, application and error states. |
| 3.6 Member experience | **Not evidenced.** | Design member dashboard, profile, directory, community and event screens. |
| 3.7 Administration experience | **Not evidenced.** | Design national, union, zone, campus and church administration screens. |
| 3.8 Mobile/accessibility states | **Not evidenced.** | Produce and review responsive, keyboard, contrast, loading, empty and error states. |

### Phase 4 — Repository, application and Supabase foundation

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 4.1 Approved repository structure | **Partial.** Docs, migrations and one Edge Function exist. | Implement the approved modular application structure; current tree does not evidence it. |
| 4.2 Next.js and TypeScript | **Not evidenced.** No application package/config/source was found in inspected tree. | Initialize and verify the approved application. |
| 4.3 Styling/shared UI | **Not evidenced.** | Implement design tokens and shared components after design-system approval. |
| 4.4 Safe Supabase connection | **Partial / not verified.** Live Supabase project is active and backend objects exist. | Verify application client/server connection and secret isolation; no full application connection test evidenced. |
| 4.5 Migration workflow | **Partial.** SQL migrations are in GitHub and 29 migrations are in Supabase ledger. | Resolve migration filename/ledger discrepancies documented in Section 4 before relying on automated migration pushes. |
| 4.6 Approved database schema | **Partial.** Fourteen public tables and supporting functions are present. | Complete ERD-to-live-schema reconciliation; V1 schema and audit requirements remain incomplete. |
| 4.7 RLS/storage policies | **Partial.** All 14 observed public tables have RLS enabled. | Storage policy coverage and full role/scope positive/negative tests remain unverified. |
| 4.8 Seed/reference data | **Partial.** 24 organization units and 24 admin seats observed. | Verify source, correctness, editability and approval status of seed/reference data. |
| 4.9 TypeScript database types | **Not evidenced.** | Generate and commit reproducible types once the application/tooling is established. |

### Phase 5 — Authentication and organizational administration

| V1 task | Current engineering evidence | V1 status and remaining work |
|---|---|---|
| 5.1 Registration and email verification | Stage 5.2 onboarding/profile/application migrations and documentation. | **Partial.** Backend foundation exists; email confirmation and complete acceptance journey not verified. |
| 5.2 Login, logout and recovery | Supabase Auth is the underlying platform, but no complete app auth lifecycle evidence or tests were found. | **Not verified.** Implement/verify UI, sessions, logout, password reset and lifecycle tests. |
| 5.3 Profiles and membership | `profiles`, `org_memberships`, membership events/transfers and Stage 5.6 backend docs. | **Backend present / frontend outstanding.** Both profile and membership tables were empty at snapshot. UI and multi-affiliation acceptance tests remain. |
| 5.4 Role and scope administration | `org_admin_seats`, appointment requests, scoped authorization and RLS; Stage 5.3/5.4 docs. | **Backend present / frontend and verification outstanding.** Prove no role escalation or cross-jurisdiction access. |
| 5.5 Organizational directory management | `org_units`, hierarchy and scoped directory RPC foundation; Stage 5 and 5.5 docs. | **Backend present / frontend outstanding.** Admin CRUD screens and independent church directory acceptance remain. |
| 5.6 Applications and approval queue | `org_applications`, `admin_appointment_requests`, membership review/transfer workflows; Stage 5.2, 5.3 and 5.6 docs. | **Backend present / frontend and end-to-end verification outstanding.** |
| 5.7 Executive and leadership records | `org_leadership_positions`, `org_executive_portfolios`, `leadership_history`; Stage 5.5. | **Backend present / frontend and acceptance tests outstanding.** |
| 5.8 Leadership handover | `leadership_handover_requests`, `leadership_history`, `leadership_notification_events`; Stage 5.4 and hardening migrations. | **Backend present / frontend and controlled-account end-to-end verification outstanding.** |
| 5.9 Audit logs | No general administrative/security audit-log subsystem was identified in the live public table inventory or repository docs/migrations. | **Outstanding.** This is the next unimplemented V1 Phase 5 backend feature. Design it against V1's meaningful, permission-scoped audit history requirements; do not duplicate the narrower leadership history/event tables. |

**Important deferred item:** the previously discussed controlled-account end-to-end testing step (current engineering Stage 5.6.8) was deferred until consolidated testing. It remains **deferred/not verified**, not complete.

### Phase 6 — Core member and community features

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 6.1 Member dashboard/profile | Profile backend exists; no dashboard UI evidenced. | **Partial backend; frontend outstanding.** |
| 6.2 Association directory/pages | Organization hierarchy/directory backend exists. | **Partial backend; public/member pages and filters outstanding.** |
| 6.3 Church directory/pages | Church is represented as an organization type. | **Partial backend; independent church search/pages and acceptance tests outstanding.** |
| 6.4 Community feed/announcements | Community statuses and platform announcement-related backend exist. | **Partial.** 24-hour status feature is not the complete moderated feed/announcement scope; reporting/moderation/UI outstanding. |
| 6.5 Messaging | No messaging schema or UI evidenced. | **Outstanding.** |
| 6.6 Events/calendar | No event/calendar implementation evidenced. | **Outstanding.** |
| 6.7 Notifications/preferences | Leadership notification events and platform announcement foundation exist. | **Partial.** User notification inbox/preferences and push/email delivery are not verified. |
| 6.8 Prayer/testimonies/discussion | No dedicated implementation evidenced. | **Outstanding.** |
| 6.9 Alumni/opportunities | No dedicated implementation evidenced. | **Outstanding.** |

### Phase 7 — Spiritual resources and engagement

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 7.1 Bible resources | KJV PDF is present in repository. | **Partial asset only.** In-app navigation, rights/source review and accessible reading experience outstanding. |
| 7.2 Hymnal resources | No approved hymnal implementation evidenced. | **Outstanding.** Confirm rights/licensing before reproduction. |
| 7.3 Sabbath School/devotional | Lesson Study Guide PDF is present. | **Partial asset only.** In-app content/navigation and reuse permissions outstanding. |
| 7.4 Media library | No media library implementation evidenced. | **Outstanding.** |
| 7.5 Recurring fellowship reminders | No scheduling/preferences implementation evidenced. | **Outstanding.** |

### Phase 8 — Quality assurance, security and performance

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 8.1 Functional testing | No consolidated functional test suite/results evidenced. | **Outstanding.** |
| 8.2 Authorization/RLS testing | RLS is enabled on all 14 public tables; no complete positive/negative cross-org test evidence. | **Partial security foundation; acceptance tests outstanding.** |
| 8.3 Application security review | Security hardening migrations and advisor checks exist. | **Partial.** Review secrets, rate limits, uploads, sessions, abuse and application risks. |
| 8.4 Responsive/accessibility | No frontend to review was evidenced. | **Outstanding.** |
| 8.5 Performance testing | Index hardening migrations exist; advisor notices were informational at snapshot. | **Partial.** Run workload-based performance tests and prioritize findings. |
| 8.6 Backup/restore drill | No demonstrated recovery drill/documentation evidence. | **Outstanding.** |
| 8.7 Monitoring/error reporting | No complete monitoring/alerting/error-reporting setup evidenced. | **Outstanding.** |
| 8.8 End-to-end release review | No release candidate or consolidated test evidence. | **Outstanding.** |

### Phase 9 — Production deployment and organizational handover

| V1 task | Evidence and status | Remaining work |
|---|---|---|
| 9.1 Production environment | Existing Supabase project only; production configuration not evidenced. | **Outstanding.** |
| 9.2 Official domain/DNS | No verified domain/DNS configuration evidenced. | **Outstanding.** |
| 9.3 Production deployment | No verified Vercel production deployment or application build evidenced. | **Outstanding.** |
| 9.4 Production integrations | No production end-to-end integration evidence. | **Outstanding.** |
| 9.5 Administrator guide | Backend stage docs exist, but no complete non-developer operating guide. | **Partial documentation; guide outstanding.** |
| 9.6 Technical handover | Architecture/database/backend docs exist. | **Partial.** Add migration recovery, deployment, secrets rotation and operational runbooks. |
| 9.7 Organizational ownership transfer | Not evidenced. | **Outstanding.** |
| 9.8 Operational readiness | No approved launch readiness evidence. | **Outstanding.** |

## 4. Migration history reconciliation — important finding

### 4.1 Observed discrepancy

The Supabase migration ledger reports **29 applied versions**. The GitHub `supabase/migrations` directory contains **26 SQL files** at this snapshot. An exact comparison by version and migration name found eight ledger entries without an exactly matching filename:

| Supabase applied version | Ledger migration name | GitHub observation |
|---|---|---|
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | Similar-name file exists as `20261121140642_...` (timestamp differs). |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | No matching SQL file found. |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | No matching SQL file found. |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | No matching SQL file found. |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | No matching SQL file found. |
| `20261121152734` | `stage5_7_global_community_statuses` | Similar-name file exists as `20261121162500_...` (timestamp differs). |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | Similar-name file exists as `20261121162600_...` (timestamp differs). |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | Similar-name file exists as `20261121162700_...` (timestamp differs). |

Additional repository-only observations:
- `20261121133000_org_foundation.sql` is present in GitHub but has no matching version/name entry in the observed Supabase ledger.
- The GitHub file `20261121140642_stage5_5_2_scoped_executive_term_updates.sql` does not match the ledger version `20261121140749` for the same migration name.
- The three Stage 5.7 SQL files were fetched and their contents are present in GitHub. The Supabase migration ledger returns version/name metadata, not a checksum or the original SQL body, so it cannot prove byte-for-byte identity with the SQL that was applied.

### 4.2 Safe resolution decision

**No migration was reapplied. No Supabase migration-history row was edited. No migration file was renamed, deleted or duplicated in this reconciliation.**

This is intentional. A filename-only rename would not prove that the GitHub SQL is byte-for-byte the SQL originally applied to Supabase. More importantly, four applied membership migrations have no matching SQL file in the repository, so a simplistic rename would leave the migration source history incomplete and could cause future `db push`/migration-list confusion.

For operational safety:
1. Treat the Supabase ledger version/name as the authoritative record of what the remote database says was applied.
2. Treat the GitHub SQL files as source artifacts whose exact correspondence must be proven before renaming or removing.
3. Do not reapply any of these migrations and do not create replacement migrations for already-applied schema changes.
4. Recover the four missing membership migration SQL sources from trusted commit history/authoring records or a verified backup; do not reconstruct and pretend they are original.
5. Compare the GitHub SQL for the three Stage 5.7 migrations with the exact applied source if available (for example, an archived migration bundle or trusted original commit). Only after that comparison should filenames be aligned to the ledger versions.
6. Resolve the `20261121133000_org_foundation.sql` repository-only file by determining whether it is an unapplied artifact, a duplicate of another migration, or a migration omitted from the ledger. Do not apply it as part of this reconciliation.
7. Once the complete ordered migration set is proven, perform a non-mutating migration-list/dry-run review before any future migration deployment.

**Status:** discrepancy fully identified and documented; automatic filename repair is deliberately held pending source-integrity proof. This is safer than manufacturing a false match.

## 5. Current stage-to-V1 crosswalk

| Current engineering label | V1 scope it supports | Reconciliation |
|---|---|---|
| Stage 5 / provisional geography and admin seats | V1 2.2, 2.4, 4.6, 5.4, 5.5 | Backend foundation present. |
| Stage 5.2 onboarding/profiles | V1 5.1, 5.3, part of 5.6 | Backend foundation present; full auth lifecycle/UI unverified. |
| Stage 5.3 admin appointment approval | V1 5.4, 5.6 | Backend foundation present. |
| Stage 5.4 leadership handover | V1 2.6, 5.8 | Backend foundation present. |
| Stage 5.5 executive portfolios/terms | V1 5.7 | Backend foundation present. |
| Stage 5.6.1–5.6.7 membership administration | V1 5.3, 5.6 | Backend foundation present; Stage 5.6.8 controlled-account tests deferred. |
| Stage 5.7 community statuses | V1 6.4 (partial) | Not V1 5.7. It does not replace executive/leadership records. |

## 6. Immediate remaining work in V1 order

1. **V1 5.9 — General audit logs:** next backend feature, designed to complement rather than duplicate leadership history and membership events.
2. Frontend foundation and user journeys from Phases 3–4, followed by screens for the backend features already present.
3. Complete V1 Phase 5 authentication, authorization and workflow acceptance tests; include the deferred controlled-account E2E tests.
4. Implement remaining Phase 6 and Phase 7 features in approved priority order.
5. Execute the complete Phase 8 quality/security/recovery/release suite.
6. Complete Phase 9 production setup, deployment and organizational handover.

No new feature migration should begin until this reconciliation register and the migration source-integrity issue are acknowledged in project documentation. No paid Supabase branch was created.

## 7. Change-control rule

Any change to V1 scope, architecture, data model, hierarchy, roles, permissions, deployment or content rights must follow the V1 change-control process and be explicitly approved. This register may be updated as evidence changes, but V1 task IDs and acceptance conditions must not be silently rewritten.

---
*End of reconciliation register.*


## 8. Follow-up forensic update — 21 November 2026

A deeper read-only investigation and Git commit-history review was completed after the initial register commit. The detailed evidence is in [Migration Source Integrity Forensic Report](../backend/MIGRATION_SOURCE_INTEGRITY_FORENSIC_REPORT.md).

- The four missing applied Stage 5.6 SQL sources were not recovered from the current repository tree or inspected commit history.
- Stage 5.6 backend documentation was found to list three migration version IDs that do not match the live Supabase ledger. The authoritative observed ledger IDs are 20261121142038, 20261121142049 and 20261121142125.
- The Stage 5.5.2 and three Stage 5.7 GitHub files are semantically corroborated by commit history and live database objects, but exact applied SQL identity cannot be proven because the ledger does not expose SQL bodies/checksums.
- The repository-only `20261121133000_org_foundation.sql` has no ledger entry and would collide with existing tables if replayed; it is classified as an untracked/superseded artifact pending origin review.
- The membership domain already has `membership_events`; leadership domain has `leadership_history` and `leadership_notification_events`. V1 Phase 5.9 design therefore explicitly avoids duplicating those records.

**Migration synchronization gate: NOT PASSED.** No migration was reapplied, renamed, deleted or duplicated; no Supabase ledger was edited. No new Phase 5.9 migration or database object was created. Phase 5.9 has a design-only specification at [V1 Phase 5.9 General Audit Logs Design](../backend/V1_PHASE_5_9_GENERAL_AUDIT_LOGS_DESIGN.md). Implementation is held until original migration sources or a formally approved recovery baseline are available.


---

# SOURCE DOCUMENT: docs/database/NAASCONNECT_Nigeria_Database_Blueprint_v1.0.md

# NAASCONNECT Nigeria — Database Blueprint v1.0

**Status:** Proposed logical data model based on approved System Architecture v1.0  
**Target:** Supabase PostgreSQL 17  
**Important:** This document defines the logical model. It is not yet an executable migration. Exact column types, indexes, constraints, RLS policies, grants, triggers, and functions will be reviewed before schema deployment.

## 1. Database design rules

- Use UUID primary keys for application entities unless a strong reason exists otherwise.
- Use `timestamptz` for timestamps and store UTC.
- Use foreign keys and explicit constraints; avoid storing relationships only as free-text names.
- Separate identity, membership, role assignment, and executive appointment.
- Model organizations as data, not one table per campus/zone/church.
- Keep approval and leadership history append-only where possible.
- Enable RLS on every exposed table.
- Put privileged authorization checks in trusted server-side/database code, not user-editable metadata.
- Avoid broad SECURITY DEFINER functions. If one is essential, isolate it, restrict EXECUTE, set a safe search_path, and test it.
- Use private storage buckets for non-public documents and member media unless a specific asset is approved for public delivery.

## 2. Identity and profile

### `profiles`
One platform profile per Supabase Auth user.

Logical fields:
- `id` UUID PK, references `auth.users.id`
- `display_name`
- `first_name`, `last_name` (as policy requires)
- `avatar_path`
- `phone` (optional, visibility-controlled)
- `account_status` (active, suspended, deactivated, pending_review)
- `created_at`, `updated_at`

Email and authentication credentials remain managed by Supabase Auth. Do not duplicate passwords or treat profile fields as proof of identity.

### `user_preferences`
- `user_id` PK/FK to profiles
- `locale`
- `timezone`
- `notification_preferences` (validated JSON or normalized child rows)
- `created_at`, `updated_at`

## 3. Organization engine

### `organization_types`
Seeded types: national, union, zone, campus, church. May include other formally approved organization types later.

Fields: `id`, `code` unique, `label`, `description`, `is_active`.

### `organizations`
Fields:
- `id` UUID PK
- `organization_type_id` FK
- `parent_organization_id` nullable self-FK for primary hierarchy
- `name`, `short_name`, `slug` (unique where appropriate)
- `description`
- `status` (draft, pending, active, suspended, archived)
- `verification_status` (unverified, pending, verified, rejected)
- `state_code`, `state_name`, `city_or_lga`, `address`
- `conference_or_mission_name` and verified external reference if available
- `website_url`, `public_email`, `public_phone`
- `created_by`, `approved_by`
- `approved_at`, `created_at`, `updated_at`

Do not make conference names or geographical labels the only source of organizational identity. They are attributes/relationships that can be corrected.

### `organization_relationships`
For non-tree relationships, such as a campus's relationship with a local church, a church's Conference/Mission oversight, or an organization participating in a joint program.

Fields: `id`, `source_organization_id`, `target_organization_id`, `relationship_type`, `valid_from`, `valid_to`, `status`, `created_by`, `created_at`.

### `organization_metadata` (optional)
Use only for genuinely variable attributes that do not warrant typed columns. Do not put core permissions, parent IDs, status, or approval data in JSON.

## 4. Membership

### `memberships`
Fields: `id`, `user_id`, `organization_id`, `membership_type`, `status` (pending, active, declined, ended), `joined_at`, `ended_at`, `source`, `approved_by`, `approved_at`, `created_at`.

Unique/partial constraints should prevent duplicate active membership for the same user and organization while preserving history.

### `membership_history`
Append-only membership events: `id`, `membership_id`, `action`, `old_status`, `new_status`, `actor_user_id`, `reason`, `created_at`.

## 5. Roles and permissions

### `roles`
Stable role codes, labels, and descriptions. Examples: national_admin, union_admin, zone_admin, campus_admin, church_admin, executive, pastor, elder, member.

### `permissions`
Stable permission codes and descriptions, e.g. organization.read, organization.update, organization.approve, membership.review, event.create, event.moderate, leadership.transition.approve, status.publish_as_organization, church.update.

### `role_permissions`
Many-to-many role/permission mapping.

### `user_role_assignments`
Fields: `id`, `user_id`, `role_id`, `organization_id` (scope), `status`, `granted_by`, `approved_by`, `valid_from`, `valid_until`, `created_at`, `revoked_at`, `revoked_by`, `revocation_reason`.

A role is never global merely because its label says “administrator”; its scope is explicit. National scope is represented by the national organization record.

### `executive_positions`
Position definitions, optionally scoped by organization type: president, vice president, general secretary, assistant secretary, treasurer, financial secretary, chaplain, PRO, welfare director, sisters'/brothers' coordinator, and other approved portfolios.

### `leadership_terms`
Fields: `id`, `organization_id`, `position_id`, `user_id`, `term_name`, `starts_at`, `ends_at`, `status`, `appointed_by`, `created_at`.

### `leadership_transitions`
Fields: `id`, `organization_id`, `current_term_id`, `proposed_term_payload` or normalized proposed appointment reference, `submitted_by`, `submitted_at`, `approving_organization_id`, `status`, `reviewed_by`, `reviewed_at`, `decision_reason`, `effective_at`, `created_at`.

### `leadership_transition_members`
Proposed incoming/outgoing executive appointments linked to a transition. Supports incoming president confirmation and complete executive handover without overwriting the previous term.

### `approval_requests`
Reusable approval workflow record for organization applications, leadership transitions, church verification, and other controlled actions. Fields: `id`, `request_type`, `target_type`, `target_id`, `requesting_organization_id`, `approving_organization_id`, `submitted_by`, `status`, `decision_by`, `decision_at`, `decision_note`, `created_at`.

## 6. Organization onboarding

### `organization_applications`
Fields: `id`, `applicant_user_id`, `requested_type_id`, `requested_name`, `requested_parent_id`, `state/location fields`, `institution_or_church_details`, `contact_details`, `supporting_document_paths`, `status`, `assigned_approving_organization_id`, `reviewed_by`, `reviewed_at`, `review_note`, `created_at`.

An application does not itself grant admin permissions. Approval activates/creates the organization and separately grants a scoped initial role.

## 7. Events

### `events`
Fields: `id`, `organization_id` (owning organization), `created_by`, `title`, `description`, `event_type`, `venue`, `starts_at`, `ends_at`, `visibility`, `status`, `cover_media_path`, `created_at`, `updated_at`, `cancelled_at`.

### `event_registrations`
Fields: `id`, `event_id`, `user_id`, `status`, `registered_at`, `attendance_status`.

Moderation is evaluated against the event's owning organization and the administrator's scope. An administrator of a peer zone cannot modify another zone's event.

## 8. Persistent community publishing

### `posts`
Fields: `id`, `author_user_id`, nullable `author_organization_id`, `body`, `visibility`, `status`, `published_at`, `edited_at`, `created_at`.

### `post_media`
Fields: `id`, `post_id`, `storage_path`, `media_type`, `mime_type`, `size_bytes`, `display_order`, `created_at`.

Individual posts and organizational posts remain distinct from temporary status updates.

## 9. Global Status / Stories

### `statuses`
Fields:
- `id` UUID PK
- `publisher_user_id` nullable for organization-only publishing
- `publisher_organization_id` nullable for individual publishing
- `publisher_type` (individual, organization)
- `text_content` nullable
- `visibility` default `authenticated_members`
- `status` (active, deleted, expired, moderated)
- `published_at`
- `expires_at` default 24 hours after publication
- `created_at`, `deleted_at`

Constraint: exactly one publisher identity path must be valid for the selected publisher type. Individual publishing requires an authenticated user. Organization publishing requires an authorized scoped role.

### `status_media`
Fields: `id`, `status_id`, `storage_path`, `media_type` (image/video), `mime_type`, `size_bytes`, `duration_seconds`, `display_order`, `created_at`.

### `status_views`
Fields: `id`, `status_id`, `viewer_user_id`, `viewed_at`. Unique constraint on `(status_id, viewer_user_id)` if only first-view tracking is required; otherwise preserve view events separately.

### `status_reactions`
Fields: `id`, `status_id`, `user_id`, `reaction_code`, `created_at`. Unique constraint on `(status_id, user_id)` if one active reaction per viewer is intended.

**Global visibility rule:** all active, non-expired statuses with `visibility = authenticated_members` are readable by any authenticated, active platform member. This deliberately does not filter by union, zone, campus, or church. Organization publishing permission is checked at write time. Users can delete their own individual status; organizational status deletion/moderation is limited to the publishing organization and authorized higher-level moderators under policy.

Expired media must be cleaned up by a scheduled retention job after the configured grace period. Expiration is enforced at read time as well as by cleanup.

## 10. Communication

### `chat_rooms`
Fields: `id`, `room_type` (national, union, zone, campus, church, custom), `organization_id`, `name`, `description`, `status`, `created_by`, `created_at`.

### `chat_room_members`
Fields: `id`, `room_id`, `user_id`, `membership_role`, `joined_at`, `left_at`, `status`.

### `messages`
Fields: `id`, `room_id`, `sender_user_id`, `body`, `message_type`, `reply_to_message_id`, `created_at`, `edited_at`, `deleted_at`.

### `message_attachments`
Fields: `id`, `message_id`, `storage_path`, `mime_type`, `size_bytes`, `created_at`.

Room membership, reading, posting, and moderation are independently authorized. Realtime subscriptions must apply the same access rules.

## 11. Churches and directory contacts

Churches are organization records of type church. Additional typed detail can live in:

### `church_details`
Fields: `organization_id` PK/FK, `service_schedule`, `pastor_or_lead_contact` (restricted), `whatsapp_group_url`, `public_contact_email`, `public_contact_phone`, `verification_status`, `verified_by`, `verified_at`, `updated_at`.

### `organization_contacts`
Fields: `id`, `organization_id`, `contact_type`, `label`, `value`, `visibility`, `verified_at`, `created_at`.

WhatsApp invite URLs are untrusted external links until verified by an authorized representative. Contact visibility must be explicit.

## 12. Notifications and schedules

### `notifications`
Fields: `id`, `recipient_user_id`, `notification_type`, `title`, `body`, `target_type`, `target_id`, `read_at`, `created_at`.

### `notification_preferences`
Fields: `id`, `user_id`, `channel` (in_app, email, web_push), `category`, `enabled`, `updated_at`.

### `notification_deliveries`
Tracks delivery attempts, provider reference, status, retry count, and timestamps without storing provider secrets.

### `scheduled_notifications`
Stores approved recurring activity reminders, target audience/scope, local time, timezone, next run, active state, and creator. Scheduling must be timezone-aware and avoid duplicate sends.

### `push_subscriptions`
Stores browser push endpoint and encrypted/controlled subscription keys per user/device, with revocation and last-used timestamps.

## 13. Spiritual resources

### `resource_categories`
Examples: Bible translations, Bible books, lesson study quarters, lesson study weeks, other approved materials.

### `resources`
Fields: `id`, `category_id`, `title`, `description`, `resource_type`, `storage_path`, `access_level`, `language`, `copyright_status`, `attribution`, `published_at`, `created_at`.

### `bible_translations`
Fields: `id`, `name`, `abbreviation`, `language`, `rights_status`, `source_resource_id`.

### `bible_books`
Fields: `id`, `translation_id`, `book_order`, `name`, `testament`, `chapter_count`.

### `bible_chapters`
Fields: `id`, `book_id`, `chapter_number`, `content_reference` or structured verse relationship.

### `bible_verses`
Fields: `id`, `chapter_id`, `verse_number`, `verse_text`.

### `lesson_study_series`
Fields: `id`, `title`, `quarter`, `year`, `language`, `resource_id`, `rights_status`, `published_at`.

### `lesson_study_lessons`
Fields: `id`, `series_id`, `lesson_number`, `title`, `memory_text`, `study_start_date`, `study_end_date`, `content_reference`.

The PDFs are source inputs, not the final navigation model. The Bible must be parsed into book/chapter/verse navigation. Lesson study must be parsed into quarter/lesson/day sections where the source permits. Preserve source attribution and verify extracted content against the PDF.

## 14. Audit and moderation

### `audit_logs`
Append-only record of actor, action, target type/id, organization scope, timestamp, request/correlation ID, and minimal before/after metadata. Never store passwords, access tokens, or secret values.

### `administrative_actions`
Structured records for approvals, role changes, suspensions, content moderation, and other sensitive operations.

### `content_reports`
Member reports for posts, statuses, messages, or organization records. Includes reason, review status, assigned moderator, decision, and timestamps.

## 15. Storage buckets (proposed)

- `avatars`: public or signed access depending on privacy decision.
- `organization-assets`: organization logos and approved public materials.
- `status-media`: private bucket; authenticated global read through controlled policies, owner-scoped writes, scheduled cleanup.
- `post-media`: policy-controlled.
- `event-media`: policy-controlled.
- `church-documents`: private.
- `resource-library`: access controlled by resource rights/access level.
- `application-documents`: private, restricted to applicant and reviewing authority.

Storage object paths should include stable IDs, not user-provided filenames as authorization signals.

## 16. Key indexes and constraints to plan

- Unique organization slug (within agreed namespace).
- Index organization parent and type.
- Index relationship source/target/type.
- Index memberships by user/status and organization/status.
- Index role assignments by user/status and organization/status.
- Index active leadership terms by organization and date.
- Index approval requests by approver/status/date.
- Index events by organization/start time/status.
- Index posts by published time and owner.
- Index statuses by expires_at and published_at; index status_views by status and viewer.
- Index messages by room and created_at.
- Index notifications by recipient and created_at/read_at.
- Unique verse coordinate: translation + book + chapter + verse.
- Foreign-key indexes on all high-volume join columns.

## 17. RLS policy domains

Policies will be designed and tested per table, not copied blindly.

- Public/anonymous: only explicitly public directory and resource fields, if approved.
- Authenticated members: global active statuses, permitted public community content, and approved directory fields.
- Individual ownership: users manage their own profile preferences, own individual statuses, and allowed membership requests.
- Organization scope: administrators manage records belonging to their organization, with higher-level inherited oversight only where explicitly allowed.
- Approval scope: only the designated approving organization/role can decide a pending request.
- Leadership scope: current authorized leader can submit; next-level authority can approve; no user can self-approve their own elevation.
- Private resources/media: access follows storage policies and resource entitlement.
- Audit: append-only inserts through trusted paths; ordinary users cannot read or mutate administrative logs.

Views exposed through the Data API must use `security_invoker = true` where supported, or be placed in a non-exposed schema with appropriate grants.

## 18. Build order for database implementation

1. Inspect existing project objects and resolve pre-existing security advisor findings.
2. Create foundational enums/types and organization tables.
3. Create profiles, memberships, roles, permissions, and scoped role assignments.
4. Add onboarding applications and approval workflow.
5. Add executive positions, leadership terms, and transition workflow.
6. Add audit logging and secure helper functions.
7. Apply and test RLS policies and grants.
8. Add events and persistent publishing.
9. Add Global Status / Stories and protected media storage.
10. Add chat and Realtime policies.
11. Add notifications and scheduled reminders.
12. Add church directory and contacts.
13. Add resource library and structured Bible/lesson-study tables.
14. Run security/performance advisors and role-based test cases.
15. Generate and commit versioned migrations; verify a clean replay.

## 19. Open policy decisions

- National transition approving authority.
- Church verification and Conference/Mission oversight mapping.
- Whether status view lists are visible to the author only or also to organizational admins for organization-published statuses.
- Exact media limits and expired-media retention grace period.
- Resource copyright/licensing and access rules.
- Audit-log retention period.
- Whether direct messages are in the initial release or a later phase.


---

# SOURCE DOCUMENT: docs/decisions/NAASCONNECT_Nigeria_Approved_Decisions_v1.0.md

# NAASCONNECT Nigeria — Approved Decision Register

**Version:** 1.0  
**Date:** 2026-11-21

| ID | Decision | Approved rule |
|---|---|---|
| DEC-001 | Product name | The software name is **NAASCONNECT Nigeria**. Do not abbreviate or alter the spelling to NASCONNECT. |
| DEC-002 | Organizational approach | The platform connects existing NAAS/ASF and church structures; it does not replace or compete with them. |
| DEC-003 | Infrastructure | Supabase backend, GitHub source repository, Vercel hosting/deployment. |
| DEC-004 | Identity | One person has one account and may hold multiple organizational memberships and scoped roles. |
| DEC-005 | Organizational types | National, union, zone, campus/ASF, and local church are supported organization types. |
| DEC-006 | Organization onboarding | Organizations may apply; authorized administrators may also onboard organizations within their jurisdiction. Approval is required before administrative authority is granted. |
| DEC-007 | Campus transition | Campus/ASF leadership handover requires approval by the responsible zone authority. |
| DEC-008 | Zone transition | Zone leadership handover requires approval by the responsible union authority. |
| DEC-009 | Union transition | Union leadership handover requires approval by the national authority. |
| DEC-010 | National transition | The designated national oversight authority remains to be formally established. |
| DEC-011 | Event authority | Executives may create events within their organization; event editing/removal is limited to authorized administrators in that scope and higher authorized oversight. Peer administrators cannot manage each other's events. |
| DEC-012 | Membership records | Membership-record management follows the previously approved restricted campus/organizational administrative model; ordinary executives do not automatically receive unrestricted record access. |
| DEC-013 | Global Status | Individual members and authorized organizational publishers can publish status updates. All authenticated members can view active global statuses regardless of organization. |
| DEC-014 | Status lifecycle | Statuses default to 24-hour expiry; persistent posts and announcements are separate. |
| DEC-015 | Developer independence | Authorized administrators must operate the platform through its UI without developer/backend access for routine tasks. |
| DEC-016 | Institutional handover | Ownership, credentials, documentation, and operational control must be transferable to NAAS. |

## Change control

Any change to an approved decision must be recorded with:
- decision ID,
- proposed change,
- reason,
- affected modules/data/security,
- approval authority,
- effective version/date.

Do not silently change approved product naming, organizational authority, transition approval chains, or global status visibility.


---

# SOURCE DOCUMENT: docs/backend/STAGE5_6_MEMBERSHIP_ADMINISTRATION.md

# NAASCONNECT Nigeria — Stage 5.6 Membership Administration

**Stage:** 5.6 — Member Administration & Organizational Membership Management  
**Status:** Membership transfer cancellation, two-stage review/rejection, status-management backend RPCs and audit history are implemented; scoped directory/reporting, controlled-account end-to-end tests and UI remain pending.  
**Supabase project:** NAAS (`csytneubatlaakpmnsfk`)  
**GitHub repository:** `TremendousGuru/NAAS`

## Existing foundation reused

- `public.profiles` remains the single person profile linked to Supabase Auth.
- `public.org_memberships` remains the authoritative organization membership table, supporting multiple organization memberships per user and statuses: pending, active, suspended, ended.
- Existing RLS allows members to view their own membership and authorized administrators to view memberships within their jurisdiction. Member self-enrollment remains limited to active campus/church organizations.
- Existing `private.can_administer_org` hierarchy helper is reused for scoped authorization.

## Added in this stage

### Membership transfer requests
`public.membership_transfer_requests` records a member-initiated move between campus/church organizations, including source and destination, review state, reviewer identities/timestamps, notes, and resulting membership reference.

Transfer states: `pending_source`, `pending_destination`, `approved`, `rejected`, `cancelled`.

A member may request a transfer only for their own active campus/church membership and to an active campus/church destination. Requests are visible to the member and administrators authorized over either endpoint.

### Stage 5.6.3 — Transactional transfer review engine

Added `public.review_membership_transfer(p_transfer_id, p_decision, p_reviewer_notes)`.

- Source-stage review requires an administrator authorized over the source organization.
- Source approval advances the request from `pending_source` to `pending_destination`; it does not prematurely release the member.
- Source rejection marks the request rejected and records an audit event.
- Destination-stage review requires an administrator authorized over the destination organization.
- Destination rejection marks the request rejected and records an audit event.
- Destination approval revalidates that the source membership is still active and the destination remains an active campus/church.
- Final approval atomically ends the source membership, creates or reactivates an ended destination membership, completes the request, and writes outgoing/incoming membership history events.
- If the destination already has a membership in a state other than `ended`, final approval fails rather than overwriting an active, suspended or pending record.
- The user's Supabase Auth identity and profile are not changed.

The public RPC is a `SECURITY INVOKER` wrapper. The implementation is held in the non-public `private` schema as a narrowly scoped `SECURITY DEFINER` function with an empty search path, explicit authentication and jurisdiction checks, row locks, and schema-qualified references. This is necessary because final approval updates both organizations' membership records in one transaction while direct client updates to transfer requests remain disabled.

### Membership history
`public.membership_events` stores a durable event timeline for membership requests, approvals, status changes, and transfers. Authenticated users may read their own history; scoped administrators may read history for their organizations. Direct client inserts are not granted.

### Security and indexes
- RLS enabled on both new tables.
- No anonymous table access.
- Transfer requests: member-owned insert only, pending initial state, validated active source membership and active destination campus/church.
- No direct authenticated UPDATE on transfer requests.
- No direct authenticated INSERT on membership history.
- Foreign-key indexes added for transfer reviewer/source/result references and event actor/transfer references.

## Applied migrations

- `20261121142038_stage5_6_membership_transfer_and_history_foundation` (recorded in Supabase ledger; original SQL file not present in repository)
- `20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc` (recorded in Supabase ledger; original SQL file not present in repository)
- `20261121142125_stage5_6_2_membership_fk_performance_indexes` (recorded in Supabase ledger; original SQL file not present in repository)
- `20261121145225_stage5_6_3_transactional_membership_transfer_review`

## Verification

- Migration applied successfully.
- Authenticated role can execute the public review RPC; anonymous role cannot.
- Public RPC is SECURITY INVOKER; internal implementation is in the private schema.
- Internal function rejects unauthenticated callers and validates authorization against the source/destination organization using `private.can_administer_org`.
- Security advisor: zero findings.
- Health advisor: zero findings.
- Performance advisor: remaining notices are informational unused-index reports on the currently low-traffic project; no new missing-index finding was returned for this change.
- No real membership, transfer or event rows were seeded or altered.

**Testing limitation:** No controlled source-admin, destination-admin and member test accounts were available in this execution context. Therefore, the successful end-to-end path and negative cross-jurisdiction scenarios still require controlled test accounts before Stage 5.6 can be closed.


### Stage 5.6.4 — Membership suspension, reactivation and termination

Added `public.manage_membership_status(p_membership_id, p_action, p_reason)` with the private implementation `private.manage_membership_status(...)`.

Supported transitions:
- `suspend`: active → suspended.
- `reactivate`: suspended → active.
- `terminate`: active or suspended → ended.
- Pending memberships cannot be changed through this operation; ended memberships cannot be reactivated through this operation.

Authorization and safeguards:
- Requires an authenticated actor and an active administrator authorized over the membership's organization through `private.can_administer_org`. The existing hierarchy permits higher-level administrators to manage subordinate organizations, while unrelated organizations remain out of scope.
- Administrators cannot change their own membership status through this RPC.
- A non-empty reason of 10–1000 characters is mandatory.
- The target membership row is locked during transition; invalid or stale transitions fail without partial updates.
- The public RPC is SECURITY INVOKER. Its implementation is in the non-public `private` schema as SECURITY DEFINER, with an empty search path and schema-qualified relations. Anonymous execution is revoked; authenticated execution is explicitly granted.
- The membership row records the latest status reason, actor and timestamp. Each transition also inserts a durable `membership_events` record with previous status, new status and reason in the same transaction.

Database changes:
- Added nullable `status_reason`, `status_changed_by`, and `status_changed_at` columns to `public.org_memberships`.
- Added a reason-length constraint and an index for the `status_changed_by` foreign key.
- Reused the existing event constraint values `membership_suspended`, `membership_reactivated`, and `membership_ended`.

Applied migrations:
- `20261121145523_stage5_6_4_membership_status_lifecycle` — [SQL migration](../../supabase/migrations/20261121145523_stage5_6_4_membership_status_lifecycle.sql)
- `20261121145544_stage5_6_4_membership_status_actor_index` — [SQL migration](../../supabase/migrations/20261121145544_stage5_6_4_membership_status_actor_index.sql)
- `20261121145638_stage5_6_4_1_reject_null_status_action` — [SQL migration](../../supabase/migrations/20261121145638_stage5_6_4_1_reject_null_status_action.sql)

Verification:
- All three Stage 5.6.4 migrations applied successfully.
- Confirmed the three new membership columns and the event-type constraint.
- Confirmed public wrapper is SECURITY INVOKER and private implementation is SECURITY DEFINER.
- Confirmed authenticated role can execute the public RPC and anonymous role cannot; the private implementation is not executable by anon.
- Unauthenticated-call guard test passed (SQLSTATE 28000); explicit NULL-action rejection test passed (SQLSTATE 22023); no membership rows were changed or seeded.
- Security advisor: zero findings. Health advisor: zero findings.
- Performance advisor initially identified the new status-actor foreign key as unindexed; added the covering index. Remaining performance notices are informational unused-index reports.

**Testing limitation:** No controlled administrator/member test accounts were available. Therefore, full successful transition tests and negative cross-jurisdiction tests (including unrelated-admin denial and self-change denial) remain required before closing the broader Stage 5.6 workflow.


### Stage 5.6.5 — Member cancellation and complete transfer rejection coverage

Implemented the member-facing cancellation RPC and hardened both administrator review stages.

**Member-initiated cancellation**
- Added `public.cancel_membership_transfer(p_transfer_id, p_cancellation_reason)` with the implementation in `private.cancel_membership_transfer(...)`.
- Only the authenticated user who owns the transfer request may cancel it.
- Cancellation is permitted while the request is `pending_source` or `pending_destination`; approved, rejected or already-cancelled requests cannot be cancelled again.
- A reason of 10–1000 characters is required and stored with the request, actor and timestamp.
- The cancellation and `transfer_cancelled` audit event are written in one transaction. The source membership remains unchanged.

**Administrator rejection**
- Source-stage rejection requires an administrator authorized over the source organization.
- Destination-stage rejection requires an administrator authorized over the destination organization.
- Rejection requires a reason of 10–1000 characters; reviewer, timestamp, stage and reason are recorded.
- Row locking and pending-stage checks prevent duplicate or stale review actions.
- Approval remains a two-stage process and retains final source/destination revalidation.

**Audit constraint correction**
- Expanded `membership_events_event_type_check` to include event types already emitted by the transfer-review engine: `transfer_source_approved`, `transfer_completed_out`, and `transfer_completed_in`, plus the new `transfer_cancelled` event.
- This fixes a pre-existing constraint mismatch that could have caused source approval and completed transfer operations to fail when inserting their audit records.

**Database changes and migrations**
- Added `cancelled_by`, `cancelled_at`, and `cancellation_reason` to `public.membership_transfer_requests`.
- Added a cancellation-reason length constraint and an index for the cancellation actor foreign key.
- `20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening` — [SQL migration](../../supabase/migrations/20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql)
- `20261121145933_stage5_6_5_1_cancelled_by_fk_index` — [SQL migration](../../supabase/migrations/20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql)

**Security and verification**
- Public RPC wrappers are SECURITY INVOKER; private implementations are SECURITY DEFINER with an empty search path and schema-qualified objects.
- Anonymous execution is revoked; authenticated execution is explicitly granted.
- Cancellation checks `auth.uid() = request.user_id` inside the privileged function; review checks jurisdiction using `private.can_administer_org`.
- Confirmed migration history, cancellation columns, expanded event constraint, function security modes and grants.
- Guard tests passed for unauthenticated cancellation (SQLSTATE 28000), invalid cancellation reason (SQLSTATE 22023), null review decision (SQLSTATE 22023), and rejection without a valid reason (SQLSTATE 22023).
- Security advisor: zero findings. Health advisor: zero findings. Performance advisor: no remaining unindexed-foreign-key finding after adding the cancellation actor index; remaining notices are informational unused-index reports.

**Testing limitation:** No controlled member/source-admin/destination-admin test accounts or transfer fixtures were available. Full end-to-end tests are still required for owner cancellation at both pending stages, non-owner cancellation denial, source and destination rejection, unrelated-admin denial, and successful two-stage approval. No production membership or transfer rows were seeded or changed during verification.


### Stage 5.6.6 — Scoped membership directory, search and aggregate statistics

Implemented two authenticated RPCs:
- `public.get_scoped_membership_directory(p_org_id, p_search, p_membership_status, p_limit, p_offset)`
- `public.get_scoped_membership_statistics(p_org_id)`

Both public wrappers are SECURITY INVOKER and delegate to private-schema SECURITY DEFINER implementations. Each private implementation independently checks `auth.uid()` and calls the existing `private.can_administer_org(p_org_id)` authorization helper before reading any scoped membership data. The requested organization is the root of the scope; results include that organization and its descendants, with recursive path tracking to prevent loops if an unexpected hierarchy cycle exists.

**Directory and search**
- Returns paginated membership entries with a maximum page size of 100 and a bounded offset.
- Supports prefix search over display name, institution name and course of study, plus an optional membership status filter (`pending`, `active`, `suspended`, `ended`).
- Includes membership ID, display name, institution, course, study level, role, status, joined date and organization name/type.
- Does not return user UUID, email address, phone number, state of origin, profile avatar URL, auth metadata, or membership audit/reviewer notes.
- Search text is bounded to 100 characters; status values and pagination inputs are validated.

**Aggregate statistics**
- Returns total membership records and counts grouped by pending, active, suspended and ended status.
- Returns per-organization counts for the requested organization and each descendant.
- Contains no member-level identifiers or profile attributes.

**Privacy and authorization**
- Directory and statistics are administrator-only; ordinary members cannot call them successfully.
- Authorization is checked against the requested scope on every invocation, not inferred from client-supplied roles or user-editable metadata.
- A campus/zone/union/national administrator receives only their own organization subtree, according to the existing hierarchy helper.
- No direct table grants or broader profile RLS policies were added.
- The privileged implementation is isolated in the non-public `private` schema, uses an empty search path and fully qualified relations. Anonymous execution is revoked; authenticated execution is explicitly granted.

**Indexes and migration**
- Added prefix-search indexes on lowercased profile display name, institution and course fields.
- Added `org_memberships(org_id,status)` to support scoped status counts and filters.
- Applied migration `20261121150236_stage5_6_6_scoped_membership_directory_and_statistics` — [SQL migration](../../supabase/migrations/20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.sql).

**Verification**
- Confirmed migration history, index definitions, RPC signatures and security modes.
- Confirmed authenticated role can execute both public RPCs; anonymous role cannot.
- Confirmed unauthenticated directory calls are rejected (SQLSTATE 28000).
- Confirmed invalid page size is rejected (SQLSTATE 22023).
- Confirmed unauthorized directory and statistics scopes are rejected (SQLSTATE 42501) using a non-privileged test identity.
- Security advisor: zero findings. Health advisor: zero findings. Performance advisor: no new missing-index or unindexed-foreign-key finding; existing informational unused-index notices remain.
- No test members, memberships or organizations were inserted or modified.

**Testing limitation:** No real administrator accounts were available to verify the positive cases for national/union/zone/campus/church administrators. Before production UI release, run controlled positive and negative scope tests for each administrator level, confirm descendant inclusion and sibling/parent exclusion, verify pagination/search/status filters against known test fixtures, and review whether the approved directory fields match NAAS privacy policy.


### Stage 5.6.7 — Organization-level review queues and membership reporting

Added two authenticated RPCs:
- `public.get_membership_review_queue(p_org_id, p_search, p_from, p_to, p_limit, p_offset)`
- `public.get_membership_activity_report(p_org_id, p_from, p_to)`

**Review queue**
- Reads pending `org_memberships` records in the requested organization and all descendants in its hierarchy.
- Supports prefix search by member display name or institution, optional requested-at date range, and pagination (1–100 rows; bounded offset).
- Orders oldest pending applications first so long-waiting requests surface before newer requests.
- Returns only membership ID, organization identity/name/type, display name, institution, course, study level, requested role and request timestamp.
- Does not return email, phone, profile UUID, state of origin, auth metadata, or audit details.
- This is a read-only review queue; approval/rejection continues through the existing membership review/status workflows and is not duplicated here.

**Membership activity report**
- Returns all-time membership totals and pending/active/suspended/ended counts for the authorized organization subtree.
- Returns activity-event counts by event type for the optional date range, plus per-organization membership/status totals and event counts for the same period.
- Reads existing `membership_events` audit records; it does not create or mutate audit events.
- Contains aggregate data only, with no member-level identifiers.

**Authorization and privacy**
- Both public RPCs are SECURITY INVOKER wrappers around private-schema SECURITY DEFINER implementations.
- Each private implementation requires a non-null `auth.uid()` and independently calls `private.can_administer_org(p_org_id)`.
- Scope includes the requested organization and descendants only; sibling or unrelated organizations are excluded by the recursive scope query.
- Anonymous execution is revoked and authenticated execution explicitly granted. The private implementation uses an empty search path and schema-qualified tables.
- No direct table grants, broader RLS policies, or new personal-data fields were introduced.

**Indexes and migration**
- Added partial index `org_memberships_org_pending_created_idx` for pending review queue ordering.
- Added `membership_events_org_created_idx` and `membership_events_org_type_created_idx` for organization/date and event-type reporting.
- Applied migration `20261121150817_stage5_6_7_org_membership_review_queues_and_reporting` — [SQL migration](../../supabase/migrations/20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql).

**Verification**
- Confirmed migration history and queue/report RPC definitions.
- Confirmed authenticated role can execute both public RPCs; anonymous role cannot.
- Confirmed unauthenticated queue and report calls are rejected (SQLSTATE 28000).
- Confirmed null organization scope is rejected (SQLSTATE 22023).
- Confirmed unauthorized organization scope is rejected (SQLSTATE 42501).
- Security advisor: zero findings. Health advisor: zero findings. Performance advisor reports informational unused-index notices; no new missing-index or unindexed-FK finding was reported.
- No production memberships, member profiles or audit rows were inserted or modified.

**Testing limitation:** The project does not yet have controlled administrator accounts and representative pending-membership fixtures for positive E2E coverage. Before production release, test national/union/zone/campus/church administrators against known fixtures; verify descendant visibility and sibling/parent exclusion, date/search filters, pagination, oldest-first ordering and report totals. The audit-event report currently has no event fixtures to validate non-zero event counts.

## Remaining Stage 5.6 work

3. Test complete workflows and role boundaries with controlled test accounts.
4. Build the member administration UI in the frontend phase.

**Important:** Stages 5.6.3–5.6.5 implement the membership transfer and status-management database workflows. The whole Stage 5.6 feature set is not yet complete.


### Migration source integrity note — 21 November 2026

The three Stage 5.6.0–5.6.2 version references above have been corrected to match the read-only Supabase migration ledger. Their original SQL files are not currently present in the repository or available inspected commit history. The Stage 5.6.3 applied migration `20261121145225` is also absent from the repository. Do not recreate these files and claim they are original, and do not replay any of these migrations. See [Migration Source Integrity Forensic Report](MIGRATION_SOURCE_INTEGRITY_FORENSIC_REPORT.md) for the recovery gate and full evidence.

**Migration synchronization remains blocked** until trusted original sources or a separately approved reconstructed-baseline procedure is available. Stage 5.9 audit-log implementation must not deploy a migration before that gate is passed.


---

# SOURCE DOCUMENT: docs/backend/STAGE5_7_COMMUNITY_SOCIAL.md

# NAASCONNECT Nigeria — Stage 5.7 Community & Social Features

**Stage:** 5.7 — Community and platform-wide status updates  
**Status:** Initial backend foundation implemented; application UI and controlled-account end-to-end verification remain for later frontend/final integration phases.  
**Supabase project:** NAAS (`csytneubatlaakpmnsfk`)  
**GitHub repository:** `TremendousGuru/NAAS`

## Approved behavior

- Individual members can publish a status update.
- Authorized organizational administrators can publish on behalf of their organization (campus, church, zone, union or national organization).
- Published, unexpired statuses are visible platform-wide to authenticated NAASCONNECT users, not restricted to the author's organization.
- Statuses expire after 24 hours by default, reflecting the previously approved WhatsApp-style status concept.
- Text is required (1–2,000 characters). An optional HTTPS media URL is supported as a reference; media upload/storage integration is not part of this database foundation.
- Personal status creation requires the author to have at least one active NAASCONNECT organization membership.
- Organization status creation requires the current user to pass the existing `private.can_administer_org` authorization check for that organization.
- Personal authors can delete their own personal statuses. Organization statuses can be deleted by administrators authorized over that organization.
- No public/anonymous access is granted.

## Database implementation

Created `public.community_statuses` with:
- `author_user_id`: authenticated author identity.
- `author_org_id`: null for personal posts; populated for organization-authored posts.
- `content`: required text.
- `media_url`: optional HTTPS URL.
- `created_at` and `expires_at`: status lifetime metadata.

RLS is enabled. Authenticated users can read only unexpired records. Insert and delete policies enforce the ownership and organizational authorization rules above. Anonymous privileges are revoked. The feed index supports expiry filtering and newest-first ordering.

Migration: `20261121162500_stage5_7_global_community_statuses` — [SQL migration](../../supabase/migrations/20261121162500_stage5_7_global_community_statuses.sql).\n\nHardening migration: `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening` — consolidates insert/delete policies to avoid duplicate permissive-policy overhead and adds indexes for both author foreign keys. [SQL migration](../../supabase/migrations/20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql).\n\nPrivilege migration: `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants` — removes inherited broad authenticated table grants and explicitly grants only SELECT, INSERT and DELETE. [SQL migration](../../supabase/migrations/20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql).

## Deliberately not included in this initial backend slice

- Comments, reactions, private messaging or group chat.
- Push/email notifications.
- Media file upload/storage buckets.
- Event creation and event management (separate roadmap capability).
- Frontend feed/status viewer and composer.
- Read receipts / status-viewer lists.

These should be implemented only in their corresponding planned stages, without broadening this stage unexpectedly.

## Verification and limitations

- Both migrations applied successfully to the existing NAAS Supabase project; no paid branch was created.\n- Security advisor: zero findings. Health advisor: zero findings.\n- Explicit privilege verification found inherited broad authenticated grants; Stage 5.7.2 revoked them and re-granted only SELECT, INSERT and DELETE.\n- Performance advisor initially identified unindexed author foreign keys and duplicate permissive insert/delete policies; Stage 5.7.1 added the two foreign-key indexes and consolidated each policy pair.
- Table has RLS enabled and anonymous privileges revoked.
- Authenticated feed reads are limited to statuses whose expiry is in the future.
- Personal and organization insert policies use the authenticated identity and existing active-membership / organizational-admin authorization foundation.
- No production member, organization, membership or status rows were inserted or modified during this implementation.
- Controlled-account positive/negative tests are deferred under the user's approved decision to defer Stage 5.6.8 and consolidate end-to-end testing later.
- Before release, verify personal posting, organization posting at all five hierarchy levels, platform-wide visibility, unauthorized organization posting/deletion denial, expiry filtering and media URL handling with controlled accounts.



---

# SOURCE DOCUMENT: docs/backend/V1_PHASE_5_9_GENERAL_AUDIT_LOGS_DESIGN.md

# NAASCONNECT Nigeria — V1 Phase 5.9 General Audit Logs Design

**Status:** Design specification only — implementation blocked by migration source-integrity gate.  
**V1 authority:** Master Project Control Document V1.0, Phase 5.9.  
**Scope:** General administrative/security audit records across NAASCONNECT's organization hierarchy.

## 1. Purpose

Provide a durable, queryable record of consequential administrative and security actions, with visibility constrained to the actor's authorized organizational jurisdiction. This is a general platform audit trail, not a replacement for domain-specific histories already implemented.

## 2. Existing history that must not be duplicated

The live database already contains:
- `public.membership_events` — membership lifecycle, transfer, review and status-change events.
- `public.leadership_history` — approved executive/leadership succession history.
- `public.leadership_notification_events` — leadership-handover notification events.
- `public.membership_transfer_requests` — the current transfer workflow and review state.

Phase 5.9 must not copy these records into a second generic event stream. Existing domain history tables remain authoritative for their respective events. General audit logs may reference a domain record only when a separate, non-duplicative administrative action needs an audit entry.

## 3. Proposed general audit event scope

Include actions that are not already fully represented by the domain-specific histories, such as:
- organization creation, activation, suspension, archival, and material hierarchy/contact-setting changes;
- administrator-seat assignment, revocation and privilege changes;
- application/appointment decisions that are not already captured by their own durable decision history;
- changes to platform-wide security and governance configuration;
- privileged moderation actions and sensitive administrative access, if those workflows are approved;
- security-relevant denied privileged operations, where safe and useful to record.

Exclude:
- ordinary member profile browsing and routine reads by default;
- duplicate membership status/transfer events;
- duplicate leadership appointment/handover events;
- passwords, tokens, API keys, session secrets, full auth metadata, or unrestricted request bodies;
- unnecessary sensitive personal data.

## 4. Proposed record model

Proposed table name: `public.admin_audit_logs` (subject to schema-name collision check at implementation time).

Proposed fields:
- `id` UUID primary key;
- `actor_user_id` UUID nullable only for explicitly identified system-originated actions;
- `actor_org_id` UUID nullable, representing the acting administrator's active scope when known;
- `target_org_id` UUID nullable, the organization affected;
- `action_key` text, constrained to a controlled event vocabulary;
- `entity_type` text, controlled allowlist;
- `entity_id` UUID nullable;
- `summary` JSONB, strictly allowlisted, minimal, non-secret metadata only;
- `request_id` UUID/text correlation identifier where available;
- `created_at` timestamptz, server-generated and immutable.

No client-supplied actor identity, timestamp, role, scope or arbitrary payload may be trusted.

## 5. Write path and immutability

- No direct authenticated or anonymous INSERT, UPDATE, DELETE or TRUNCATE grants.
- No user-facing write RPC that accepts an arbitrary actor or unrestricted audit payload.
- Emit events from trusted database triggers or narrowly scoped private-schema functions attached to approved domain mutations.
- Audit writes should occur in the same transaction as the mutation where possible, so the action and its audit record commit or roll back together.
- Use a fixed empty `search_path`, schema-qualified object references, explicit authentication/authorization checks, and narrowly scoped EXECUTE grants for any SECURITY DEFINER implementation.
- Prevent recursive self-auditing of writes to the audit table.
- Audit records are append-only to application roles. Corrections, if ever required, should be represented as separate corrective events, not edits to prior records.

## 6. Jurisdiction-scoped read access

- RLS enabled.
- Authenticated read access only.
- A reader may see records where `target_org_id` is within the reader's authorized organization subtree, using the established `private.can_administer_org(target_org_id)` hierarchy helper.
- National/union/zone/campus/church administrators must not read sibling or unrelated jurisdictions.
- Where `target_org_id` is null (platform-wide event), access must be limited to an explicitly approved national-level audit role; do not treat a null target as globally visible.
- Actor self-visibility is not automatically granted; V1 owner approval must decide whether non-admin actors can see their own audit events.
- Do not use client-editable `user_metadata` or client-supplied role claims as authorization inputs.

## 7. Indexing and retention

Candidate indexes:
- `(target_org_id, created_at DESC)`;
- `(actor_user_id, created_at DESC)`;
- `(action_key, created_at DESC)`;
- `(entity_type, entity_id, created_at DESC)` only if actual query requirements justify it.

Retention duration, export/archival rules, legal/privacy basis, and any deletion/immutability exception require an explicit NAAS governance decision before DDL. Do not assume indefinite retention without approval.

## 8. Verification requirements before closure

- Confirm no existing table/function name collision.
- Prove unauthenticated and anonymous reads/writes are denied.
- Prove direct authenticated INSERT/UPDATE/DELETE/TRUNCATE are denied.
- Prove national/union/zone/campus/church scope inheritance and sibling isolation.
- Prove null-target platform events are visible only to the explicitly approved national audit role.
- Prove actor identity and timestamps are server-derived.
- Prove audit insertion is atomic with each supported domain mutation.
- Prove membership and leadership event flows do not create duplicate generic records.
- Test tampering, payload size/field allowlists, SQL injection surfaces, and retention/export behavior.
- Run Supabase security, health and performance advisors and document findings.
- Controlled-account end-to-end tests remain required; no test result should be claimed until run.

## 9. Implementation gate

This is design only. No Phase 5.9 migration, table, policy, function, trigger or data write has been created. Implementation may begin only after the migration source-integrity recovery gate in `docs/backend/MIGRATION_SOURCE_INTEGRITY_FORENSIC_REPORT.md` is passed and documented.

---


---

# SOURCE DOCUMENT: docs/backend/PHASE_5_9_MIGRATION_RECONCILIATION_REGISTER.md

# NAASCONNECT Phase 5.9 — 29-Entry Migration Reconciliation Register

**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Remote ledger snapshot:** 21 November 2026, read-only  
**Authority:** NAASCONNECT Nigeria V1.0  
**Status:** Source evidence mapped; final local validation and preservation exports outstanding.

## Executive result

The remote ledger contains **29 applied entries**, each with exactly one SQL statement in its `statements` array. The active repository contains **26 migration files**.

The reconciliation is:

- **12** same-version/name repository files match their ledger SQL after comments and whitespace are normalized.
- **9** same-version/name repository files differ from the stored ledger SQL after that normalization. The exact ledger payloads are preserved under `docs/backend/recovered-ledger-statements/`.
- **4** timestamp-shifted repository candidates (Stage 5.5.2 and Stage 5.7.0–5.7.2) match their ledger payload after comment/whitespace normalization.
- **4** original Stage 5.6 local migration files are absent, but their applied SQL payloads are recovered from the ledger.
- **17** ledger SQL payloads are preserved individually in the recovered-ledger archive (the 8 previously unmatched entries plus 9 divergent same-version files).

A normalized textual match is not byte-for-byte proof of the original local file. Ledger statement payloads are the best available evidence of the SQL recorded for each applied entry.

## Complete ordered mapping

| Ledger version | Ledger name | Current repository source | Classification | Ledger payload evidence |
|---|---|---|---|---|
| `20261121130420` | `stage5_provisional_geography_admin_seats` | `supabase/migrations/20261121130420_stage5_provisional_geography_admin_seats.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121130420_stage5_provisional_geography_admin_seats.ledger-recovered.sql` |
| `20261121131034` | `stage5_2_profiles_org_applications_member_onboarding` | `supabase/migrations/20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | MATCH_NORMALIZED | — |
| `20261121131101` | `stage5_2_1_onboarding_policy_and_fk_indexes` | `supabase/migrations/20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql` | MATCH_NORMALIZED | — |
| `20261121131109` | `stage5_2_2_limit_self_membership_to_campus_church` | `supabase/migrations/20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql` | MATCH_NORMALIZED | — |
| `20261121132238` | `stage5_3_admin_appointment_approval_engine` | `supabase/migrations/20261121132238_stage5_3_admin_appointment_approval_engine.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121132238_stage5_3_admin_appointment_approval_engine.ledger-recovered.sql` |
| `20261121132415` | `stage5_3_1_harden_admin_appointment_rpc_wrappers` | `supabase/migrations/20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.ledger-recovered.sql` |
| `20261121134717` | `stage5_4_leadership_handover_executive_management` | `supabase/migrations/20261121134717_stage5_4_leadership_handover_executive_management.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121134717_stage5_4_leadership_handover_executive_management.ledger-recovered.sql` |
| `20261121134728` | `stage5_4_1_handover_security_and_review_fixes` | `supabase/migrations/20261121134728_stage5_4_1_handover_security_and_review_fixes.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121134728_stage5_4_1_handover_security_and_review_fixes.ledger-recovered.sql` |
| `20261121134737` | `stage5_4_2_president_role_revocation_fix` | `supabase/migrations/20261121134737_stage5_4_2_president_role_revocation_fix.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121134737_stage5_4_2_president_role_revocation_fix.ledger-recovered.sql` |
| `20261121134747` | `stage5_4_3_leadership_fk_indexes` | `supabase/migrations/20261121134747_stage5_4_3_leadership_fk_indexes.sql` | MATCH_NORMALIZED | — |
| `20261121134806` | `stage5_4_4_revoke_public_private_rpc_execution` | `supabase/migrations/20261121134806_stage5_4_4_revoke_public_private_rpc_execution.sql` | MATCH_NORMALIZED | — |
| `20261121134918` | `stage5_4_5_approver_inbox_and_platform_announcements` | `supabase/migrations/20261121134918_stage5_4_5_approver_inbox_and_platform_announcements.sql` | MATCH_NORMALIZED | — |
| `20261121140551` | `stage5_5_executive_portfolios_directory_term_management` | `supabase/migrations/20261121140551_stage5_5_executive_portfolios_directory_term_management.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121140551_stage5_5_executive_portfolios_directory_term_management.ledger-recovered.sql` |
| `20261121140620` | `stage5_5_1_harden_directory_rpc_and_fk_indexes` | `supabase/migrations/20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes.sql` | MATCH_NORMALIZED | — |
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | `supabase/migrations/20261121140642_stage5_5_2_scoped_executive_term_updates.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121140749_stage5_5_2_scoped_executive_term_updates.ledger-recovered.sql` |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121142038_stage5_6_membership_transfer_and_history_foundation.ledger-recovered.sql` |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc.ledger-recovered.sql` |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121142125_stage5_6_2_membership_fk_performance_indexes.ledger-recovered.sql` |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121145225_stage5_6_3_transactional_membership_transfer_review.ledger-recovered.sql` |
| `20261121145523` | `stage5_6_4_membership_status_lifecycle` | `supabase/migrations/20261121145523_stage5_6_4_membership_status_lifecycle.sql` | MATCH_NORMALIZED | — |
| `20261121145544` | `stage5_6_4_membership_status_actor_index` | `supabase/migrations/20261121145544_stage5_6_4_membership_status_actor_index.sql` | MATCH_NORMALIZED | — |
| `20261121145638` | `stage5_6_4_1_reject_null_status_action` | `supabase/migrations/20261121145638_stage5_6_4_1_reject_null_status_action.sql` | MATCH_NORMALIZED | — |
| `20261121145919` | `stage5_6_5_transfer_cancellation_and_rejection_hardening` | `supabase/migrations/20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql` | MATCH_NORMALIZED | — |
| `20261121145933` | `stage5_6_5_1_cancelled_by_fk_index` | `supabase/migrations/20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql` | MATCH_NORMALIZED | — |
| `20261121150236` | `stage5_6_6_scoped_membership_directory_and_statistics` | `supabase/migrations/20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.ledger-recovered.sql` |
| `20261121150817` | `stage5_6_7_org_membership_review_queues_and_reporting` | `supabase/migrations/20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.ledger-recovered.sql` |
| `20261121152734` | `stage5_7_global_community_statuses` | `supabase/migrations/20261121162500_stage5_7_global_community_statuses.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121152734_stage5_7_global_community_statuses.ledger-recovered.sql` |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | `supabase/migrations/20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121152827_stage5_7_1_status_policy_and_fk_index_hardening.ledger-recovered.sql` |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | `supabase/migrations/20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121152909_stage5_7_2_restrict_authenticated_status_table_grants.ledger-recovered.sql` |

## Repository-only baseline artifact

`supabase/migrations/20261121133000_org_foundation.sql` has no corresponding migration ledger row. PostgreSQL logs record the actual out-of-band foundation execution at 2026-11-21 12:28:48.007 UTC and follow-up indexes at 12:29:14.311 UTC, via `POST /mcp`. Those exact logged SQL payloads are preserved under `docs/backend/recovered-baseline-logs/`. The committed repository file is related but not byte-identical to the logged statements. See [out-of-band foundation provenance](recovered-baseline-logs/README.md).

## Divergence review flags

The nine divergent same-version files are not merely whitespace differences. Examples visible in the compared SQL include:
- Stage 5.1 repository file contains an additional update setting provisional union/zone status to pending that is absent from the ledger payload.
- Stage 5.3 repository file adds a lower-case email check and changes FK delete behavior relative to the ledger payload.
- Stage 5.3.1 repository file changes review error handling/messages.
- Stage 5.4 repository file differs in approval-organization handling for root organizations.
- Stage 5.4.1 ledger payload contains a self-approval prohibition that is absent from the current repository candidate.
- Stage 5.4.2 repository candidate contains a public wrapper not present in the ledger payload.
- Stage 5.5 repository policy source differs from the ledger payload.
- Stage 5.6.6 and 5.6.7 directory/reporting SQL differ from the applied ledger statements.

The ledger-recovered SQL must be reviewed as the historical applied statement. Do not silently overwrite the active repository files or treat the current repository copy as the applied source.

## What this register does and does not authorize

This register maps the applied SQL source evidence for all 29 ledger entries. It does not repair the active migration directory and does not authorize renames, deletes, edits, ledger changes, migration replay, `db push`, or any Supabase DDL/DML.

The recovered payload archive and the out-of-band foundation log archive remain outside `supabase/migrations/`. Do not move them into the migration runner.

## Remaining Phase 5.9 integrity gate

1. Obtain a complete schema-only export and verify its archive listing and SHA-256 manifest.
2. Obtain and verify a separate full restorable backup.
3. Have the owner review and approve this 29-entry mapping, especially the nine divergent same-version files and the out-of-band baseline distinction.
4. Perform a non-mutating local validation/migration-list dry run against a controlled source copy, confirming that no applied migration would be replayed and all 29 ledger rows are accounted for. Do not run `db push`, `migration repair`, or `apply_migration`.
5. Complete Phase 5.9 P1 audit-governance decisions before implementation.

**Database-write approval gate: CLOSED.** Passing this evidence review does not itself authorize a database write. NAASCONNECT V1.0 remains the source of truth.


# ADDITIONAL SOURCE DOCUMENTS — AUTHENTICATION, ADMINISTRATION, LEADERSHIP AND PHASE 5.9



---

# SOURCE DOCUMENT: docs/backend/STAGE5_2_AUTH_ONBOARDING.md

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


---

# SOURCE DOCUMENT: docs/backend/STAGE5_3_ADMIN_APPOINTMENTS.md

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


---

# SOURCE DOCUMENT: docs/backend/STAGE5_4_LEADERSHIP_HANDOVER.md

# NAASCONNECT Nigeria — Stage 5.4: Leadership Handover & Executive Management

## Scope implemented
- Data-driven leadership positions for national, union, zone, campus and church organizations.
- Initial appointment into vacant positions and formal handover from an incumbent.
- Incoming nominee must already have an active membership in the organization and a verified Supabase Auth email.
- Campus/church transitions route to the parent zone; zone transitions route to the parent union; union transitions route to the national organization.
- National-level transitions require a distinct national administrator or national president to approve.
- The submitter cannot approve their own request; the outgoing incumbent cannot approve their own replacement.
- Approval is transactional: the active position holder changes, history is recorded, and notification events are written in the same database transaction.
- A president transition moves the organization's admin membership from the outgoing president to the incoming president and activates the reserved admin seat.
- Rejections preserve the incumbent and record the reviewer decision.
- One pending request per position is enforced by a partial unique index.
- RLS is enabled on every new public table; writes occur only through authenticated RPCs.
- Approving presidents can see pending items in their jurisdictional inbox.
- Approved leadership transitions generate a platform-visible announcement event for signed-in members.
- Private SECURITY DEFINER functions have explicit authentication checks, empty search_path, and restricted execute grants.

## Database objects
- `org_leadership_positions`
- `leadership_handover_requests`
- `leadership_history`
- `leadership_notification_events`
- RPCs: `submit_leadership_handover`, `review_leadership_handover`

## Applied Supabase migrations
- `20261121134717_stage5_4_leadership_handover_executive_management`
- `20261121134728_stage5_4_1_handover_security_and_review_fixes`
- `20261121134737_stage5_4_2_president_role_revocation_fix`
- `20261121134747_stage5_4_3_leadership_fk_indexes`
- `20261121134806_stage5_4_4_revoke_public_private_rpc_execution`
- `20261121134918_stage5_4_5_approver_inbox_and_platform_announcements`

## Verification and current limitations
- RLS is enabled on all four new public tables.
- Public RPC wrappers are authenticated-only; private implementation grants were explicitly revoked from PUBLIC/anon.
- Supabase security advisor returned no findings after implementation.
- Foreign-key index audit returned zero missing indexes.
- No real leadership transition has been executed: there are currently no active administrator memberships, no authenticated test leaders and no leadership positions seeded. End-to-end approval/transfer tests require test accounts and a seeded test organization.
- UI screens and outbound email/push delivery remain frontend/notification-delivery work. This stage creates durable in-app notification events and a platform-visible announcement record; real-time fan-out and external email delivery are not yet configured.
- Geographic records remain provisional/pending until formally confirmed; no live leadership has been invented or pre-populated.

## Operational rule
Do not activate real officers until the national bootstrap and jurisdictional administrator appointments are completed. Seed initial positions through the approved administrative workflow, then process handovers through the parent-level approval chain.


---

# SOURCE DOCUMENT: docs/backend/STAGE5_5_EXECUTIVE_MANAGEMENT.md

# NAASCONNECT Nigeria — Stage 5.5: Executive Onboarding & Organizational Management

## Implemented
- Organization-scoped executive portfolio catalogue.
- Portfolio title, description, responsibilities, display order, required/optional flag, and suggested term duration (1–60 months).
- Administrative save/upsert RPC guarded by `private.can_administer_org`, preserving jurisdictional hierarchy.
- Existing leadership positions can be linked to matching portfolio keys; current holder and handover authority remain controlled by Stage 5.4.
- Member-visible executive directory RPC returns only position details and public profile fields, and only to active members of that organization or administrators with jurisdiction.
- Directory computes term indicators: vacant, active without end date, term ending within 60 days, and expired.
- Existing Stage 5.4 initial appointment/handover requests remain the only route for assigning a person to a position. A new executive must be an active member with verified email; approval follows the parent-level chain.
- New foreign-key and term indexes.

## Database objects
- `public.org_executive_portfolios`
- Added `portfolio_id` and `appointment_notes` to `public.org_leadership_positions`
- Scoped term update RPC: `public.set_executive_term`
- RPCs: `public.save_executive_portfolio`, `public.get_org_executive_directory`
- Private implementation functions with restricted execute grants.

## Applied migrations
- `20261121140551_stage5_5_executive_portfolios_directory_term_management`
- `20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes`
- `20261121140642_stage5_5_2_scoped_executive_term_updates`

## Security and verification
- RLS enabled on the new public portfolio table.
- Portfolio reads require active organization membership or administrative jurisdiction.
- Portfolio writes and executive term changes are only possible through authenticated RPCs, which verify `private.can_administer_org`.
- Term updates only apply to active appointments and reject end dates earlier than the appointment start.
- Directory access requires authentication plus active membership or administrative jurisdiction.
- Public/anon cannot execute either RPC.
- Directory RPC is a SECURITY INVOKER API wrapper; its private SECURITY DEFINER implementation validates organization scope before returning only display-name/avatar fields and executive data.
- Security advisor: no remaining findings after the hardening migration.
- Health advisor: no findings.
- Performance advisor: new foreign-key indexes added. Unused-index notices are expected before application traffic.
- No live executive or portfolio records were fabricated. Current portfolio count and leadership position count are both zero; actual rosters must be configured by authorized administrators.

## Not yet delivered in this backend stage
- Frontend appointment-review dashboards and executive management screens.
- Automated email/push delivery and scheduled term-expiry reminders.
- Real-account end-to-end approval tests require authenticated test users and a seeded test organization.
- No standard portfolio catalogue was preloaded because official executive titles and portfolios may vary by organization and must be confirmed by NAAS leadership.

## Operational workflow
1. An authorized administrator configures the organization's executive portfolios and responsibilities.
2. The administrator submits an initial appointment through the existing Stage 5.4 handover RPC.
3. The nominee must already have an active organization membership and verified email.
4. The parent-level authority reviews the appointment.
5. Upon approval, the position becomes active and term end dates and appointment notes can be maintained by an authorized administrator.
6. Handover requests use the same approval chain and preserve the audit history.


---

# SOURCE DOCUMENT: docs/backend/STAGE5_ADMIN_PROVISIONING.md

# NAASCONNECT — Stage 5 Administrator Provisioning

## Implemented
- Added the three union records beneath the national root: WNUC, ENUC and NNUC.
- Added 20 provisional zones from the project's supplied working territorial list: 9 Western, 3 Northern and 8 Eastern.
- Added one reserved administrator seat for the national root, each union and each zone (24 seats total).
- Each seat has a unique username, role, approval authority and reserved status.
- Approval routing: national root appoints/approves union administrators; each union approves its zone administrators.
- The geography is explicitly marked provisional in metadata and its organization status is pending; it must be confirmed by NAAS/church authorities before public launch.
- Campus and local-church records are not fabricated; they will be added as verified institutions/locations are supplied or approved.

## Credential lifecycle
The agreed default password `123456789` is retained as a temporary handover bootstrap credential policy. It is NOT stored in this table, source code, metadata or plaintext database fields, and no shared Auth accounts have been created. A reserved seat is not a login account.

At handover, after the named appointee's email and appointment are verified, the controlled provisioning process may issue the agreed temporary credential. First successful sign-in must force a password change and completion of required profile details before privileged access is granted. The Auth password itself must be stored only by Supabase Auth (hashed); application data stores only credential lifecycle state. Do not send the common temporary credential in bulk or publish it.

## Security and operational notes
- `org_admin_seats` has RLS enabled and no anonymous table grants.
- Authenticated SELECT is granted but row access is restricted to administrators who can administer the organization or its approval authority.
- No user Auth accounts were created because no appointee names/emails have been supplied.
- A future activation workflow must verify the appointee, issue credentials individually, require password replacement, and only then activate the matching `org_memberships` row.
- The first provisional seed used only the supplied working list; it is not a certified official national directory.

## Applied migration
`supabase/migrations/20261121130420_stage5_provisional_geography_admin_seats.sql`


---

# SOURCE DOCUMENT: docs/backend/PHASE_5_9_COMPLETION_GATE_BRIEFING.md

# NAASCONNECT Nigeria — Phase 5.9 Completion Gate Briefing

**Review date:** 21 November 2026  
**Authority:** NAASCONNECT Nigeria V1.0 and approved architecture  
**Scope:** V1 Phase 5.9 — General Audit Logs  
**Disposition:** DESIGN REVIEW COMPLETE; IMPLEMENTATION BLOCKED BY MIGRATION SOURCE-INTEGRITY GATE

## 1. Executive decision

Phase 5.9 has a coherent design specification and has been checked against the approved V1 architecture, existing membership and leadership history, the current GitHub migration set, and a fresh read-only Supabase inspection.

It is **not complete or production-implemented**. The live database has no `public.admin_audit_logs` table or other object with an audit name in the public/private schemas. The remote migration ledger remains at 29 records. The four missing applied Stage 5.6 SQL sources, the repository-only `org_foundation` artifact, and the exact-source uncertainty for Stage 5.5.2/5.7 remain unresolved. The migration synchronization gate is still NOT PASSED.

The owner's earlier instruction expressly prohibited Phase 5.9 DDL until that gate demonstrably passes. The current request to complete Phase 5.9 does not remove the technical precondition or provide evidence that it has passed. No Phase 5.9 DDL, migration replay, data change, or ledger modification was performed.

## 2. Architecture alignment review

The existing design in `V1_PHASE_5_9_GENERAL_AUDIT_LOGS_DESIGN.md` aligns with V1 in the following ways:

- Provides a durable administrative/security audit trail across the organization hierarchy.
- Uses organization-scoped visibility and the established `private.can_administer_org(target_org_id)` hierarchy authorization helper.
- Does not create a second identity, role, membership, or organization model.
- Does not replace the existing domain-specific histories.
- Uses server-derived actor identity and timestamps; clients cannot submit actor, role, scope, timestamp, or unrestricted payload fields.
- Keeps writes trusted, append-only for application roles, and transactionally coupled to the action where feasible.
- Denies direct application-role insert/update/delete/truncate.
- Avoids passwords, tokens, API keys, session secrets, raw auth metadata, and unnecessary personal data.
- Requires explicit handling for platform-wide/null-target events rather than making them globally visible.
- Requires controlled-account tests for positive and negative hierarchy boundaries.

### No-duplication boundary

These existing tables remain authoritative and must not be mirrored into the generic audit table:

| Existing object | Authoritative responsibility | Phase 5.9 treatment |
|---|---|---|
| `public.membership_events` | Membership lifecycle, transfer, review and status-change events | Do not duplicate |
| `public.leadership_history` | Approved executive/leadership succession history | Do not duplicate |
| `public.leadership_notification_events` | Leadership handover notification events | Do not duplicate |
| `public.membership_transfer_requests` | Current transfer workflow state | Do not duplicate workflow rows |

A general audit event may reference a domain record only when it records a distinct consequential administrative/security action not already fully represented by the domain history.

## 3. Fresh read-only Supabase verification

Project: `csytneubatlaakpmnsfk`

| Check | Observed result |
|---|---|
| Remote migration ledger | 29 records |
| `public.admin_audit_logs` | Absent |
| Other public/private objects with audit in their name | None found |
| `public.membership_events` | Present |
| `public.leadership_history` | Present |
| `public.leadership_notification_events` | Present |
| Security advisor | 0 lints |
| Health advisor | 0 lints |
| Performance advisor | 57 INFO unused-index findings |

The 57 unused-index findings are informational observations in the current low/early-usage environment. They are not authorization to drop indexes; evaluate them only after representative workload telemetry exists. No advisor finding was modified.

## 4. Exact work remaining before Phase 5.9 DDL

### P0 — Migration integrity gate (blocking)

1. Recover the four original applied Stage 5.6 migration SQL files from the trusted authoring workstation, backup, or original commit/object archive; or complete the separately approved reconstructed-baseline preservation procedure.
2. Resolve the provenance of repository-only `20261121133000_org_foundation.sql`. Do not replay it; it creates objects that already exist.
3. Establish trusted source identity for Stage 5.5.2 and Stage 5.7.0–5.7.2. Timestamp similarity and semantic catalog corroboration are not byte-level proof.
4. Obtain an owner-controlled restorable backup and complete schema-only export with hashes.
5. Build and review a local migration directory that safely corresponds to the remote ledger, then run a non-mutating validation. Do not edit the remote ledger or replay migrations to make the lists look aligned.
6. Document the recovery decision and pass/fail evidence. No Phase 5.9 migration may be created/applied before this gate is demonstrably passed.

### P1 — Governance decisions required for a complete audit policy

These are explicitly open in the existing design and cannot safely be invented:

- **Retention:** define the retention period, archive/export approach, and any lawful deletion/immutability exception.
- **Actor self-visibility:** decide whether an actor who is not an administrator may view their own audit entries.
- **National/platform-wide events:** identify the exact national audit role(s) allowed to read records with null `target_org_id`; null must not mean globally readable.
- **Event allowlist:** approve the initial `action_key` and `entity_type` vocabulary, with explicit exclusions for existing membership and leadership histories.
- **Sensitive summary allowlist:** approve which minimal before/after fields may be stored for each event; never record secrets or unrestricted row snapshots.
- **Denied-operation coverage:** decide which denied privileged operations are safely logged and how to avoid leaking sensitive target data.

### P2 — Implementation and verification after P0/P1

1. Recheck table/function name collisions against the live schema immediately before implementation.
2. Implement the approved append-only table, constraints, indexes, RLS, grants, and narrowly scoped trusted write paths.
3. Keep privileged implementation functions in the private schema where appropriate; use fixed search paths, schema-qualified names, explicit actor/scope checks, and least-privilege EXECUTE grants. Avoid a public SECURITY DEFINER endpoint.
4. Ensure audit writes are atomic with the supported mutation and prevent recursive audit writes.
5. Verify no direct authenticated/anon insert, update, delete or truncate; verify server-derived actor/time and strict payload allowlists.
6. Test national/union/zone/campus/church inheritance and sibling isolation, including null-target visibility.
7. Prove no duplicate records are emitted for membership and leadership domain events.
8. Run security, performance and health advisors and remediate relevant findings.
9. Run controlled-account end-to-end tests. Until these run, do not claim Stage 5.9 verified or complete.
10. Commit the migration, documentation, verification evidence and updated V1 reconciliation register together.

## 5. Phase 5.9 completion criteria

Phase 5.9 can be marked complete only when all are true:

- Migration integrity gate passed and documented.
- Governance choices above are approved and recorded.
- Migration source is committed and safely applied once.
- Database schema, grants, RLS and trusted write paths are verified.
- Positive and negative hierarchy authorization tests pass.
- Append-only and tamper-resistance tests pass.
- Atomicity and no-duplicate-history tests pass.
- Security/performance/health advisor results are reviewed.
- Controlled-account test limitations, if any, are documented and accepted.
- GitHub implementation documentation and V1 reconciliation register are updated with evidence.

## 6. What can proceed in parallel

Figma preparation can proceed independently as a **design-only** activity once the user explicitly starts that work. It must not be represented as backend completion, and it must use the approved V1 architecture, existing product decisions, and official NAASCONNECT brand assets. No frontend code should be generated until the Figma wireframes/prototype have been reviewed and approved.

Stage 6 implementation should not be declared started until Phase 5.9's required backend completion criteria are satisfied, unless the owner explicitly reorders the roadmap and the dependency impact is documented.

## 7. Final status

| Work item | Status |
|---|---|
| V1 Phase 5.9 design specification | Complete |
| Architecture and no-duplication review | Complete |
| Fresh read-only database existence/ledger check | Complete |
| Existing audit table or audit object | Not present |
| Migration source-integrity gate | **Blocked / not passed** |
| Retention and governance policy decisions | Open |
| Phase 5.9 DDL/migration | Not implemented |
| Phase 5.9 authorization/security tests | Not run; implementation absent |
| Phase 5.9 end-to-end verification | Not run |
| Phase 5.9 overall | **Not complete** |
| Stage 6 implementation | Not started |

**Safety record:** This review made no Supabase schema/data/ledger changes, created no migration, replayed no migration, and created no paid Supabase branch.


---

# SOURCE DOCUMENT: docs/backend/PHASE_5_9_LEDGER_STATEMENT_RECOVERY_ADDENDUM.md

# NAASCONNECT Phase 5.9 — Remote Ledger SQL Statement Recovery Addendum

**Project:** NAASCONNECT Nigeria  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Captured:** 21 November 2026  
**Method:** Read-only SELECT from `supabase_migrations.schema_migrations`  
**Disposition:** Applied SQL statement payloads recovered for all eight previously unmatched ledger entries. No database writes.

## 1. Correction to earlier forensic finding

The earlier migration-source forensic report described the remote ledger as exposing only version/name metadata. A subsequent read-only inspection of `information_schema.columns` found that `supabase_migrations.schema_migrations` also has `statements` (text array), `created_by`, `idempotency_key`, and `rollback` columns.

A read-only count showed all 29 ledger rows have exactly one stored SQL statement payload. Therefore the earlier statement that the ledger did not retain SQL bodies was incomplete and is corrected by this addendum.

The `statements[1]` values are the SQL statement payloads recorded in the remote migration ledger for each applied entry. They preserve the submitted SQL content, but should not be described as byte-for-byte copies of original local migration files: original comments and local file formatting may not be retained.

## 2. Recovered unmatched ledger entries

Eight previously unmatched ledger payloads were retrieved and committed under `docs/backend/recovered-ledger-statements/`:

| Ledger version | Name | SQL characters | Evidence |
|---|---|---:|---|
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | 1,884 | [Recovered payload](recovered-ledger-statements/20261121140749_stage5_5_2_scoped_executive_term_updates.ledger-recovered.sql) |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | 5,408 | [Recovered payload](recovered-ledger-statements/20261121142038_stage5_6_membership_transfer_and_history_foundation.ledger-recovered.sql) |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | 177 | [Recovered payload](recovered-ledger-statements/20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc.ledger-recovered.sql) |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | 750 | [Recovered payload](recovered-ledger-statements/20261121142125_stage5_6_2_membership_fk_performance_indexes.ledger-recovered.sql) |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | 7,761 | [Recovered payload](recovered-ledger-statements/20261121145225_stage5_6_3_transactional_membership_transfer_review.ledger-recovered.sql) |
| `20261121152734` | `stage5_7_global_community_statuses` | 2,234 | [Recovered payload](recovered-ledger-statements/20261121152734_stage5_7_global_community_statuses.ledger-recovered.sql) |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | 1,307 | [Recovered payload](recovered-ledger-statements/20261121152827_stage5_7_1_status_policy_and_fk_index_hardening.ledger-recovered.sql) |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | 135 | [Recovered payload](recovered-ledger-statements/20261121152909_stage5_7_2_restrict_authenticated_status_table_grants.ledger-recovered.sql) |

## 3. Timestamp-shifted source comparison

The four timestamp-shifted repository candidates were compared with the corresponding ledger-recovered SQL payloads:

- Stage 5.5.2 candidate `20261121140642_stage5_5_2_scoped_executive_term_updates.sql`: exact file text differs because of comments/whitespace; SQL text matches after removing comments and whitespace.
- Stage 5.7.0 candidate `20261121162500_stage5_7_global_community_statuses.sql`: SQL text matches after removing comments and normalizing whitespace.
- Stage 5.7.1 candidate `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql`: SQL text matches after removing comments and normalizing whitespace.
- Stage 5.7.2 candidate `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql`: SQL text matches after removing comments and normalizing whitespace.

This materially resolves the applied SQL content for those four mismatches. The timestamp discrepancy remains a repository-history/provenance issue; do not rename files or edit the remote ledger.

## 4. Impact on the four Stage 5.6 reconstructed files

The owner-approved reconstructed files remain preserved as a record of the reconstruction exercise. However, the ledger-recovered Stage 5.6 SQL payloads now supersede them for historical applied-SQL evidence.

In particular, the recovered Stage 5.6.1 payload is only the policy removal and authenticated UPDATE revoke. It is not the broader policy reconstruction in the draft. The recovered Stage 5.6.3 payload is the original ledger-recorded review function, not the later Stage 5.6.5 hardened function body used in the draft. Do not treat the reconstructed drafts as a substitute for the recovered ledger payloads.

## 5. Updated migration reconciliation status

- Remote ledger: 29 rows; all 29 contain one SQL statement payload.
- Current active repository migration directory: 26 files.
- Exact same-version/name repository file matches: 21.
- Previously unmatched ledger entries: 8; all 8 applied SQL payloads now recovered from the remote ledger.
- Timestamp-shifted repository candidates: 4; all 4 SQL bodies match their ledger payload after comment/whitespace normalization.
- Repository-only `org_foundation`: still has no ledger row; its execution is not proven by this ledger.
- Four missing Stage 5.6 original local file wrappers/comments remain unrecovered, but their applied SQL payloads are recovered from the remote ledger.

A complete comparison of the 21 same-version repository files against their respective ledger statement payloads remains a final source-integrity check before declaring the ordered source set fully reconciled.

## 6. Remaining work and safety

Still required:
1. Compare all 21 same-version/name repository SQL files against the 21 corresponding ledger statement payloads.
2. Resolve/document `org_foundation` as an out-of-band baseline, including who/when/how it was executed or formally accepted.
3. Obtain and verify the complete schema-only export and SHA-256 manifest.
4. Obtain/verify the separate full restorable backup.
5. Complete a non-mutating migration-list/dry-run validation against the final ordered evidence set.
6. Complete Phase 5.9 P1 audit-governance decisions before implementation.

No Supabase schema/data/ledger changes, migration replay, paid branch creation, or Phase 5.9 DDL occurred during this recovery. All recovered SQL payload files are outside `supabase/migrations/` and are evidence only. The database-write approval gate remains closed. NAASCONNECT V1.0 remains the source of truth.


## 7. Follow-up comparison of all 29 applied SQL payloads

A subsequent read-only comparison fetched the stored SQL payload for every ledger row and compared it with the corresponding same-version/name repository file, where one exists. The comparison removed SQL line comments and normalized whitespace before comparing text.

Results:

- **12 of 21** same-version/name repository files match their ledger payload after that normalization.
- **9 of 21** same-version/name repository files differ after normalization. Their applied ledger payloads have now also been preserved in this directory.
- The four timestamp-shifted Stage 5.5.2/5.7 candidates match their ledger payloads after comment/whitespace normalization.
- The four missing Stage 5.6 applied SQL payloads are recovered from the ledger.
- Thus **17 ledger SQL payloads** are now preserved individually: the 8 formerly unmatched entries plus 9 same-version/name content divergences.
- The other 12 same-version/name repository files are textually corroborated against their ledger payload after normalization.

The nine same-version/name content-divergent versions are:

- `20261121130420` — `stage5_provisional_geography_admin_seats`
- `20261121132238` — `stage5_3_admin_appointment_approval_engine`
- `20261121132415` — `stage5_3_1_harden_admin_appointment_rpc_wrappers`
- `20261121134717` — `stage5_4_leadership_handover_executive_management`
- `20261121134728` — `stage5_4_1_handover_security_and_review_fixes`
- `20261121134737` — `stage5_4_2_president_role_revocation_fix`
- `20261121140551` — `stage5_5_executive_portfolios_directory_term_management`
- `20261121150236` — `stage5_6_6_scoped_membership_directory_and_statistics`
- `20261121150817` — `stage5_6_7_org_membership_review_queues_and_reporting`

This is a significant new finding: the 26-file active migration directory is not merely short four Stage 5.6 files; nine other same-version/name files also differ from the SQL payload recorded in the remote ledger. The ledger-recovered SQL payloads, not the divergent repository copies, are the strongest available evidence of what the remote migration records stored.

The 12 normalized matches and 4 timestamp-shifted normalized matches are not byte-identical file proofs. The 17 preserved ledger payloads are exact as returned from the ledger statement array, but not guaranteed to recreate original file comments or local file packaging.

## 8. Revised P0 reconciliation status

The 29 remote migration entries now have a complete evidence mapping:
- 12 have same-version/name repository SQL that matches the stored ledger payload after comment/whitespace normalization.
- 4 have timestamp-shifted repository SQL candidates that match the stored ledger payload after comment/whitespace normalization.
- 13 require the ledger-recovered payload as the canonical evidence artifact (4 missing Stage 5.6 sources plus 9 same-version/name divergences).

The 17 ledger payloads for the last category and timestamp-shifted entries are preserved under `docs/backend/recovered-ledger-statements/`. All evidence files remain outside `supabase/migrations/`.

A local ordered migration source set has not been installed into the active migration runner. That is deliberate: the active directory contains duplicate/unapplied timestamp candidates and divergent copies, and changing it without an approved reconciliation plan could cause a future CLI operation to attempt unintended migrations. The archive is evidence, not a migration-runner repair.

Remaining P0 blockers are now narrowed to:
1. Complete schema-only export and SHA-256 manifest.
2. Separate full restorable backup verification.
3. Formal disposition of repository-only `org_foundation` as an out-of-band baseline, including owner/execution provenance or explicit accepted baseline treatment.
4. A final owner-reviewed migration-source mapping and non-mutating dry-run/migration-list validation using a controlled local copy of the evidence set. No file renames, ledger edits, or database writes are authorized by this addendum.

P1 audit-governance decisions remain outstanding. The database-write approval gate remains closed.


## 9. Out-of-band organizational foundation execution recovered from PostgreSQL logs

A read-only query of Supabase PostgreSQL logs for 21 November 2026 captured the organizational foundation being executed through the management API:

- **12:28:48.007 UTC:** the `private` schema, `public.org_units`, `public.org_memberships`, hierarchy helpers, triggers, RLS, grants, policies, and national root seed SQL were submitted. The log annotation identifies the source as `POST /mcp`.
- **12:29:14.311 UTC:** follow-up statements created `org_units_created_by_idx` and `org_memberships_approved_by_idx`, also annotated as `POST /mcp`.

The SQL payloads are preserved under [`docs/backend/recovered-baseline-logs/`](recovered-baseline-logs/README.md). This is execution-log evidence for an out-of-band baseline, not a 30th migration and not a reason to add a row to the migration ledger.

The committed `supabase/migrations/20261121133000_org_foundation.sql` is related to, but not byte-identical with, the logged execution. Differences include explicit `NULL` syntax, `CREATE INDEX IF NOT EXISTS` and index placement, privilege statement packaging, and the national-root description. The log-recovered SQL is the stronger evidence of what was submitted. This resolves the question of whether a foundation was executed out-of-band; it does not make the repository-only file safe to replay.

## 10. Final current P0 checklist

| Requirement | Current status |
|---|---|
| Four missing Stage 5.6 applied SQL payloads | **Recovered from remote ledger statements** |
| Stage 5.5.2 / Stage 5.7 timestamp-shifted payloads | **Recovered; candidate SQL matches after comment/whitespace normalization** |
| Nine same-version repository files with divergent SQL | **Ledger payloads recovered and preserved** |
| Twelve same-version repository files matching ledger SQL | **Textually corroborated after comment/whitespace normalization** |
| Out-of-band `org_foundation` execution | **PostgreSQL log evidence recovered; actual submitted SQL preserved** |
| Complete schema-only export and SHA-256 manifest | **Outstanding** |
| Separate full restorable backup verification | **Outstanding** |
| Owner-reviewed final 29-entry mapping and non-mutating local dry-run/migration-list validation | **Outstanding** |

The 17 ledger-recovered SQL payloads are evidence artifacts only and remain outside the active migration directory. The four reconstructed Stage 5.6 drafts remain preserved but are superseded by the recovered ledger payloads for historical-source purposes. P1 audit-governance decisions remain outstanding. The database-write approval gate remains closed.


---

# SOURCE DOCUMENT: docs/backend/PHASE_5_9_READ_ONLY_MIGRATION_PRESERVATION_PACKAGE.md

# NAASCONNECT Phase 5.9 — Read-only Migration Preservation Package

**Inspection date:** 21 November 2026  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS` (default branch `main`)  
**Authority:** NAASCONNECT Nigeria V1.0 architecture and approved decisions  
**Disposition:** Preservation evidence recorded; schema-only export outstanding; migration integrity gate **NOT PASSED**.

## 1. Safety boundary and result

This package is a read-only preservation record. No Supabase schema, data, migration ledger, project configuration, branch, or paid resource was changed. No migration was replayed. No Phase 5.9 DDL was created or applied.

The remote ledger was read through both the Supabase migration-list interface and a read-only query of `supabase_migrations.schema_migrations`. Both returned the same **29 ordered records**. The current GitHub migration directory returned **26 SQL files**.

Reconciliation result:
- **21** ledger entries have an exact same-version and same-name repository SQL file.
- **8** ledger entries do not have a same-version source filename.
- **5** repository files do not exactly map to a ledger version/name pair.
- The four original Stage 5.6.0–5.6.3 SQL sources remain missing from the current tree and their exact-path GitHub commit-history searches returned no commits.
- Stage 5.5.2 and Stage 5.7.0–5.7.2 each have a same-name candidate with a different timestamp; those candidates are not proof of the exact applied SQL.
- `org_foundation` is a repository artifact without a matching remote ledger entry.

These are provenance discrepancies, not permission to repair the ledger or rewrite/replay history.

## 2. Preserved remote migration ledger

The following is the exact ordered ledger snapshot returned by the read-only inspection:

| Version | Applied migration name |
|---|---|
| `20261121130420` | `stage5_provisional_geography_admin_seats` |
| `20261121131034` | `stage5_2_profiles_org_applications_member_onboarding` |
| `20261121131101` | `stage5_2_1_onboarding_policy_and_fk_indexes` |
| `20261121131109` | `stage5_2_2_limit_self_membership_to_campus_church` |
| `20261121132238` | `stage5_3_admin_appointment_approval_engine` |
| `20261121132415` | `stage5_3_1_harden_admin_appointment_rpc_wrappers` |
| `20261121134717` | `stage5_4_leadership_handover_executive_management` |
| `20261121134728` | `stage5_4_1_handover_security_and_review_fixes` |
| `20261121134737` | `stage5_4_2_president_role_revocation_fix` |
| `20261121134747` | `stage5_4_3_leadership_fk_indexes` |
| `20261121134806` | `stage5_4_4_revoke_public_private_rpc_execution` |
| `20261121134918` | `stage5_4_5_approver_inbox_and_platform_announcements` |
| `20261121140551` | `stage5_5_executive_portfolios_directory_term_management` |
| `20261121140620` | `stage5_5_1_harden_directory_rpc_and_fk_indexes` |
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` |
| `20261121145523` | `stage5_6_4_membership_status_lifecycle` |
| `20261121145544` | `stage5_6_4_membership_status_actor_index` |
| `20261121145638` | `stage5_6_4_1_reject_null_status_action` |
| `20261121145919` | `stage5_6_5_transfer_cancellation_and_rejection_hardening` |
| `20261121145933` | `stage5_6_5_1_cancelled_by_fk_index` |
| `20261121150236` | `stage5_6_6_scoped_membership_directory_and_statistics` |
| `20261121150817` | `stage5_6_7_org_membership_review_queues_and_reporting` |
| `20261121152734` | `stage5_7_global_community_statuses` |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` |

## 3. Ledger-to-repository discrepancy matrix

| Remote ledger version | Remote ledger name | Current repository source |
|---|---|---|
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | `20261121140642_stage5_5_2_scoped_executive_term_updates.sql` (same name, different timestamp) |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | **No matching source file or same-name candidate** |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | **No matching source file or same-name candidate** |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | **No matching source file or same-name candidate** |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | **No matching source file or same-name candidate** |
| `20261121152734` | `stage5_7_global_community_statuses` | `20261121162500_stage5_7_global_community_statuses.sql` (same name, different timestamp) |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` (same name, different timestamp) |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` (same name, different timestamp) |

### Classification

- **Four unrecovered applied Stage 5.6 files:** `20261121142038`, `20261121142049`, `20261121142125`, and `20261121145225`. Their exact source paths were queried in GitHub commit history; no path-history commits were returned. No reconstructed SQL is being labelled as original.
- **Stage 5.5.2:** ledger `20261121140749_stage5_5_2_scoped_executive_term_updates`; repository candidate `20261121140642_stage5_5_2_scoped_executive_term_updates.sql`. Existing documentation records an addition commit `173defd84c3c13b3a6542560267af160f9225ffe` and semantic/catalog corroboration, but the remote ledger does not store the applied SQL body or checksum. Exact applied-source identity remains unproven.
- **Stage 5.7:** ledger versions `20261121152734`, `20261121152827`, `20261121152909`; repository candidates are timestamped `20261121162500`, `20261121162600`, `20261121162700`. Existing provenance notes identify commits `bb2daecb7c04a63cb5a5197eb6f2f794cf534971`, `cc6f8fcfce244578d86deef654d9a2ac02fd08b0`, and `5f5acf6744e2d5978f426a48fb13aebb27e325ed`. The table/policy/grant outcomes are semantically corroborated by the live catalog, but byte-for-byte applied SQL identity is not proven.
- **Repository-only `org_foundation`:** file `20261121133000_org_foundation.sql`, blob `0dac27cb773efdc3668a773ead135611ef23efc4`, introduced by commit `489ea6ddfbaf2d17cf35247bdb5eba1a55400b83` at `2026-11-21T12:30:00Z`. Its SQL defines `public.org_units`, `public.org_memberships`, private hierarchy helpers, triggers, RLS policies and the initial national row. The applied provisional-geography migration depends on the pre-existing organization foundation and adds the reserved admin-seat layer. This establishes the file's repository authorship and its architectural relationship, but **does not establish how or when it was executed**: no matching Supabase migration ledger row exists. Do not replay it or silently mark it as applied.

## 4. Complete current repository migration-file inventory

GitHub blob SHAs below are Git object identifiers for the current file contents; they are **not** SHA-256 hashes of a database export.

| File | Bytes | Git blob SHA |
|---|---:|---|
| `20261121130420_stage5_provisional_geography_admin_seats.sql` | 6,480 | `ec343d99d6804afa6c28a717cac69360ddefcad2` |
| `20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | 5,286 | `c39c38f18f44dde34a89fd53d26893a0c21e1ee1` |
| `20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql` | 1,025 | `7d8171e6862dc626c6d19f7497e561f39eb8cd21` |
| `20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql` | 823 | `3c3717fe47c18397187028443c60f909d9d742fe` |
| `20261121132238_stage5_3_admin_appointment_approval_engine.sql` | 5,647 | `db2633fa4db20a6a9961dae026d2d3c5555dbda7` |
| `20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql` | 3,816 | `fe3547c5541e1176fd351dc9c993f7c5ea32d796` |
| `20261121133000_org_foundation.sql` | 8,476 | `0dac27cb773efdc3668a773ead135611ef23efc4` |
| `20261121134717_stage5_4_leadership_handover_executive_management.sql` | 17,453 | `bdb9ff70bfd09363a67723725a0fb5dfd7f3a6d9` |
| `20261121134728_stage5_4_1_handover_security_and_review_fixes.sql` | 6,120 | `336981c6fbfb010bb489f79b646f0484eb2f3d8c` |
| `20261121134737_stage5_4_2_president_role_revocation_fix.sql` | 5,684 | `8652771c72fd6d1e4be7f7baf53753052f6231fc` |
| `20261121134747_stage5_4_3_leadership_fk_indexes.sql` | 1,356 | `bc679cbf6815223820f69d17fb38abb739896230` |
| `20261121134806_stage5_4_4_revoke_public_private_rpc_execution.sql` | 727 | `147a4aa960d36e49b3658845a05f77a3f6d3b071` |
| `20261121134918_stage5_4_5_approver_inbox_and_platform_announcements.sql` | 6,733 | `cd0441b851bc30499f37a263fc52dcb01d178999` |
| `20261121140551_stage5_5_executive_portfolios_directory_term_management.sql` | 8,117 | `c7bae3c86a32f3ceed0bcfde661770f67aa49427` |
| `20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes.sql` | 2,696 | `ce366f36d011c7db65b866a7a8d96fcafe2ac799` |
| `20261121140642_stage5_5_2_scoped_executive_term_updates.sql` | 1,928 | `86bae2fcb12f05511d8acc0c152ff2d4ac3286b1` |
| `20261121145523_stage5_6_4_membership_status_lifecycle.sql` | 4,118 | `39125bcd5ef737dcedaefa037290df081d39810f` |
| `20261121145544_stage5_6_4_membership_status_actor_index.sql` | 111 | `a3b25503284ca02ed1d3587cf26f1f67ec58cea1` |
| `20261121145638_stage5_6_4_1_reject_null_status_action.sql` | 3,291 | `76b42d09abfe4ad6f54903a3fb77b66ad9e1adc9` |
| `20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql` | 11,004 | `9a230fbe7b0f0ac4873f253fbfc5c5063b99ea68` |
| `20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql` | 118 | `a50d95f6a89171db9867a196ddb66ac03eba94fc` |
| `20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.sql` | 9,240 | `d0a4465ca3badd15caa8cfb23f159a0aa1a79193` |
| `20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql` | 9,657 | `ed40a75a8b372fd5ed142fe84539e18fb8cd8c00` |
| `20261121162500_stage5_7_global_community_statuses.sql` | 2,464 | `7595038bb22085b1b7d6046187dffef445e2d61e` |
| `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` | 1,376 | `6d05c68caf6e58c41fffab63c2a90a8b64409aae` |
| `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` | 292 | `3a86a729eda24c5d492fa1de0e99e40d39f36fa5` |

## 5. Current read-only database inventory

The current public table listing returned 14 tables:

- `public.org_units`
- `public.org_memberships`
- `public.org_admin_seats`
- `public.profiles`
- `public.org_applications`
- `public.admin_appointment_requests`
- `public.org_leadership_positions`
- `public.leadership_handover_requests`
- `public.leadership_history`
- `public.leadership_notification_events`
- `public.org_executive_portfolios`
- `public.membership_transfer_requests`
- `public.membership_events`
- `public.community_statuses`

The earlier read-only Phase 5.9 inspection confirmed `public.admin_audit_logs` is absent. The existing domain histories remain authoritative and must not be duplicated:
- `public.membership_events`
- `public.leadership_history`
- `public.leadership_notification_events`
- `public.membership_transfer_requests` (workflow state, not a second generic event stream)

The catalog inventory and object-to-source reconciliation matrix are useful structural evidence, but neither is a restorable schema-only SQL export.

## 6. Schema-only export — status and exact remaining action

**Status: NOT OBTAINED in this execution.**

The connected Supabase interface available here exposes read-only migration, table/catalog, SQL-query and advisor operations, but no database dump/download operation. The active runtime has no `supabase` CLI, `pg_dump`, or `psql` binary and no owner-controlled direct database URI. Therefore a complete schema-only export cannot honestly be claimed or fabricated from table metadata.

To obtain the required export on the owner's trusted machine (without sharing the database URI in chat):

1. Obtain the **direct** database connection URI from Supabase Project Settings → Database → Connection string. Keep it private.
2. With PostgreSQL client tools installed, run:

```bash
mkdir -p evidence/phase-5-9
read -rsp "Paste the direct NAASCONNECT database URI: " NAASCONNECT_DB_URL
printf '\n'
export NAASCONNECT_DB_URL

pg_dump \
  --dbname="$NAASCONNECT_DB_URL" \
  --schema-only \
  --format=custom \
  --file=evidence/phase-5-9/naasconnect-schema-only.dump

pg_restore --list evidence/phase-5-9/naasconnect-schema-only.dump \
  > evidence/phase-5-9/naasconnect-schema-only.manifest.txt

sha256sum evidence/phase-5-9/naasconnect-schema-only.dump \
  evidence/phase-5-9/naasconnect-schema-only.manifest.txt \
  > evidence/phase-5-9/SHA256SUMS

unset NAASCONNECT_DB_URL
```

3. Confirm the dump command exits successfully, the archive can be listed by `pg_restore --list`, and the SHA-256 manifest is non-empty. Record the PostgreSQL client version, capture time (UTC), project ref, dump byte size, and SHA-256.
4. Store the dump and manifest in owner-controlled encrypted backup storage, **not** in a public GitHub repository. Review the archive for sensitive function literals or embedded configuration before sharing any portion.
5. Separately obtain/verify a restorable full backup. A schema-only export contains no table data and is not a full database backup.

If the direct connection is unavailable because of network/IPv6 restrictions, stop and choose an owner-approved Supabase connection method; do not substitute a schema pull that writes migration history. Supabase CLI v3 changed database commands to target the local stack by default; any CLI fallback must explicitly target the remote database and must be used only for a read-only dump. Do not use `db pull`, `db push`, `migration repair`, or `apply_migration` for this preservation step.

## 7. V1.0 alignment and no-duplication safeguards

V1.0 remains the source of truth. This preservation package does not revise hierarchy, roles, organization onboarding, leadership handover, membership lifecycle, or community-status decisions.

Phase 5.9 must remain a separate general administrative/security audit trail. It must not mirror membership transfer/status events, leadership succession history, or leadership notification events. Null-target platform events require explicitly approved national-level visibility; null must never imply global read access. The existing Phase 5.9 design specification remains design-only until the integrity gate and governance decisions are satisfied.

## 8. Remaining integrity gate (all items required)

### P0 — preservation and provenance
- [ ] Obtain the owner-controlled full restorable backup.
- [ ] Obtain and verify the complete schema-only export and SHA-256 manifest described above.
- [ ] Recover the original four Stage 5.6 SQL files from the trusted authoring machine/backup/object archive, **or** execute the separately approved reconstructed-baseline procedure with reconstructed files clearly labelled as reconstructed and never represented as original.
- [ ] Resolve exact-source provenance for Stage 5.5.2 and Stage 5.7.0–5.7.2; semantic similarity alone is insufficient for a byte-level claim.
- [ ] Document the `org_foundation` execution history (who/when/how it was applied) or formally document the approved baseline treatment. Do not replay it.
- [ ] Assemble a complete ordered local migration source set and reconcile it against the preserved 29-row remote ledger without changing the remote ledger.
- [ ] Run and retain non-mutating validation evidence showing no already-applied migration would be replayed and no applied source remains unaccounted for.

### P1 — audit governance choices
- [ ] Approve audit retention, archive/export, and lawful deletion/immutability exceptions.
- [ ] Decide whether non-admin actors may view their own audit entries.
- [ ] Define which national audit role(s) may read null-target platform events.
- [ ] Approve the initial `action_key` and `entity_type` allowlists and explicit exclusions for existing domain histories.
- [ ] Approve the minimal safe metadata allowlist.
- [ ] Decide which denied privileged operations are logged and how sensitive target information is protected.

### P2 — Phase 5.9 implementation after P0/P1
Only after P0 and P1 pass: recheck object-name collisions; create and review the migration; implement least-privilege grants, RLS and a trusted append-only write path; prove atomicity, no recursion and no duplicate domain-history events; test hierarchy inheritance and sibling isolation with controlled accounts; run advisors; document verification; update the V1 reconciliation register.

**Separate explicit owner approval is still required before any Supabase database write.** Passing this preservation gate does not itself authorize DDL.

## 9. Final disposition

| Item | Status |
|---|---|
| Remote migration ledger snapshot | **Preserved in this GitHub evidence document (29 records)** |
| Current migration-file inventory | **Preserved (26 files with Git blob SHAs)** |
| Four original Stage 5.6 SQL files | **Not recovered** |
| Stage 5.5.2 and Stage 5.7 exact applied SQL identity | **Not proven** |
| `org_foundation` repository authorship | **Resolved; execution provenance unresolved** |
| Complete schema-only export | **Not obtained** |
| Full restorable backup | **Not verified** |
| Migration integrity gate | **NOT PASSED** |
| Phase 5.9 DDL/migration | **Not implemented** |
| Stage 6 implementation | **Not started** |

**Safety attestation:** No Supabase schema/data/ledger change, migration replay, paid branch, or Phase 5.9 DDL was performed during this preservation pass.


---

## 10. Subsequent evidence recovery update — 21 November 2026

This section supersedes earlier statements in this preservation snapshot where later evidence is now available. The original snapshot remains preserved as a record of what was known at capture time.

### 10.1 Remote migration ledger statement payloads

A later read-only inspection found that `supabase_migrations.schema_migrations` contains a `statements` text-array column. All 29 ledger rows contain exactly one SQL statement payload. This corrects the earlier assumption that the ledger exposed only version/name metadata.

Seventeen ledger SQL payloads were recovered and committed under `docs/backend/recovered-ledger-statements/`:
- Eight previously unmatched ledger entries (four missing Stage 5.6 payloads and four timestamp-shifted Stage 5.5.2/5.7 entries).
- Nine same-version/name entries whose active repository SQL differs from the stored ledger payload after comment/whitespace normalization.

Of the 21 same-version/name repository files, 12 match their ledger payload after comment/whitespace normalization and 9 differ. The four timestamp-shifted Stage 5.5.2/5.7 candidates match their ledger payload after comment/whitespace normalization. The four missing Stage 5.6 applied SQL payloads are recovered directly from the ledger.

These ledger payloads are the strongest available evidence of the SQL submitted for the applied migration records. They are not necessarily byte-for-byte copies of original local files, including comments and packaging.

See [Phase 5.9 ledger statement recovery addendum](PHASE_5_9_LEDGER_STATEMENT_RECOVERY_ADDENDUM.md).

### 10.2 Out-of-band organizational foundation execution

PostgreSQL logs for 21 November 2026 record the organizational foundation SQL being submitted through `POST /mcp` at **12:28:48.007 UTC**, followed by the two `created_by` / `approved_by` indexes at **12:29:14.311 UTC**. The corresponding SQL statements are preserved under `docs/backend/recovered-baseline-logs/`.

This establishes that the organizational foundation was executed outside the 29-row migration ledger. The committed repository-only `20261121133000_org_foundation.sql` is related but is not an exact copy of the logged SQL: it differs in explicit NULL syntax, index idempotency/placement, privilege statement packaging, and the national-root description text. The logged statements are the stronger execution evidence. See [out-of-band foundation provenance](recovered-baseline-logs/README.md).

### 10.3 Revised P0 disposition

The four Stage 5.6 applied SQL payloads have now been recovered from the remote ledger, so the owner-approved reconstructed drafts are superseded for historical applied-SQL evidence. The drafts remain preserved as a reconstruction exercise and must not be treated as original source or replayed.

The out-of-band organizational foundation execution is also evidenced by PostgreSQL logs. The remaining P0 blockers are now:
- Complete schema-only export plus verified archive listing and SHA-256 manifest.
- Separate full restorable backup verification.
- Final owner-reviewed mapping of all 29 ledger payloads to the active repository/evidence archive, including explicit treatment of the nine divergent same-version files and the timestamp-shifted candidates.
- Non-mutating local validation/migration-list dry run using a controlled source copy, proving no applied migration would be replayed and no ledger entry is unaccounted for.

No recovered SQL file has been placed in `supabase/migrations/`. Do not repair the active directory, rename files, edit the remote ledger, or run `db push` without a separate approved plan. P1 audit-governance decisions remain outstanding. The database-write approval gate remains closed.
