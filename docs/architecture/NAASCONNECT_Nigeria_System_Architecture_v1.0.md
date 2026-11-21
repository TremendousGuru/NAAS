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
