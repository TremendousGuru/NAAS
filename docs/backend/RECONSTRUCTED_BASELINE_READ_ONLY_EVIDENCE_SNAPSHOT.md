# NAASCONNECT Nigeria — Reconstructed-Baseline Recovery: Read-Only Evidence Snapshot & Discrepancy Report

**Classification:** Read-only evidence capture; not a database backup and not recovered historical migration SQL.  
**Captured at:** 2026-11-21 16:07:29 UTC (database catalog capture); repository and advisor checks completed in the same inspection session.  
**Supabase project:** `csytneubatlaakpmnsfk` (PostgreSQL 17.12)  
**GitHub repository:** `TremendousGuru/NAAS`, branch `main`  
**Owner approval:** The owner approved preparation of this read-only snapshot and a separately documented reconstructed-baseline procedure. No approval for database writes was given.  
**Current disposition:** Evidence captured; discrepancy reconciliation remains open; database-change gate is **CLOSED / NOT AUTHORIZED**.

## 1. Scope and non-actions

This document records catalog metadata and migration-source discrepancies observed using read-only inspection. It is intended to support a later, separately approved recovery decision.

The capture includes:
- Supabase migration ledger metadata (version and name).
- Repository migration-directory inventory and file identifiers.
- Public/private schema catalog metadata relevant to membership: columns, constraints, indexes, RLS policies, grants, functions and triggers.
- Selected row counts and advisor findings.
- Existing architecture and stage documentation.

This is **not** a byte-for-byte database backup, a `pg_dump`, a copy of the original applied SQL, or proof of the historical SQL checksums. No user profile or membership row contents were exported.

Explicitly not performed:
- No DDL or DML.
- No migration replay or `apply_migration`.
- No edit to Supabase migration history.
- No migration file creation, rename, deletion or replacement.
- No branch creation (paid or otherwise).
- No Phase 5.9 audit-log DDL or implementation.
- No member, transfer, profile or history rows were seeded, modified or deleted.

## 2. Snapshot identity and inventory

At catalog capture:
- Database: `postgres`.
- PostgreSQL: `17.12`.
- Snapshot role: `postgres`.
- Search path: `"$user", public, extensions`.
- Capture timestamp: `2026-11-21T16:07:29.629342+00:00`.

### Migration inventory

- Supabase ledger: **29 applied migration records**.
- GitHub `supabase/migrations` directory: **26 SQL files**.
- The inventory remains non-isomorphic: there are applied ledger records without matching source files, and a repository-only migration artifact without a ledger record.

The four missing applied Stage 5.6 source records remain:

| Applied version | Ledger name | Source status |
|---|---|---|
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | Original SQL source not found |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | Original SQL source not found |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | Original SQL source not found |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | Original SQL source not found |

The available Project conversation files and Library were searched for the exact migration identifiers and related SQL names. No candidate SQL file was found. The accessible Library inventory contained no SQL files. This establishes only that the sources were not present in the currently accessible file surfaces; it does not establish that they do not exist on the owner's workstation, external drive, cloud backup, or another repository clone.

### Other migration discrepancies

1. **Stage 5.5.2**
   - Ledger: `20261121140749_stage5_5_2_scoped_executive_term_updates`.
   - Repository filename: `20261121140642_stage5_5_2_scoped_executive_term_updates.sql`.
   - Git history has a same-name source commit and the live catalog has `private.set_executive_term` plus a public SECURITY INVOKER wrapper.
   - This is semantic corroboration only. The ledger does not expose the applied SQL body or checksum; exact applied-source identity remains unproven. Do not rename based on timestamp similarity.

2. **Stage 5.7**
   - Ledger versions: `20261121152734`, `20261121152827`, `20261121152909`.
   - Repository filenames use timestamps `20261121162500`, `20261121162600`, `20261121162700` respectively.
   - Git commits and live `community_statuses`/policy/index/grant catalog evidence corroborate intended feature results.
   - Exact historical SQL identity remains unproven because the ledger does not expose applied SQL bodies/checksums. Do not rename these files without trusted source evidence.

3. **Repository-only organization foundation**
   - File: `20261121133000_org_foundation.sql`.
   - No corresponding migration ledger record.
   - The file creates `public.org_units` and `public.org_memberships`; both tables already exist in the live project.
   - Applying it now risks duplicate-object failure and is not authorized. Preserve it as an unresolved, non-deployable artifact until its origin and relationship to the applied provisional-geography foundation are reviewed.

