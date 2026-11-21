# NAASCONNECT Nigeria — Database Blueprint v1.0

**Status:** Proposed logical data model based on approved System Architecture v1.0  
**Target:** Supabase PostgreSQL 17  
**Important:** This document defines the logical model. It is not yet an executable migration. Exact column types, indexes, constraints, RLS policies, grants, triggers, and functions will be reviewed before schema deployment.

## 1. Database design rules

- Use UUID primary keys for application entities unless a strong reason exists otherwise.
- Use `timestamptz` for timestamps and store UTC.
- Use foreign keys and explicit constraints; avoid storing relationships only as free-text names.
- Separate identity, membership, role assignment, and executive appointment.
- Model organizations as data, not one table per campus/zone/church.
- Keep approval and leadership history append-only where possible.
- Enable RLS on every exposed table.
- Put privileged authorization checks in trusted server-side/database code, not user-editable metadata.
- Avoid broad SECURITY DEFINER functions. If one is essential, isolate it, restrict EXECUTE, set a safe search_path, and test it.
- Use private storage buckets for non-public documents and member media unless a specific asset is approved for public delivery.

## 2. Identity and profile

### `profiles`
One platform profile per Supabase Auth user.

Logical fields:
- `id` UUID PK, references `auth.users.id`
- `display_name`
- `first_name`, `last_name` (as policy requires)
- `avatar_path`
- `phone` (optional, visibility-controlled)
- `account_status` (active, suspended, deactivated, pending_review)
- `created_at`, `updated_at`

Email and authentication credentials remain managed by Supabase Auth. Do not duplicate passwords or treat profile fields as proof of identity.

### `user_preferences`
- `user_id` PK/FK to profiles
- `locale`
- `timezone`
- `notification_preferences` (validated JSON or normalized child rows)
- `created_at`, `updated_at`

## 3. Organization engine

### `organization_types`
Seeded types: national, union, zone, campus, church. May include other formally approved organization types later.

Fields: `id`, `code` unique, `label`, `description`, `is_active`.

### `organizations`
Fields:
- `id` UUID PK
- `organization_type_id` FK
- `parent_organization_id` nullable self-FK for primary hierarchy
- `name`, `short_name`, `slug` (unique where appropriate)
- `description`
- `status` (draft, pending, active, suspended, archived)
- `verification_status` (unverified, pending, verified, rejected)
- `state_code`, `state_name`, `city_or_lga`, `address`
- `conference_or_mission_name` and verified external reference if available
- `website_url`, `public_email`, `public_phone`
- `created_by`, `approved_by`
- `approved_at`, `created_at`, `updated_at`

Do not make conference names or geographical labels the only source of organizational identity. They are attributes/relationships that can be corrected.

### `organization_relationships`
For non-tree relationships, such as a campus's relationship with a local church, a church's Conference/Mission oversight, or an organization participating in a joint program.

Fields: `id`, `source_organization_id`, `target_organization_id`, `relationship_type`, `valid_from`, `valid_to`, `status`, `created_by`, `created_at`.

### `organization_metadata` (optional)
Use only for genuinely variable attributes that do not warrant typed columns. Do not put core permissions, parent IDs, status, or approval data in JSON.

## 4. Membership

### `memberships`
Fields: `id`, `user_id`, `organization_id`, `membership_type`, `status` (pending, active, declined, ended), `joined_at`, `ended_at`, `source`, `approved_by`, `approved_at`, `created_at`.

Unique/partial constraints should prevent duplicate active membership for the same user and organization while preserving history.

### `membership_history`
Append-only membership events: `id`, `membership_id`, `action`, `old_status`, `new_status`, `actor_user_id`, `reason`, `created_at`.

## 5. Roles and permissions

### `roles`
Stable role codes, labels, and descriptions. Examples: national_admin, union_admin, zone_admin, campus_admin, church_admin, executive, pastor, elder, member.

### `permissions`
Stable permission codes and descriptions, e.g. organization.read, organization.update, organization.approve, membership.review, event.create, event.moderate, leadership.transition.approve, status.publish_as_organization, church.update.

