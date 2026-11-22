# NAASCONNECT Nigeria — V1.0 Frontend Completeness Audit

**Audit date:** 2026-11-23  
**Repository:** `TremendousGuru/NAAS`  
**Audited branch:** `feature/naasconnect-frontend-foundation`  
**Audited HEAD:** `85519eebf23e16c06f3a063bfb89cd96f0d248da`  
**Architecture authority:** NAASCONNECT Nigeria System Architecture v1.0 and Approved Decision Register v1.0  
**Disposition:** Read-only source audit. No Supabase changes, migrations, Vercel deployment, production promotion, or application-code edits were made for this audit.

## 1. Executive summary

The repository contains a real Next.js/Supabase application foundation, but it is not a complete V1.0 frontend. The strongest implemented areas are the branded entry/authentication screens, Supabase SSR clients, initial member workspace, membership request entry point, basic global text-status display/publishing, and route-level administrator assignment checks.

The most important gaps are not cosmetic:

1. Registration writes student/non-student classification and several onboarding values to editable Supabase Auth user metadata. The current profile table does not have typed columns for all of these values, and the callback does not persist the complete onboarding record into a durable reviewable application.
2. The administrator workspace explicitly labels itself a sample interface and renders hard-coded sample requests, counts, organizations, and audit entries. It is not connected to live queues or operational review actions.
3. The automated visual QA suite currently checks the intro and login pages only. It does not test registration branches, authenticated member pages, profile editing, membership requests, administrator routes, or actual email/session journeys.
4. The existing member app has live queries and actions, but several screens are partial implementations. Status publishing is text-only and gated on active membership, while V1.0 Decision 013 says individual members and authorized organizational publishers can publish and all authenticated members can view active global statuses.
5. The organization picker reads active campus/church rows, but registration institution selection is a free-text field and does not resolve to a verified organization record.

These are implementation gaps to address against existing schema/RLS/RPCs. This audit does not propose or apply database changes.

## 2. Source-of-truth rules checked

The audit used the following repository documents as normative references:

- `docs/decisions/NAASCONNECT_Nigeria_Approved_Decisions_v1.0.md`
- `docs/architecture/NAASCONNECT_Nigeria_System_Architecture_v1.0.md`
- `docs/database/NAASCONNECT_Nigeria_Database_Blueprint_v1.0.md`
- `docs/frontend/AUTHENTICATION_FOUNDATION_IMPLEMENTATION.md`
- `docs/frontend/AUTHENTICATION_AND_MEMBER_ONBOARDING_MILESTONE.md`
- `docs/frontend/FRONTEND_DELIVERY_AND_VISUAL_QA_STANDARD.md`
- Stage 5.2 migration `20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql`

V1.0 decisions especially relevant to the UI:

- One person has one account and may hold multiple organization memberships and scoped roles (DEC-004).
- Supported organization types are national, union, zone, campus/ASF and local church (DEC-005).
- Organization approval is required before administrative authority is granted (DEC-006).
- Ordinary membership is distinct from administrator assignment; email verification must never confer elevated authority.
- Global Status is globally visible to authenticated members regardless of organization (DEC-013).
- Status expiry defaults to 24 hours; persistent posts/announcements are separate (DEC-014).
- Routine administration must ultimately be possible through the UI without developer/backend access (DEC-015).
- Server-side authorization and RLS are authoritative; hiding a control in the UI is not security.

## 3. Current repository and application inventory

### Runtime and framework

- Next.js App Router, React 19, TypeScript.
- Supabase Auth and PostgreSQL via `@supabase/ssr` and `@supabase/supabase-js`.
- Vercel is the deployment platform; GitHub repository is canonical source.
- The current `package.json` scripts include `dev`, `build`, and `start`; there are no declared `lint`, `typecheck`, or `test` scripts.
- Playwright is installed dynamically in the GitHub Actions visual-QA workflow rather than declared in the app package manifest.

### Routes and major components found