4. **Stage 5.6 documentation**
   - The first three missing Stage 5.6 source references had previously been corrected in `docs/backend/STAGE5_6_MEMBERSHIP_ADMINISTRATION.md` to the actual ledger IDs.
   - Those corrections fix version references; they do not recover or authenticate the original SQL files.

## 3. Live database evidence — membership subsystem

### Tables and observed row counts

| Table | Rows at capture | RLS |
|---|---:|---|
| `public.org_units` | 24 | Enabled |
| `public.org_memberships` | 0 | Enabled |
| `public.profiles` | 0 | Enabled |
| `public.membership_transfer_requests` | 0 | Enabled |
| `public.membership_events` | 0 | Enabled |

The full public-schema catalog inventory contains **14 tables; RLS is enabled on all 14**. FORCE ROW LEVEL SECURITY is not enabled on those tables. The row counts are a point-in-time observation, not a guarantee about future state.

### Membership data model observed

- `org_memberships` is the canonical organization-membership relation. It has UUID identity, organization/user foreign keys, role and lifecycle status, approval/join timestamps, and status-change actor/reason/timestamp fields.
- A unique constraint exists on `(org_id, user_id)`.
- Membership status values are constrained to `pending`, `active`, `suspended`, and `ended`.
- `membership_transfer_requests` records member, source membership/organization, destination organization, review state, source/destination reviewers and timestamps, resulting membership, cancellation actor/time/reason, and request timestamps.
- Transfer statuses are constrained to `pending_source`, `pending_destination`, `approved`, `rejected`, and `cancelled`; source and destination organizations must differ.
- `membership_events` stores membership lifecycle and transfer events, with user, membership, organization, actor, related-transfer, details and timestamp references.
- The event-type constraint includes membership request/approval/rejection/suspension/reactivation/termination and transfer request/review/completion/cancellation event types.

### RLS policies observed

- Memberships: authenticated users may read their own memberships; scoped administrators may read memberships in organizations they administer. Inserts are limited to pending scoped-admin requests or a user's own eligible campus/church request. Updates require scoped administrator authorization in both USING and WITH CHECK.
- Transfer requests: authenticated users and scoped administrators may read requests within the relevant ownership/jurisdiction. Inserts are restricted to the user's own request with pending initial state, no prefilled reviewer/result fields, an active source membership owned by that user, and an active campus/church destination. No direct authenticated UPDATE policy was observed.
- Membership events: authenticated users may read their own history; scoped administrators may read events for organizations they administer. No direct authenticated INSERT policy was observed.

### Grants observed

- `authenticated`: SELECT on membership events; SELECT and INSERT on transfer requests; SELECT, INSERT and UPDATE on org memberships.
- No `anon` table grants were observed for these three membership tables in the inspected role-grant query.
- `service_role` and `postgres` retain broad database privileges; this is an expected privileged operational surface and must remain server-side.

### Indexes and triggers observed

- Membership indexes cover membership organization/user/status/role and approval/status-change actor lookups.
- Transfer indexes cover source/destination organization and review status, source/result membership, reviewers, cancellation actor, and user/status/time.
- Event indexes cover actor, membership, organization/time, organization/event/time, related transfer, and user/time.
- Two `org_memberships` triggers were observed: `org_memberships_touch_updated_at` and `org_memberships_validate_role`.
- No user-defined triggers were observed on `membership_transfer_requests` or `membership_events` in the targeted trigger inventory.

### RPC catalog observed

Private SECURITY DEFINER implementations exist for:
- `cancel_membership_transfer`
- `get_membership_activity_report`
- `get_membership_review_queue`
- `get_scoped_membership_directory`
- `get_scoped_membership_statistics`
- `manage_membership_status`
- `review_membership_transfer`

Public SECURITY INVOKER wrappers exist for those callable workflows. The membership review/status/cancellation functions rely on the existing `private.can_administer_org` scope helper and transactional checks as described in the Stage 5.6 documentation. Catalog privilege inspection showed the private workflow functions executable by authenticated and not anon; the public wrappers were likewise not executable by anon and executable by authenticated.

This catalog evidence describes current objects and grants. It does not prove the exact SQL statements or ordering that originally created them.

## 4. Existing history systems — avoid duplicate records

The live database already contains:
- `public.membership_events` — authoritative membership and transfer event history.
- `public.leadership_history` — authoritative leadership succession history.
- `public.leadership_notification_events` — leadership notification/outbox-style events.
- `public.membership_transfer_requests` — operational transfer workflow state.

These are not interchangeable with a future general administrative audit stream. A Phase 5.9 design must avoid copying membership/leadership event histories into a second event ledger. If a general audit stream is later approved, its purpose must be limited to cross-domain administrative/security actions not already adequately represented by those domain records, with explicit correlation references where useful.

