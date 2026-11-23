# Batch 1 deployment and profile-load fix — 2026-11-23

## Supabase migration

Applied migration `batch1_member_onboarding_eligibility_and_review` to the existing NAASCONNECT Supabase project `csytneubatlaakpmnsfk`, following the user's explicit approval of Batch 1.

Read-only post-apply verification confirmed:
- `profiles.member_category`
- `profiles.state_of_admission`
- `profiles.residential_state`
- `profiles.preferred_region_state`
- `public.request_member_onboarding(uuid)`
- `public.review_member_onboarding(uuid,text,text)`
- `org_memberships` INSERT policy is now `Scoped administrators create pending memberships`; the prior self-insert path is removed.
- `org_memberships.status` now includes `rejected`.

Supabase security advisor continues to report the existing warning: leaked-password protection is disabled. No new advisor finding was reported in this check.

## Why the profile page failed

The member page selected four profile columns that did not exist in the live database. Post-migration those columns are now present. The prior alert `We could not load your profile` was caused by this schema/application contract mismatch.

## Frontend fix

- Profile form now presents both student and non-student sections at initial onboarding, so choosing a category does not hide the fields needed to save it on the first submission.
- Student data: institution, course, level, state of admission.
- Non-student data: residential state and preferred church region, stored separately.
- Server action still validates the selected category and relevant required fields.
- Membership request action calls the database eligibility RPC; no direct self-insert.

## Deployment

A new Vercel preview was automatically created from commit `e2bf4268b2fa97947ba2644ee798b4709421e3e4` in the existing project `naasconnect-nigeria`. At the time of this checkpoint, its state was `BUILDING`; do not treat it as verified READY until Vercel reports READY and the preview is manually/browser-tested.

Preview URL: https://naasconnect-nigeria-9tamsoc8x-tredexhq-6708.vercel.app

## Still required

- Wait for Vercel build to reach READY.
- Run desktop/mobile visual checks and inspect rendered member profile.
- Test with a controlled signed-in account: save student profile; save non-student profile; confirm distinct residence/preferred region; verify correct organization filters; submit request; verify pending row/event; confirm mismatched state/institution is rejected.
- Test administrator review actions with a controlled authorized administrator. No fake administrator actions are enabled by this checkpoint.
- No production promotion was performed; this remains a preview deployment.
