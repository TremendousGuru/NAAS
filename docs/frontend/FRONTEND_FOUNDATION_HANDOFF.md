# NAASCONNECT Nigeria — Frontend foundation handoff

**Baseline:** V1.0 remains authoritative.  
**Branch:** `feature/naasconnect-frontend-foundation`

## What this increment delivers

- Next.js App Router + TypeScript application foundation.
- Responsive member-facing shell with sidebar navigation, top bar, feed, resource shortcuts and organization overview.
- Six global status scopes: individual, campus/ASF, church, zone, union and national.
- Status visibility statement matching DEC-013: all authenticated members can view active statuses across organizations; default expiry is 24 hours.
- Administration navigation foundation for membership review, organizations, leadership and audit history.
- Responsive navigation drawer and mobile layouts.
- Existing NAASCONNECT logo and repository favicon reused.

## Important scope boundary

This is a **frontend foundation / interaction prototype**, not a completed production application. It intentionally labels preview content and guest mode. It does not fabricate live member counts, organization records, authentication, status publishing, membership decisions, or audit events.

The current repository had no Next.js app, package manifest, frontend routes or Vercel project configuration at the time of implementation. Existing backend code and Supabase migrations were left untouched.

## V1.0 rules carried into the UI

- One identity can hold multiple memberships and scoped roles.
- Organization types are National, Union, Zone, Campus/ASF and Local Church.
- Church affiliation is not assumed to be a simple child of campus.
- Scoped authority is enforced server-side and by PostgreSQL RLS; hiding navigation is not authorization.
- Global statuses are separate from persistent posts and are visible to all authenticated members.
- No production action is represented as successful by this preview.

## Next implementation gates

1. Verify the Vercel preview build and fix all build/runtime errors.
2. Add Supabase SSR authentication using publishable URL/key and server-only secrets; never expose service-role keys.
3. Inspect live schema and map frontend read models to existing RPCs/tables without changing production schema.
4. Implement real role/scope resolution and server-side guards before exposing admin mutations.
5. Build the full admin desktop and mobile views against real permission-aware APIs.
6. Implement status media upload, expiry processing, viewer privacy and reactions only against approved storage/policy contracts.
7. Add controlled-account tests and accessibility/responsive checks.
8. Keep production database writes and migrations separate from frontend deployment.

## Known current limitation

The starter app is a design implementation on mock/preview content. Authentication, database reads/writes, notifications, storage, events and Bible/lesson-study parsing are not connected yet. The UI must not be mistaken for production-ready administration.