At capture, `to_regclass('public.admin_audit_logs')` returned NULL: no such table exists. No Phase 5.9 database object was created.

## 5. Advisor results

The Supabase security advisor returned zero lints. The health advisor returned zero lints. These are point-in-time advisor results and do not replace application-level authorization testing, controlled-account end-to-end testing, or a full release security review.

## 6. Evidence limitations and confidence

| Question | Finding | Confidence |
|---|---|---|
| Are four applied Stage 5.6 sources present in currently accessible Project/Library files? | No candidate found. | High for searched surfaces only |
| Are they absent from the current GitHub migration directory? | Yes. | High |
| Does the live schema contain the resulting membership subsystem? | Yes. | High |
| Can the exact historical SQL for those four entries be reconstructed from the ledger/catalog? | No. | High |
| Is Stage 5.5.2 exact source-to-ledger identity proven? | No; semantic corroboration only. | High |
| Is Stage 5.7 exact source-to-ledger identity proven? | No; semantic corroboration only. | High |
| Is `org_foundation` a verified applied migration? | No ledger entry; repository-only artifact. | High |
| Is this document a restorable database backup? | No. | Certain |

A trusted original SQL file, historical Git object, archived repository, or checksum-bearing deployment record could change these findings. No such evidence was available in this inspection.

## 7. Proposed reconstructed-baseline procedure — for a separate approval

This procedure does not claim to recover historical SQL. It establishes an auditable current-state reference for safe future development while preserving the unresolved historical gaps.

### Step A — Freeze and preserve
1. Preserve this snapshot as a dated evidence record in GitHub.
2. Obtain a proper owner-controlled database backup/export through an approved Supabase backup path before any schema work. The catalog queries in this report are not a substitute.
3. Capture the complete schema-only definition set, including extensions, schemas, enums, domains, tables, views, functions, triggers, policies, grants, constraints and indexes, with hashes.
4. Capture the remote migration ledger separately and hash the exported record.
5. Keep all outputs read-only and access-controlled; exclude secrets and unnecessary personal data.

### Step B — Reconcile
1. Compare the schema-only export with every available repository migration and stage document.
2. Produce an object-to-source matrix: object, current definition, candidate source migration(s), confidence, unresolved differences.
3. Mark objects created by missing migrations as **reconstructed/current-state evidence**, never as recovered historical source.
4. Review the repository-only `org_foundation` file against the applied provisional-geography source and live objects. Keep it quarantined from deployment until its provenance is decided.
5. Keep the Stage 5.5.2 and Stage 5.7 timestamp mismatches unresolved unless trusted original source/checksum evidence is recovered.

### Step C — Establish a forward-only development baseline
1. Propose a version-controlled schema snapshot in a clearly separate recovery/baseline location, not under a historical migration filename and not inserted into the existing applied migration sequence.
2. Preserve the four missing migration ledger entries exactly as they are; do not create fake historical files or alter remote history to make the ledger appear complete.
3. Define and test the intended local/remote workflow using a disposable local database or other no-cost isolated environment. Do not create paid Supabase branches.
4. Demonstrate that the approved workflow does not replay any already-applied migration and does not treat the repository-only artifact as pending production work.
5. Document remaining historical uncertainty and the explicit owner-approved risk acceptance, if any.

### Step D — Formal review and approval gate
Before any database write, present:
- The full schema-only snapshot and checksums.
- The object-to-source reconciliation matrix.
- The four missing historical sources and unresolved filename mismatches.
- The proposed forward-only migration workflow and its dry-run evidence.
- The backup/restore evidence and rollback plan.
- The exact SQL or migration file proposed for any first change.

**No database write is authorized by this report.** A separate, explicit owner approval is required for the exact proposed database operation. Phase 5.9 remains blocked until the migration recovery/baseline gate is formally reassessed and approved.

## 8. Current decision

- Read-only evidence snapshot: **CAPTURED**.
- Original Stage 5.6 SQL sources: **NOT RECOVERED**.
- Reconstructed current-state baseline: **NOT YET CREATED**; only the evidence snapshot and proposed procedure are documented.
- Historical migration synchronization: **NOT PASSED**.
- Supabase schema/history mutation: **NOT AUTHORIZED**.
- Phase 5.9 DDL: **NOT AUTHORIZED**.
- Paid Supabase branches: **NOT CREATED**.

**Next required owner decision:** approve the next read-only preservation/reconciliation package (including a proper schema-only export and object-to-source matrix), or provide a trusted backup containing the original SQL sources. No database changes will be made without a separate explicit approval.