### `role_permissions`
Many-to-many role/permission mapping.

### `user_role_assignments`
Fields: `id`, `user_id`, `role_id`, `organization_id` (scope), `status`, `granted_by`, `approved_by`, `valid_from`, `valid_until`, `created_at`, `revoked_at`, `revoked_by`, `revocation_reason`.

A role is never global merely because its label says “administrator”; its scope is explicit. National scope is represented by the national organization record.

### `executive_positions`
Position definitions, optionally scoped by organization type: president, vice president, general secretary, assistant secretary, treasurer, financial secretary, chaplain, PRO, welfare director, sisters'/brothers' coordinator, and other approved portfolios.

### `leadership_terms`
Fields: `id`, `organization_id`, `position_id`, `user_id`, `term_name`, `starts_at`, `ends_at`, `status`, `appointed_by`, `created_at`.

### `leadership_transitions`
Fields: `id`, `organization_id`, `current_term_id`, `proposed_term_payload` or normalized proposed appointment reference, `submitted_by`, `submitted_at`, `approving_organization_id`, `status`, `reviewed_by`, `reviewed_at`, `decision_reason`, `effective_at`, `created_at`.

### `leadership_transition_members`
Proposed incoming/outgoing executive appointments linked to a transition. Supports incoming president confirmation and complete executive handover without overwriting the previous term.

### `approval_requests`
Reusable approval workflow record for organization applications, leadership transitions, church verification, and other controlled actions. Fields: `id`, `request_type`, `target_type`, `target_id`, `requesting_organization_id`, `approving_organization_id`, `submitted_by`, `status`, `decision_by`, `decision_at`, `decision_note`, `created_at`.

## 6. Organization onboarding

### `organization_applications`
Fields: `id`, `applicant_user_id`, `requested_type_id`, `requested_name`, `requested_parent_id`, `state/location fields`, `institution_or_church_details`, `contact_details`, `supporting_document_paths`, `status`, `assigned_approving_organization_id`, `reviewed_by`, `reviewed_at`, `review_note`, `created_at`.

An application does not itself grant admin permissions. Approval activates/creates the organization and separately grants a scoped initial role.

## 7. Events

### `events`
Fields: `id`, `organization_id` (owning organization), `created_by`, `title`, `description`, `event_type`, `venue`, `starts_at`, `ends_at`, `visibility`, `status`, `cover_media_path`, `created_at`, `updated_at`, `cancelled_at`.

### `event_registrations`
Fields: `id`, `event_id`, `user_id`, `status`, `registered_at`, `attendance_status`.

Moderation is evaluated against the event's owning organization and the administrator's scope. An administrator of a peer zone cannot modify another zone's event.

## 8. Persistent community publishing

### `posts`
Fields: `id`, `author_user_id`, nullable `author_organization_id`, `body`, `visibility`, `status`, `published_at`, `edited_at`, `created_at`.

### `post_media`
Fields: `id`, `post_id`, `storage_path`, `media_type`, `mime_type`, `size_bytes`, `display_order`, `created_at`.

Individual posts and organizational posts remain distinct from temporary status updates.

## 9. Global Status / Stories

### `statuses`
Fields:
- `id` UUID PK
- `publisher_user_id` nullable for organization-only publishing
- `publisher_organization_id` nullable for individual publishing
- `publisher_type` (individual, organization)
- `text_content` nullable
- `visibility` default `authenticated_members`
- `status` (active, deleted, expired, moderated)
- `published_at`
- `expires_at` default 24 hours after publication
- `created_at`, `deleted_at`

Constraint: exactly one publisher identity path must be valid for the selected publisher type. Individual publishing requires an authenticated user. Organization publishing requires an authorized scoped role.

### `status_media`
Fields: `id`, `status_id`, `storage_path`, `media_type` (image/video), `mime_type`, `size_bytes`, `duration_seconds`, `display_order`, `created_at`.

