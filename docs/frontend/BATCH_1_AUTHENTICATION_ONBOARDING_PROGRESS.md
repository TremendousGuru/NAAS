# NAASCONNECT Batch 1 — Authentication & member onboarding progress

**Branch:** `feature/naasconnect-frontend-foundation`
**Supabase project:** `csytneubatlaakpmnsfk` (NAAS, ACTIVE_HEALTHY)
**Architecture authority:** V1.0 and existing live RLS/RPC contracts
**Database writes during this implementation:** None
**Status:** Frontend integration started; durable intake and approval gate remain open

## Implemented in this code pass

1. Replaced the administrator membership-review sample data with live, read-only calls to the existing `public.get_membership_review_queue` RPC for each active administrator assignment loaded from the signed-in user's own `org_memberships` rows.
2. Each queue call passes one explicit organization ID. The existing database function independently checks `private.can_administer_org(p_org_id)`; the UI does not attempt to widen scope.
3. The admin interface displays only returned live queue records and explicit empty/error states. It no longer invents sample membership applicants, metrics or audit events.
4. The member profile editor now exposes the student's state of admission/study or the non-student's state of residence.
5. Profile save updates existing `profiles` columns under the current own-row RLS policy and stores the additional descriptive registration fields in the signed-in user's own Auth metadata. Metadata is not used for authorization and cannot grant roles or memberships.
6. Existing sign-up, PKCE email confirmation, resend-confirmation and password-recovery routes were retained.

## Read-only live schema inspection

The connected Supabase project was verified as `NAAS`, project ref `csytneubatlaakpmnsfk`, status `ACTIVE_HEALTHY`.

Existing relevant objects:

- `public.profiles`: own-profile RLS; columns include display name, phone, institution, course, study level, state of origin and profile completion. It has no durable member-category or state-of-admission/residence columns.
- `public.org_units`: 24 records, RLS enabled. One national root is active; the three union records and twenty zone records are pending. No active campus or church records exist.
- `public.org_memberships`: zero rows, RLS enabled. Existing self-request policy permits only pending basic member requests for active campus/church organizations. It prevents self-assignment of admin roles.
- `public.membership_events`: existing audit/event object.
- `public.org_applications`: existing organization-application workflow; it is not a member onboarding intake table.
- Existing read RPC `public.get_membership_review_queue(p_org_id,p_search,p_from,p_to,p_limit,p_offset)` returns pending membership rows and independently checks administrator scope.
- Existing `public.manage_membership_status` handles suspend/reactivate/terminate, not initial approval/rejection. No dedicated initial membership approval/rejection RPC was found in the inspected function inventory.

RLS policies inspected for profiles, org_units, org_memberships, org_applications and membership transfers. All inspected public application tables have RLS enabled. No database schema, policy, function, data row, migration ledger or Supabase branch was changed.

## Explicit blockers / not claimed complete

1. **Durable onboarding intake:** student/non-student classification and region/institution fields currently live in Auth user metadata plus existing profile columns. They are not yet represented in a dedicated durable, queryable onboarding record. Auth metadata is user-editable and is never an authorization source.
2. **Campus/church selection:** there are no active campus or church org_units. The member page correctly avoids offering unverified/inactive organizations. The pending 23 union/zone records are not treated as active.
3. **Initial membership decision:** the existing review queue is read-only. There is no verified initial approval/rejection RPC in the inspected database. The admin UI deliberately has no approve/reject buttons and performs no membership writes.
4. **Administrator test account:** live org_memberships currently contains zero rows, so no active administrator assignment exists to exercise the live scoped admin route with a real account.
5. **Email delivery configuration:** application routes support confirmation and resend; actual SMTP delivery, Site URL and redirect allowlist must still be verified in the Supabase Auth dashboard with a controlled account.

## Proposed next database design — approval required

Before adding durable intake, prepare and review a migration proposal for one narrowly scoped `public.member_onboarding_intakes` table. It should store one current intake per Auth user (unique `user_id`), member category, student study state or non-student residence state, institution/course/level, optional preferred organization FK, and timestamps. Keep membership application/review as the existing `org_memberships` workflow; do not duplicate approval status or membership rows in the intake table. Owner-only RLS should govern member reads/updates/inserts. Administrator access should be added only if a reviewed V1.0 routing rule and safe scoped review design are specified.

A separate initial-membership approval/rejection RPC is also needed if the existing RLS update policy and table constraints do not provide a complete, auditable, transactional approval contract. The proposal must preserve approver identity, timestamps, reason, event history, role validation, and no-self-approval. Do not implement an improvised direct table update.

**No SQL has been applied.** Present the full proposed SQL and security policy for separate approval before any database write.

## Verification

- GitHub Actions / Vercel pre-deployment quality gate will run against the updated feature branch after these commits.
- Confirm TypeScript and production build.
- Confirm browser tests still pass.
- Review the preview for admin empty/error states and profile editor responsiveness.
- Controlled real-account testing is still required for registration, confirmation, sign-in, profile save and membership request.
- No production promotion is authorized by this progress record.


## Follow-up verification and database proposal — 2026-11-23

### CI failure identified and corrected

The first Batch 1 workflow run (`45088666233`) failed at TypeScript validation because two source edits contained literal backslash-n characters rather than actual line breaks. This was a source-generation formatting defect, not a schema or business-logic failure.

Corrective commits:
- `28062b48685b6525b7c919d63ecd4582d5413a15` — corrected `app/app/actions.ts`.
- `1052983246af7611c14226d5e0b88d0be9dc655a` — corrected `app/app/page.tsx`.

A new workflow is expected from the latest branch head. Do not treat Batch 1 as deployment-verified until that run passes TypeScript, build and browser QA.

### Durable intake and initial review SQL proposal

Created `docs/backend/proposals/BATCH_1_MEMBER_INTAKE_AND_REVIEW_PROPOSAL.sql` (proposal only; outside `supabase/migrations/`).

The proposal:
- Adds one row per user for student/non-student classification, admission/residence state and optional preferred organization.
- Reuses existing `profiles` fields for institution/course/level to avoid duplicating canonical data.
- Extends `org_memberships.status` with an explicit `rejected` value rather than misusing `ended`.
- Adds a private, transaction-safe initial approval/rejection routine with active organization-scope authorization, no-self-review, pending-only transition, reason validation and membership event insertion.
- Exposes only a narrow authenticated wrapper.

This proposal has NOT been applied or replayed. It requires separate explicit approval before any Supabase write. It also requires local/disposable database tests and Supabase advisor review before application.

### Additional security note

The current interim UI still reads the member category from Auth user metadata for presentation and form routing. Supabase documentation and security review confirm user metadata is user-editable and must never be used for authorization. The database's current membership INSERT policy enforces pending-only self-requests, allowed role, and active campus/church organization; it does not enforce student-versus-non-student category. The durable-intake proposal must therefore be extended with a database-enforced category-to-organization eligibility check before that distinction is treated as authoritative. Do not rely on client/UI filtering for this rule.

### Remaining blockers

- Approval to apply the proposed SQL (separate authorization).
- Extend proposal with DB-enforced category/org eligibility and test it.
- Populate and activate verified campus/church directory records through the approved organization governance workflow.
- Create controlled test accounts and a real active scoped administrator assignment through the approved process.
- Verify email delivery configuration in Supabase Auth settings.
- Pass the latest CI run and visually inspect the preview before considering the code deployable.
