# NAASCONNECT Nigeria — Stage 5.7 Community & Social Features

**Stage:** 5.7 — Community and platform-wide status updates  
**Status:** Backend foundation and first integrated community feed UI implemented; moderation workflow coverage and controlled-account end-to-end verification remain open.  
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
- Media file upload/storage buckets.
- Community feed UI, personal post composer, scoped organization announcement composer and user post-report submission are now connected to the existing community_posts/community_post_reports tables. Platform-wide report triage for personal posts is not available under the current scoped review policy.
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



## Frontend integration update — 28 November 2026

The authenticated `/app/community` route now reads the existing `community_posts` feed, displays community-wide member posts and organization announcements, provides a personal post composer, exposes organization announcement publishing only to users with an active administrator membership for the selected organization, and submits reports to `community_post_reports`. The existing RLS policies remain authoritative. The route also retains the separate 24-hour global status experience.

The National/Union/Zone/Campus/Church administrator community workspace now includes a report-review queue for organization-authored announcements. Review updates (under review, resolved, dismissed, optional review note) are written through the authenticated server action; the existing `community_reports_review` RLS policy remains the authority and restricts each administrator to reports on posts within their organization scope. The queue intentionally excludes personal member posts because the current database policy does not grant platform-wide moderation authority.\n\nThe database also enforces one report per user per post through the unique constraint `community_post_reports_post_id_reporter_user_id_key`; duplicate submissions are therefore rejected at the database layer. Rate limiting is still outstanding. Media upload/storage and controlled-account positive/negative tests also remain outstanding. No schema change was made in this UI pass.


## National personal-post moderation — 28 November 2026

A separate `community-moderation` Edge Function (version 1, JWT verification enabled) now supplies the platform-wide moderation queue for personal `member_post` reports. This avoids weakening the existing organization-scoped RLS policies or introducing a schema migration while the migration-source recovery gate remains closed.

- The function derives the active National organization from `org_units` and requires the signed-in user to hold an active `national_admin` membership at that exact organization. It does not trust user-editable metadata.
- It lists open/reviewing reports only where the related post is a personal member post (`author_org_id IS NULL`).
- National administrators can record review outcomes and notes, or hide a reported personal post. Hiding requires a moderation note and resolves the linked report.
- The existing organization-scoped queue remains in place for organization announcements; Union/Zone administrators do not gain platform-wide member-post authority.
- The service-role Edge Function is the only path for these global actions; the authenticated client has no new table privileges or RLS bypass.

The function is deployed and the National-only queue/actions are now connected to the community page. Controlled-account verification with a National admin and a non-National admin is still required. No database schema, table, policy or grant was changed.
