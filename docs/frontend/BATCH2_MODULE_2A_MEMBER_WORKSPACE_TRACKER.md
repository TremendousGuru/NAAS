# Batch 2A — Member Workspace Implementation Tracker

**Repository:** `TremendousGuru/NAAS`  
**Working branch:** `feature/naasconnect-mobile-multipage-intro`  
**Scope authority:** `docs/NAASCONNECT_NIGERIA_COMPLETE_PROJECT_DOSSIER.md` (V1.0 Phase 6.1, with supporting Phase 5 member/profile workflows)  
**Database authority:** live Supabase project `csytneubatlaakpmnsfk`  
**Status:** Implementation in progress; not accepted as complete.

## Scope and boundaries

Module 2A implements the authenticated member workspace and profile journey. It does not silently add new database schema, duplicate membership lifecycle records, or introduce messaging/events functionality. Existing tables and RPCs are reused.

## Existing implementation found in the working branch

| Capability | Repository evidence | Assessment |
|---|---|---|
| Member dashboard | `app/app/page.tsx` | Present; shows membership counts, pending requests, status count, organization overview and links. |
| Profile editing | `app/app/settings/page.tsx`, `MemberProfileForm.tsx`, `app/app/actions.ts` | Present; student/non-student fields and server-side validation. |
| Profile persistence | `updateMemberProfile` server action | Present; upserts the authenticated user's own profile through the Supabase server client. |
| Membership overview | `app/app/membership/page.tsx` | Present; displays own memberships and current states. |
| Membership request | `requestMembership` server action | Present; calls the database-side `request_member_onboarding` RPC. |
| Transfer workflow | `membership_transfer_requests`, `membership_events` and related actions | Present in UI integration; controlled-account acceptance remains outstanding. |
| Membership history | `membership_events` query in membership page | Present; displays the member's own recorded lifecycle events. |
| Account security | `app/app/settings/page.tsx` and `settings/actions.ts` | Present; email-change confirmation and password update. |
| Session sign-out | `components/PortalNavigation.tsx`, `app/auth/actions.ts` | Present. |
| Responsive navigation | `components/PortalNavigation.tsx` | Present; desktop sidebar and mobile drawer. Mobile browser acceptance remains outstanding. |

## Changes made in this implementation pass

1. The profile upsert now sets `profiles.profile_completed = true` only after the server action has validated the required category-specific fields and the database upsert succeeds.
2. The member dashboard now surfaces a direct profile-completion prompt when the durable profile is absent/incomplete or its read fails. The prompt routes to account settings.
3. No Supabase DDL or migration was applied. No production data was changed by these GitHub commits.

## Acceptance checklist

### Profile
- [x] Student and non-student forms use separate required fields.
- [x] Server action validates required fields and recognized Nigerian state values.
- [x] Durable profile upsert is scoped to the authenticated user's ID.
- [x] Successful validated save marks the profile complete.
- [x] Dashboard prompts incomplete profiles to continue setup.
- [ ] Controlled student-account save/reload test.
- [ ] Controlled non-student-account save/reload test.
- [ ] Negative test: user A cannot read/update user B's profile.
- [ ] Confirm profile completion state is correct for existing legacy profiles and any required backfill policy.

### Membership
- [x] Member can view own memberships and statuses.
- [x] Member can submit a membership request through the database RPC.
- [x] Member can view own membership events and transfer requests.
- [x] Member can request/cancel a transfer using existing backend contracts.
- [ ] Controlled account tests for eligible/ineligible membership requests.
- [ ] Controlled account tests for source/destination transfer approvals, rejection and cancellation.
- [ ] Verify RLS prevents cross-user and cross-organization disclosure.

### Account and navigation
- [x] Settings page separates personal profile and sign-in security.
- [x] Email update requires confirmation.
- [x] Password update validates matching entries and minimum length.
- [x] Sign-out action is present in desktop and mobile navigation.
- [x] Member routes are separate App Router pages.
- [ ] Browser test of mobile drawer open/close, route changes, keyboard focus and scroll behavior.
- [ ] Browser test of settings forms with an authenticated controlled account.
- [ ] Verify no horizontal overflow at supported mobile widths.

## Known blockers / dependencies

- The V1 reconciliation register identifies the migration source-integrity gate as not passed. Do not run `supabase db push`, replay historical migrations, alter migration ledger rows, or create paid Supabase branches as part of this module.
- V1 Phase 5.9 general audit logs remain design-only and held behind the migration-integrity/recovery gate. Do not claim they exist or duplicate `membership_events`/leadership history.
- Controlled-account end-to-end tests were previously deferred. They remain required before acceptance.
- The current branch is one commit behind `main` and significantly ahead; reconcile branch history before merge/promotion. Do not merge blindly.

## Completion rule

2A is complete only when the automated quality gate and Vercel preview pass, controlled authenticated profile/membership/security journeys pass, and the module is verified against live RLS behavior. A successful TypeScript/build check alone is insufficient.

## Next work

1. Complete the current GitHub quality-gate run for the profile/dashboard correction.
2. Add/execute authenticated browser acceptance coverage using owner-provided controlled test accounts or a safe test identity flow.
3. Resolve any failures without changing production schema.
4. Only after 2A acceptance, proceed to V1 Phase 6.2/6.3 directory integration and continue through the remaining Phase 6 capabilities in the approved order.