| Route/file | Current behaviour | Audit classification |
|---|---|---|
| `/` / `app/SplashGate.tsx` | Branded intro; checks Supabase session and routes to `/app` or `/login` | Implemented foundation |
| `/login` | Login, signup, reset-request modes; registration fields; resend confirmation | Partial, requires end-to-end verification |
| `/auth/callback` | Exchanges auth code, upserts basic profile, redirects | Partial; incomplete onboarding persistence |
| `/reset-password` | Updates password through Supabase client | UI/action present; recovery journey unverified |
| `/app` | Authenticated member workspace; reads profile, memberships, statuses, active campus/church directory | Partial live integration |
| `/app/actions.ts` | Text status publishing, membership request, profile upsert | Partial; needs policy/RPC and journey tests |
| `/admin` | Checks signed-in user and active scoped administrator memberships before rendering | Route gate foundation |
| `/admin/AdminWorkspace.tsx` | Hard-coded preview/sample metrics, requests, organizations, audit entries; no live review actions | Prototype only, not operational |

Other relevant files include `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `app/globals.css`, and `tests/visual/launch-and-auth.spec.ts`.

## 4. Detailed feature assessment

| Feature | Current evidence | Status | Remaining work |
|---|---|---|---|
| Brand identity | Official NAAS/NAASCONNECT assets referenced in layout and auth pages | Foundation implemented | Validate all tracked assets and all page breakpoints |
| Intro experience | `SplashGate` awaits `getSession()` then routes | Implemented foundation | Test slow/error session resolution, reduced motion, authenticated and unauthenticated journeys |
| Supabase SSR | Browser/server clients and middleware exist | Implemented foundation | Verify refresh, cookie/session expiry and server/client consistency |
| Email/password login | Server action calls `signInWithPassword` | Implemented foundation | Controlled-account E2E, invalid credentials, unverified email, expired session |
| Registration | Name, phone, email, password and category form | Partial | Durable onboarding persistence, institution directory selection, validation, duplicate-account and retry handling |
| Student path | State, institution free text, course and level | Partial | Institution/ASF resolution to verified directory, missing institution handling, clear region semantics |
| Non-student path | Residence state and preferred NAAS region | Partial | Define/implement approved church/region selection and durable profile/application record |
| Email verification | Confirmation email redirect and callback exchange | Partial | Verify actual SMTP, allow-list, redirects, resend, expired/reused links and profile creation |
| Password recovery | Request reset and update password screens/actions | Partial | Full real-email test, expired link, invalid session, success/error states |
| Durable member onboarding | Metadata written at signup; callback upserts basic `profiles` fields | Incomplete | Map to existing schema/RLS/RPC; identify approved durable application destination before proposing any schema extension |
| Member profile | Reads and updates own profile fields | Partial | Add fields only where schema supports; handle server validation and save errors visibly |
| Membership intake | Lists active campus/church orgs; inserts pending `org_memberships` request | Partial | Confirm eligibility, duplicate handling, application status/history, empty directory and review routing |
| Multiple memberships | Reads and renders membership rows | Partial | Full lifecycle, transfer/history views, role/scope distinctions |
| Global Status read | Reads active, unexpired status rows | Partial | Verify RLS global visibility and error/empty/loading states |
| Global Status write | Text-only form; action currently requires an active membership | V1.0 discrepancy | Reconcile gate with DEC-013, which allows individual members and authorized org publishers; do not alter policy without approved interpretation |
| Media status | No upload UI found in audited route | Not implemented | Storage policies, upload validation, media playback and expiry |
| Comments/reactions/views | No implementation found in audited routes | Not implemented | Scope against V1.0 and existing backend; avoid assuming every interaction is V1.0 mandatory |
| Administrator access | Active membership role allowlist checked on server route | Foundation implemented | Verify role scope and negative authorization cases; database remains authoritative |
| Administrator dashboard | Explicit sample-data disclaimer and hard-coded arrays/counts | Prototype only | Replace mock data with scoped live queries |
| Membership review actions | No approve/reject/request-correction action in workspace | Not implemented | Wire existing approved review RPCs/actions; enforce scope and auditability |
| Organization management | Conceptual counts/relationship diagram only | Prototype only | Live scoped directory, applications, verification and permitted actions |
| Leadership | Static approval-chain guidance only | Prototype only | Integrate existing Stage 5.3–5.5 workflows and read models |
| Audit history | Static sample entries only | Prototype only | Phase 5.9 remains gated; do not imply audit-log backend exists |
| Resources | Links to supplied KJV and lesson-study PDFs | Basic links implemented | Confirm file paths, rights/access policy, navigation and mobile usability |
| Notifications | No member notification centre observed in audited routes | Not implemented in current UI | Integrate existing notification events and approved delivery workflow |
| Responsive QA | Current Playwright projects desktop Chromium and mobile Chromium | Harness foundation implemented | Extend coverage to every completed milestone and review screenshots |

## 5. Important data and security findings

### 5.1 Registration metadata is not a durable application record

`app/auth/actions.ts` writes `member_category`, `state_of_admission`, `institution_name`, course, level, and residential state into Auth user metadata. The metadata is useful for initial registration context but is user-editable and must not be treated as authorization evidence.

The Stage 5.2 migration defines `profiles` with: `id`, `display_name`, `phone`, `avatar_url`, `institution_name`, `course_of_study`, `level_of_study`, `state_of_origin`, `profile_completed`, timestamps. It does not define dedicated typed columns for member category, study state, residential state, onboarding review status, or a student/non-student application record.

The auth callback upserts only basic profile fields and marks `profile_completed: true`. It does not persist all submitted onboarding fields or create a durable application. Therefore the current UI must not describe the complete member onboarding/review workflow as finished.

### 5.2 Existing membership intake is separate from account creation

The Stage 5.2 migration permits an authenticated user to create a pending self-membership in an active organization, with role constrained to member/church_member. The current frontend selects active campus/church organizations based on Auth metadata category and inserts a pending membership. This is consistent with separation of account and membership, but the current directory may be empty and the UI does not yet provide a full application history or administrator review experience.

### 5.3 Administrator workspace is demonstrative, not live

The server route does query the signed-in user's active membership assignments and checks an allowlist of administrator role codes before rendering. This is a useful route-level gate, but `AdminWorkspace.tsx` itself explicitly states “Sample interface · No live records or permissions are being exercised.” Its metrics, request rows, organization counts and audit events are hard-coded examples. Buttons and review controls are not connected to live services.

Do not present the administrator workspace as an operational administration product until live scoped data and approved server-side actions are integrated.

### 5.4 Status publishing requires a V1.0 reconciliation

Decision DEC-013 says individual members and authorized organizational publishers can publish, while all authenticated members can view active global statuses. Current `publishTextStatus` requires an active organization membership before any individual text status can be inserted. This appears narrower than the approved decision. Before changing it, inspect the live RLS/grants and relevant Stage 5.7 migration payloads. No policy or database change is authorized by this audit.

### 5.5 Avoid metadata-based authorization

The UI currently uses Auth metadata to choose a membership-request category and display the student/non-student label. These are presentation/eligibility hints only. All final authorization and role grants must be based on trusted database records and existing RLS/RPC checks, never on editable metadata.

## 6. Visual QA and pre-deployment quality gate

### Current automated coverage

`tests/visual/launch-and-auth.spec.ts` contains two tests, each run on desktop Chromium and mobile Chromium:

1. Intro appears, logo loads, unauthenticated routing reaches login, no page errors.
2. Login heading and both logos appear, no horizontal overflow, no page errors.

This is a useful smoke test, not a full V1.0 regression suite. It does not cover signup validation, student/non-student field switching, password recovery, authenticated member pages, membership request, profile update, status composer, administrator access, or review workflows.

### Required quality gate before Vercel preview deployment

For each coherent implementation batch, run before creating a Vercel deployment:

1. Dependency install using the committed lockfile and a clean CI environment.
2. TypeScript check.
3. ESLint/static analysis if configured.
4. Next.js production build.
5. Unit/component tests for pure logic and form validation where applicable.
6. Playwright against the locally built production server (desktop and mobile).
7. Asset existence/decode checks, no browser exceptions, no horizontal overflow, and route-specific assertions.
8. Security-oriented negative tests for protected routes and unauthorized actions using controlled fixtures.
9. Save Playwright screenshots, traces on failure, and build/test logs as CI artifacts.

Only when all required pre-deployment checks pass should a Vercel preview be created. Then verify that the deployment commit matches the tested commit, run the existing post-deployment workflow against that exact URL, and inspect screenshots/artifacts. A green Vercel build alone is not visual approval.

**Current gap:** the existing workflow is post-deployment and checks out a deployment commit. It does not yet implement the full pre-deployment local-build gate described above. Vercel Git integration/automatic preview creation must be reviewed before choosing a gating mechanism; do not disable or alter deployment integration without a separate reviewed change.

## 7. Recommended implementation sequence

### Batch 0 — delivery safety foundation

- Add explicit `typecheck`, `lint` (if ESLint is adopted), and deterministic test scripts.
- Add CI for install, typecheck, build and local Playwright against `next start`.
- Make deployment gating compatible with current Vercel Git integration.
- Expand QA artifacts and document pass/fail criteria.
- No Supabase writes or schema changes.

### Batch 1 — authentication and durable onboarding (highest product priority)

- Verify session refresh, login, sign-out, email confirmation, resend and password recovery.
- Define exact field semantics for student/non-student onboarding using V1.0.
- Map all onboarding data to existing trusted schema/RLS/RPCs.
- Where the existing schema is insufficient, prepare a proposed SQL migration and present it for separate approval; do not apply it.
- Institution/campus selection must use verified organization records where available; allow missing geography to be resolved later by authorized administrators as V1.0 specifies.
- Add clear application states and controlled-account end-to-end tests.

### Batch 2 — member workspace

- Profile editing with server-side validation and explicit save feedback.
- Membership list, pending state, history and transfer flows using existing Stage 5.6 backend.
- Organization selection and empty-directory messaging.
- Status publishing/read experiences reconciled with DEC-013 and existing Stage 5.7 policies.
- No duplicated membership or history tables.

### Batch 3 — operational administrator workspace

- Replace all sample arrays/counts with live scoped queries.
- Build membership review queue and detail view using existing Stage 5.6.7 queue/reporting and approved RPCs.
- Connect approve/reject/request-correction only after inspecting exact signatures, permission checks and RLS.
- Build organization and leadership interfaces using existing Stage 5.3–5.5 workflows.
- Keep audit-history screen clearly unavailable/read-only until Phase 5.9 gate is passed and separately approved.

### Batch 4 — community and remaining V1.0 UI

- Media statuses, views/reactions and moderation only after confirming existing schema and approved scope.
- Notifications, events, organization directory, church connection, communication and spiritual resource navigation.
- No speculative schema additions or scope expansion.

### Batch 5 — release hardening

- Full desktop/mobile visual review and accessibility.
- Controlled end-to-end test accounts for member and each administrator scope.
- Negative tests: cross-organization isolation, peer-admin denial, self-approval denial, unverified user and suspended/inactive membership.
- Verify preview commit, screenshots and deployment status; production promotion requires separate release approval.

## 8. Immediate blockers and dependencies

| Priority | Blocker | Why it matters | Next action |
|---|---|---|---|
| P0 | No pre-deployment local-build/browser gate | Unnecessary Vercel deployments consume limited credits | Implement CI gate before the next feature batch |
| P0 | Onboarding not durably persisted as a complete reviewable record | Account creation is not the same as member onboarding approval | Map fields to current schema; propose SQL only if necessary |
| P0 | Admin workspace is sample-only | Administrators cannot perform real operational reviews | Inspect existing review queue/RPC signatures and replace mocks |
| P1 | Institution field is free text | Cannot reliably route student to a verified campus/ASF | Use active org directory and handle unlisted institution |
| P1 | Membership workflow lacks visible history/review status UX | Members cannot track application lifecycle | Integrate existing membership lifecycle/read models |
| P1 | Global Status publishing gate may conflict with DEC-013 | Approved member publishing capability may be restricted | Reconcile SQL/RLS and approved decision before change |
| P1 | E2E coverage is only intro/login | Most important workflows can regress undetected | Add tests with controlled accounts and fixtures |
| P2 | Resource links are PDFs only | V1.0 expects navigable resource experiences | Plan structured resource UI subject to licensing |

## 9. Change-control and safety record

This audit is documentation-only. It does not:
- change Supabase schema, data, RLS, RPCs, grants, or migration ledger;
- apply or replay migrations;
- implement Phase 5.9;
- create paid branches or new Vercel projects;
- deploy to Vercel or promote production;
- change the V1.0 architecture or approved decisions.

Any database extension discovered to be necessary will be documented as proposed SQL and held for separate explicit approval. V1.0 remains the source of truth.

## 10. Audit conclusion

NAASCONNECT has a credible frontend foundation, but the current application should be described as a **partially integrated foundation with demonstrative administrator UI**, not a complete operational V1.0 platform.

The next work should start with Batch 0 (pre-deployment quality gate) and Batch 1 (authentication and durable onboarding). This sequence directly addresses deployment-credit conservation and the most important member lifecycle dependency without rebuilding existing backend workflows or making unapproved database changes.
