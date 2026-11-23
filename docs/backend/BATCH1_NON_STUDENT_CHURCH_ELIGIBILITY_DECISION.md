# NAASCONNECT Batch 1 — non-student church eligibility decision

**Date:** 2026-11-23  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Authority:** User-confirmed Batch 1 rule; subordinate to NAASCONNECT Nigeria V1.0.

## Confirmed rule

For a non-student member requesting church membership, eligibility is determined by the member's **preferred-region state** matching the selected active local church's state.

The profile must preserve two distinct fields:

- `residential_state`: the member's current residential state.
- `preferred_region_state`: the state/region in which the member prefers to request church membership.

Do not merge these fields, copy one into the other, or substitute residential state when preferred-region state is absent. A non-student church request must fail closed when the preferred-region state is missing/invalid or does not match the selected church's state.

## Implementation implications

1. Add `preferred_region_state` to the existing `public.profiles` record, with a constrained/normalized state representation consistent with the existing state fields.
2. Preserve `residential_state` as a separate profile field.
3. Registration currently collects the preferred-region value but does not persist it in Auth metadata. Update registration/profile persistence so the value is written to the authoritative profile field; do not use editable Auth `user_metadata` as the final eligibility source.
4. The request RPC must use the authoritative `profiles.preferred_region_state` for non-student church matching.
5. Existing Auth metadata may be used only as a controlled backfill source where the exact value exists; do not fabricate missing preferred-region values. Report accounts that need profile completion.
6. Do not add a preferred-zone foreign key or new onboarding table as part of this decision.

## Still required before final SQL freeze

This decision resolves the non-student church location rule only. Student campus eligibility still requires the previously identified V1.0 confirmation for whether matching is by both institution and state of admission, or institution alone for multi-state institutions. Do not infer that student rule from this non-student decision.

## Safety gates unchanged

- Same-organization resubmission after rejection remains approved.
- Keep historical `membership_events`; append a fresh `membership_requested` event on resubmission.
- Close ordinary-member direct self-insert and route requests through a database-validated RPC.
- Preserve scoped admin appointment/insertion, review hierarchy, transfer behavior, status-management RPCs, and all existing V1.0 authorization helpers.
- No production DDL, migration replay, branch reset, index removal, or paid validation-branch creation is authorized by this decision.
- Present the exact complete migration SQL, rollback plan, and role-based regression checks for approval before production changes.
