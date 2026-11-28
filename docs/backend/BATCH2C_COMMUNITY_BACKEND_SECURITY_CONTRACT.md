# NAASCONNECT — Batch 2C Community Backend and Security Contract

**Status:** Implementation contract / review candidate; not applied to Supabase  
**Supabase project:** `csytneubatlaakpmnsfk` (NAAS)  
**Branch:** `feature/naasconnect-batch2c-community`  
**Scope:** Persistent community posts, official announcements, private media and reports/moderation.

## 1. Live facts verified for this stage

- The live project is `ACTIVE_HEALTHY`, PostgreSQL 17.12.
- The existing public schema contains 14 tables with RLS enabled.
- `community_statuses` exists and has RLS. It is a separate temporary Status/Stories feature with a maximum 24-hour lifetime.
- Current `community_statuses` policies permit authenticated reads of unexpired statuses, personal inserts only for users with an active organization membership, organization inserts through `private.can_administer_org`, and author/scoped-admin deletes.
- No `community_posts` or `community_post_reports` tables were found in the live schema.
- No Storage buckets were returned by the live bucket inventory; the proposed `community-media` bucket is not present.
- The live organization records currently comprise one active national unit, three pending union units and twenty pending zone units. Pending organizations must not be treated as active publishing authorities.
- The current member route `app/app/community/page.tsx` reads `community_statuses`; it is a Status viewer, not a persistent community feed.
- The existing `app/app/actions.ts` already contains status publishing/deletion actions. Preserve those actions and their current database contract.

## 2. Proposed Batch 2C data objects

### `public.community_posts`
Persistent post/announcement records. The final SQL must include:
- Server-generated UUID and timestamps.
- `author_user_id` referencing `auth.users`.
- Nullable `author_org_id` referencing `org_units` (null for personal posts).
- Separate nullable `audience_org_id` for the authorized target organization/scope.
- A constrained `post_type` distinguishing member posts from official announcements.
- Required bounded text content and optional media-path metadata.
- A constrained lifecycle state (draft/published/hidden/removed).
- Published timestamp and updated timestamp.
- Constraints preventing an organization announcement without an organization author and preventing invalid audience/type combinations.
- Indexes for published feed ordering, author history, audience scope and moderation lookup.
- No client-supplied actor, role, scope, moderation identity or authoritative timestamps.

### `public.community_post_reports`
Reports against persistent posts. The final SQL must include:
- Report UUID, post FK, reporter FK, bounded reason and optional detail.
- Constrained review state (open, reviewing, resolved, dismissed/escalated as finalized).
- Server-set reviewer, review timestamp and resolution reason.
- Duplicate/open-report policy and indexes for queue lookup.
- RLS that permits a reporter to create/read their own report, but limits review visibility and updates to moderators authorized over the post's organization/audience scope.
- Reporting alone must not delete or hide the target post.

### Private Storage bucket: `community-media`
- Private bucket; do not make member media publicly readable by URL.
- Allow only approved image and short-video MIME types and an explicit size limit.
- Object keys must be owner-prefixed (authenticated user UUID).
- Upload requires the authenticated owner path.
- Read access requires either ownership or an RLS-verified published post whose audience includes the requesting member.
- Update/delete requires owner authority and post lifecycle rules; scoped moderators may only remove media through the authorized moderation workflow.
- Use authenticated downloads or short-lived signed URLs. Never expose service-role credentials to the browser.
- Ensure upsert policies include SELECT + INSERT + UPDATE if upsert is used.

## 3. Authorization contract

- Reuse `private.can_administer_org(org_id)` as the existing administrative authorization primitive; do not create a parallel role hierarchy.
- Personal post creation: authenticated user + active NAAS organization membership.
- Organization post/announcement creation: authenticated user + active administrator assignment for `author_org_id`.
- Audience selection: must be validated server-side/database-side against the publisher's organization jurisdiction. A union/zone/campus publisher cannot broadcast above or outside their scope.
- Read access: authenticated NAASCONNECT users only, restricted to the post's intended audience. A national audience may be platform-wide only when the publisher is authorized for the national organization.
- Edit/delete: author ownership for personal posts; organization administrators for organization posts; moderators limited to their authorized scope.
- Report submission: authenticated user may report a visible post. Review actions are scope-checked and audited.
- UI visibility is not authorization. Every exposed table must have RLS and least-privilege grants.

## 4. Migration and provenance safeguards

- Preserve the existing 29-entry migration ledger; never rewrite, repair, replay or rename historical migrations as a shortcut.
- Preserve the existing tables and their data: `org_units`, `org_memberships`, `profiles`, `community_statuses`, `membership_events`, and `leadership_notification_events`.
- The three Stage 5.7 repository migration files use shifted timestamps relative to the live ledger. The repository's migration-integrity reports document this discrepancy; they are evidence, not replay instructions.
- Use one new forward-only Batch 2C migration after the exact SQL, existing grants/policies, storage catalog and rollback implications have been reviewed.
- Use a Batch-2-specific timestamp trigger/function rather than altering the shared `private.touch_updated_at` function.
- Keep privileged helpers in the private schema, use fixed search paths and narrow EXECUTE grants. Avoid public SECURITY DEFINER endpoints.
- Run Supabase security/performance advisors and positive/negative authorization tests after applying the migration.
- No production rows, membership records or admin assignments should be seeded as part of Batch 2C.

## 5. Explicit exclusions from Batch 2C

- Do not replace or extend `community_statuses` into a permanent feed.
- Do not implement comments, direct messaging, group chat, event registration or notification delivery here.
- `org_events`, `event_registrations`, `user_notifications` and `notification_preferences` belong to Batch 2D and must be handled separately.
- Do not grant permissions to pending union or zone records.
- Do not make media public to avoid implementing audience-aware storage policies.

## 6. Required integration tests

1. Active member can create a personal post; user without active membership is denied.
2. Active authorized organization admin can create an organization announcement.
3. Ordinary member cannot publish as an organization.
4. Campus moderator cannot review another campus's report.
5. Zonal moderator cannot moderate outside the zone's authorized descendants.
6. Pending organization cannot publish or administer content.
7. A member outside the audience cannot read post content or attached media.
8. Author can edit/delete only their own eligible post.
9. Scoped moderator can perform only permitted moderation actions; action is recorded.
10. Any authenticated viewer can report a visible post; duplicate/report abuse is controlled.
11. Anonymous access is denied to tables and private media.
12. Existing Status/Stories creation, listing, expiry and deletion continue unchanged.
13. Feed ordering, pagination and indexes work for realistic data volume.
14. Mobile and desktop empty/loading/error states behave correctly.

## 7. Implementation status

- Backend inspection: complete for the objects and policies listed above.
- Figma design: not yet materialized; Figma Starter plan call limit was reached after creating the design file.
- Frontend implementation: not started; owner design approval is required by the V1.0 Figma-first workflow.
- Supabase migration: not applied.
- Production data: unchanged by this Batch 2C preparation.
