# NAASCONNECT Nigeria — V1 Phase 5.9 General Audit Logs Design

**Status:** Design specification only — implementation blocked by migration source-integrity gate.  
**V1 authority:** Master Project Control Document V1.0, Phase 5.9.  
**Scope:** General administrative/security audit records across NAASCONNECT's organization hierarchy.

## 1. Purpose

Provide a durable, queryable record of consequential administrative and security actions, with visibility constrained to the actor's authorized organizational jurisdiction. This is a general platform audit trail, not a replacement for domain-specific histories already implemented.

## 2. Existing history that must not be duplicated

The live database already contains:
- `public.membership_events` — membership lifecycle, transfer, review and status-change events.
- `public.leadership_history` — approved executive/leadership succession history.
- `public.leadership_notification_events` — leadership-handover notification events.
- `public.membership_transfer_requests` — the current transfer workflow and review state.

Phase 5.9 must not copy these records into a second generic event stream. Existing domain history tables remain authoritative for their respective events. General audit logs may reference a domain record only when a separate, non-duplicative administrative action needs an audit entry.

## 3. Proposed general audit event scope

Include actions that are not already fully represented by the domain-specific histories, such as:
- organization creation, activation, suspension, archival, and material hierarchy/contact-setting changes;
- administrator-seat assignment, revocation and privilege changes;
- application/appointment decisions that are not already captured by their own durable decision history;
- changes to platform-wide security and governance configuration;
- privileged moderation actions and sensitive administrative access, if those workflows are approved;
- security-relevant denied privileged operations, where safe and useful to record.

Exclude:
- ordinary member profile browsing and routine reads by default;
- duplicate membership status/transfer events;
- duplicate leadership appointment/handover events;
- passwords, tokens, API keys, session secrets, full auth metadata, or unrestricted request bodies;
- unnecessary sensitive personal data.

## 4. Proposed record model

Proposed table name: `public.admin_audit_logs` (subject to schema-name collision check at implementation time).

Proposed fields:
- `id` UUID primary key;
- `actor_user_id` UUID nullable only for explicitly identified system-originated actions;
- `actor_org_id` UUID nullable, representing the acting administrator's active scope when known;
- `target_org_id` UUID nullable, the organization affected;
- `action_key` text, constrained to a controlled event vocabulary;
- `entity_type` text, controlled allowlist;
- `entity_id` UUID nullable;
- `summary` JSONB, strictly allowlisted, minimal, non-secret metadata only;
- `request_id` UUID/text correlation identifier where available;
- `created_at` timestamptz, server-generated and immutable.

No client-supplied actor identity, timestamp, role, scope or arbitrary payload may be trusted.

## 5. Write path and immutability

- No direct authenticated or anonymous INSERT, UPDATE, DELETE or TRUNCATE grants.
- No user-facing write RPC that accepts an arbitrary actor or unrestricted audit payload.
- Emit events from trusted database triggers or narrowly scoped private-schema functions attached to approved domain mutations.
- Audit writes should occur in the same transaction as the mutation where possible, so the action and its audit record commit or roll back together.
- Use a fixed empty `search_path`, schema-qualified object references, explicit authentication/authorization checks, and narrowly scoped EXECUTE grants for any SECURITY DEFINER implementation.
- Prevent recursive self-auditing of writes to the audit table.
- Audit records are append-only to application roles. Corrections, if ever required, should be represented as separate corrective events, not edits to prior records.

## 6. Jurisdiction-scoped read access

- RLS enabled.
- Authenticated read access only.
- A reader may see records where `target_org_id` is within the reader's authorized organization subtree, using the established `private.can_administer_org(target_org_id)` hierarchy helper.
- National/union/zone/campus/church administrators must not read sibling or unrelated jurisdictions.
- Where `target_org_id` is null (platform-wide event), access must be limited to an explicitly approved national-level audit role; do not treat a null target as globally visible.
- Actor self-visibility is not automatically granted; V1 owner approval must decide whether non-admin actors can see their own audit events.
- Do not use client-editable `user_metadata` or client-supplied role claims as authorization inputs.

## 7. Indexing and retention

Candidate indexes:
- `(target_org_id, created_at DESC)`;
- `(actor_user_id, created_at DESC)`;
- `(action_key, created_at DESC)`;
- `(entity_type, entity_id, created_at DESC)` only if actual query requirements justify it.

Retention duration, export/archival rules, legal/privacy basis, and any deletion/immutability exception require an explicit NAAS governance decision before DDL. Do not assume indefinite retention without approval.

## 8. Verification requirements before closure

- Confirm no existing table/function name collision.
- Prove unauthenticated and anonymous reads/writes are denied.
- Prove direct authenticated INSERT/UPDATE/DELETE/TRUNCATE are denied.
- Prove national/union/zone/campus/church scope inheritance and sibling isolation.
- Prove null-target platform events are visible only to the explicitly approved national audit role.
- Prove actor identity and timestamps are server-derived.
- Prove audit insertion is atomic with each supported domain mutation.
- Prove membership and leadership event flows do not create duplicate generic records.
- Test tampering, payload size/field allowlists, SQL injection surfaces, and retention/export behavior.
- Run Supabase security, health and performance advisors and document findings.
- Controlled-account end-to-end tests remain required; no test result should be claimed until run.

## 9. Implementation gate

This is design only. No Phase 5.9 migration, table, policy, function, trigger or data write has been created. Implementation may begin only after the migration source-integrity recovery gate in `docs/backend/MIGRATION_SOURCE_INTEGRITY_FORENSIC_REPORT.md` is passed and documented.

---
