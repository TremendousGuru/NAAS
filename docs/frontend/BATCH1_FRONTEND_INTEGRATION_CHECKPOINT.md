# Batch 1 frontend integration checkpoint

**Date:** 2026-11-23  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Scope:** Member profile editing and membership-request UI/action wiring  
**Status:** Frontend wiring committed; live database integration is blocked pending the approved Batch 1 SQL being present in the connected Supabase project.

## Changes committed

- `app/app/actions.ts`
  - `requestMembership` now calls `public.request_member_onboarding(p_org_id)`; it no longer inserts directly into `org_memberships` or trusts editable Auth user metadata for eligibility.
  - `updateMemberProfile` writes member category, student admission state, non-student residential state and preferred-region state to the durable `profiles` record.
  - Student requests and non-student requests retain the approved category separation.
  - Validation failures return explicit UI status codes; missing database RPC/schema is reported as backend-not-ready rather than silently pretending success.
- `app/app/page.tsx`
  - Reads durable member category and region fields from `profiles`.
  - Exposes student category, institution, course, study level and state-of-admission controls.
  - Exposes non-student residential state and preferred church-region controls separately.
  - Displays the preferred church region independently from residence.
  - Membership request forms continue to target campus organizations for students and churches for non-students.

## Critical live-schema reconciliation

A read-only inspection of the connected Supabase project `csytneubatlaakpmnsfk` after the frontend commit found:

- `profiles.member_category`, `state_of_admission`, `residential_state`, and `preferred_region_state` are not present.
- `public.request_member_onboarding(uuid)` is not present.
- `public.review_member_onboarding(uuid,text,text)` is not present.
- The existing policy `Scoped administrators or users request membership` remains present.

Therefore the approved candidate SQL is not yet reflected in the connected database, regardless of the separate owner test/approval. The frontend now targets the approved contract, but those profile saves and membership submissions will correctly return a backend-not-ready/error state until the database migration is actually applied to this project. No attempt was made to apply it.

## Administrator action boundary

The current `app/admin/AdminWorkspace.tsx` is explicitly sample/preview UI. It contains illustrative membership requests and disabled review affordances; it does not yet load real queue data or expose approve/reject buttons. The live review RPC is also absent. Do not enable administrator decision buttons until the approved review function exists and the queue query is verified against the current scope helper.

## Verification

- GitHub commits were created for the action and member-page integration.
- Vercel commit status for the latest frontend commit was `pending` at checkpoint time; no successful build is claimed.
- No Supabase DDL, DML, migration replay, or branch creation was performed.
- Next required gate: apply the approved SQL to the intended Supabase project under the owner's separate authorization, verify the RPCs/columns/RLS and advisors, then implement and test live administrator queue and review actions. After that run Vercel build + Playwright desktop/mobile flows and test each button with controlled accounts.

## Button-to-action contract

| UI control | Expected behavior |
|---|---|
| Save profile | Update only the signed-in user's durable `profiles` row; preserve residence and preferred region independently |
| Request membership | Call `request_member_onboarding`; server/database validates category and organization eligibility; create pending request/event |
| Publish status | Retain existing active-membership gate and existing status insert policy |
| Sign out | Existing Supabase sign-out action |
| Admin approve/reject | Not enabled; must call scoped `review_member_onboarding` only after live RPC and real queue are verified |