### `status_views`
Fields: `id`, `status_id`, `viewer_user_id`, `viewed_at`. Unique constraint on `(status_id, viewer_user_id)` if only first-view tracking is required; otherwise preserve view events separately.

### `status_reactions`
Fields: `id`, `status_id`, `user_id`, `reaction_code`, `created_at`. Unique constraint on `(status_id, user_id)` if one active reaction per viewer is intended.

**Global visibility rule:** all active, non-expired statuses with `visibility = authenticated_members` are readable by any authenticated, active platform member. This deliberately does not filter by union, zone, campus, or church. Organization publishing permission is checked at write time. Users can delete their own individual status; organizational status deletion/moderation is limited to the publishing organization and authorized higher-level moderators under policy.

Expired media must be cleaned up by a scheduled retention job after the configured grace period. Expiration is enforced at read time as well as by cleanup.

## 10. Communication

### `chat_rooms`
Fields: `id`, `room_type` (national, union, zone, campus, church, custom), `organization_id`, `name`, `description`, `status`, `created_by`, `created_at`.

### `chat_room_members`
Fields: `id`, `room_id`, `user_id`, `membership_role`, `joined_at`, `left_at`, `status`.

### `messages`
Fields: `id`, `room_id`, `sender_user_id`, `body`, `message_type`, `reply_to_message_id`, `created_at`, `edited_at`, `deleted_at`.

### `message_attachments`
Fields: `id`, `message_id`, `storage_path`, `mime_type`, `size_bytes`, `created_at`.

Room membership, reading, posting, and moderation are independently authorized. Realtime subscriptions must apply the same access rules.

## 11. Churches and directory contacts

Churches are organization records of type church. Additional typed detail can live in:

### `church_details`
Fields: `organization_id` PK/FK, `service_schedule`, `pastor_or_lead_contact` (restricted), `whatsapp_group_url`, `public_contact_email`, `public_contact_phone`, `verification_status`, `verified_by`, `verified_at`, `updated_at`.

### `organization_contacts`
Fields: `id`, `organization_id`, `contact_type`, `label`, `value`, `visibility`, `verified_at`, `created_at`.

WhatsApp invite URLs are untrusted external links until verified by an authorized representative. Contact visibility must be explicit.

## 12. Notifications and schedules

### `notifications`
Fields: `id`, `recipient_user_id`, `notification_type`, `title`, `body`, `target_type`, `target_id`, `read_at`, `created_at`.

### `notification_preferences`
Fields: `id`, `user_id`, `channel` (in_app, email, web_push), `category`, `enabled`, `updated_at`.

### `notification_deliveries`
Tracks delivery attempts, provider reference, status, retry count, and timestamps without storing provider secrets.

### `scheduled_notifications`
Stores approved recurring activity reminders, target audience/scope, local time, timezone, next run, active state, and creator. Scheduling must be timezone-aware and avoid duplicate sends.

### `push_subscriptions`
Stores browser push endpoint and encrypted/controlled subscription keys per user/device, with revocation and last-used timestamps.

## 13. Spiritual resources

### `resource_categories`
Examples: Bible translations, Bible books, lesson study quarters, lesson study weeks, other approved materials.

### `resources`
Fields: `id`, `category_id`, `title`, `description`, `resource_type`, `storage_path`, `access_level`, `language`, `copyright_status`, `attribution`, `published_at`, `created_at`.

### `bible_translations`
Fields: `id`, `name`, `abbreviation`, `language`, `rights_status`, `source_resource_id`.

### `bible_books`
Fields: `id`, `translation_id`, `book_order`, `name`, `testament`, `chapter_count`.

### `bible_chapters`
Fields: `id`, `book_id`, `chapter_number`, `content_reference` or structured verse relationship.

### `bible_verses`
Fields: `id`, `chapter_id`, `verse_number`, `verse_text`.

### `lesson_study_series`
Fields: `id`, `title`, `quarter`, `year`, `language`, `resource_id`, `rights_status`, `published_at`.

### `lesson_study_lessons`
Fields: `id`, `series_id`, `lesson_number`, `title`, `memory_text`, `study_start_date`, `study_end_date`, `content_reference`.

The PDFs are source inputs, not the final navigation model. The Bible must be parsed into book/chapter/verse navigation. Lesson study must be parsed into quarter/lesson/day sections where the source permits. Preserve source attribution and verify extracted content against the PDF.

## 14. Audit and moderation

### `audit_logs`
Append-only record of actor, action, target type/id, organization scope, timestamp, request/correlation ID, and minimal before/after metadata. Never store passwords, access tokens, or secret values.

### `administrative_actions`
Structured records for approvals, role changes, suspensions, content moderation, and other sensitive operations.

### `content_reports`
Member reports for posts, statuses, messages, or organization records. Includes reason, review status, assigned moderator, decision, and timestamps.

## 15. Storage buckets (proposed)

- `avatars`: public or signed access depending on privacy decision.
- `organization-assets`: organization logos and approved public materials.
- `status-media`: private bucket; authenticated global read through controlled policies, owner-scoped writes, scheduled cleanup.
- `post-media`: policy-controlled.
- `event-media`: policy-controlled.
- `church-documents`: private.
- `resource-library`: access controlled by resource rights/access level.
- `application-documents`: private, restricted to applicant and reviewing authority.

Storage object paths should include stable IDs, not user-provided filenames as authorization signals.

## 16. Key indexes and constraints to plan

- Unique organization slug (within agreed namespace).
- Index organization parent and type.
- Index relationship source/target/type.
- Index memberships by user/status and organization/status.
- Index role assignments by user/status and organization/status.
- Index active leadership terms by organization and date.
- Index approval requests by approver/status/date.
- Index events by organization/start time/status.
- Index posts by published time and owner.
- Index statuses by expires_at and published_at; index status_views by status and viewer.
- Index messages by room and created_at.
- Index notifications by recipient and created_at/read_at.
- Unique verse coordinate: translation + book + chapter + verse.
- Foreign-key indexes on all high-volume join columns.

## 17. RLS policy domains

Policies will be designed and tested per table, not copied blindly.

- Public/anonymous: only explicitly public directory and resource fields, if approved.
- Authenticated members: global active statuses, permitted public community content, and approved directory fields.
- Individual ownership: users manage their own profile preferences, own individual statuses, and allowed membership requests.
- Organization scope: administrators manage records belonging to their organization, with higher-level inherited oversight only where explicitly allowed.
- Approval scope: only the designated approving organization/role can decide a pending request.
- Leadership scope: current authorized leader can submit; next-level authority can approve; no user can self-approve their own elevation.
- Private resources/media: access follows storage policies and resource entitlement.
- Audit: append-only inserts through trusted paths; ordinary users cannot read or mutate administrative logs.

Views exposed through the Data API must use `security_invoker = true` where supported, or be placed in a non-exposed schema with appropriate grants.

## 18. Build order for database implementation

1. Inspect existing project objects and resolve pre-existing security advisor findings.
2. Create foundational enums/types and organization tables.
3. Create profiles, memberships, roles, permissions, and scoped role assignments.
4. Add onboarding applications and approval workflow.
5. Add executive positions, leadership terms, and transition workflow.
6. Add audit logging and secure helper functions.
7. Apply and test RLS policies and grants.
8. Add events and persistent publishing.
9. Add Global Status / Stories and protected media storage.
10. Add chat and Realtime policies.
11. Add notifications and scheduled reminders.
12. Add church directory and contacts.
13. Add resource library and structured Bible/lesson-study tables.
14. Run security/performance advisors and role-based test cases.
15. Generate and commit versioned migrations; verify a clean replay.

## 19. Open policy decisions

- National transition approving authority.
- Church verification and Conference/Mission oversight mapping.
- Whether status view lists are visible to the author only or also to organizational admins for organization-published statuses.
- Exact media limits and expired-media retention grace period.
- Resource copyright/licensing and access rules.
- Audit-log retention period.
- Whether direct messages are in the initial release or a later phase.
