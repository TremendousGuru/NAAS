# NAASCONNECT Nigeria — Read-Only Object-to-Source Reconciliation Matrix

**Capture date:** 21 November 2026  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`, branch `main`  
**Status:** Read-only reconciliation; no database or migration-history changes  
**Related evidence:** [Read-only evidence snapshot](RECONSTRUCTED_BASELINE_READ_ONLY_EVIDENCE_SNAPSHOT.md) · [Migration source integrity forensic report](MIGRATION_SOURCE_INTEGRITY_FORENSIC_REPORT.md)

## 1. Executive result

The live database catalog contains 14 public tables, 36 public/private functions (15 public, 21 private), 11 non-internal triggers, 25 RLS policies, 85 public indexes and 115 table constraints. RLS is enabled on all 14 public tables. The public/private application object inventory is listed below.

The repository migration directory contains 26 SQL files; the Supabase migration ledger contains 29 applied entries. There are:
- 21 filenames whose timestamp and stage name align exactly with a ledger record;
- 4 ledger entries with no repository SQL source (the four Stage 5.6.0–5.6.3 sources);
- 4 source files with a timestamp mismatch against their ledger version (Stage 5.5.2 and all three Stage 5.7 migrations);
- 1 repository-only SQL artifact with no ledger entry (`20261121133000_org_foundation.sql`).

The matrix distinguishes:
- **Exact filename/ledger alignment:** same migration version and stage name are present in the repository and ledger. This is not a cryptographic checksum of the applied SQL.
- **Semantic source corroboration:** source code and live catalog objects are consistent with the intended feature, but exact applied-source identity is not proven.
- **Repository-only candidate:** file exists in Git but has no matching applied ledger record.
- **Reconstructed/inferred:** the current live object exists, but no trusted applied migration source is available to establish its origin.
- **Missing historical source:** the ledger says a migration was applied, but its SQL body is absent from the current repository and accessible Project/Library files.

## 2. Complete live public-table matrix

| Live table | Known source candidate(s) | Evidence and confidence | Unresolved difference |
|---|---|---|---|
| `org_units` | `20261121133000_org_foundation.sql` (repository-only); later seed/seat records in `20261121130420_stage5_provisional_geography_admin_seats.sql` | **High** that the repository-only file defines the live table shape; live table has expected hierarchy columns, 24 rows, constraints, indexes, policies and triggers. **Low** for historical application provenance. | No applied ledger entry for `org_foundation`. Earliest ledger migration depends on `org_units` and private helpers existing already. Origin may be an untracked/manual baseline or another unavailable source. |
| `org_memberships` | `20261121133000_org_foundation.sql` (repository-only); missing applied Stage 5.6.0; applied Stage 5.6.4 and later Stage 5.6 hardening | **High** that repository-only source defines the initial membership table; live catalog confirms additional status reason/actor/time columns and indexes. | Foundation source is not in ledger. Missing Stage 5.6.0 source prevents exact attribution of membership transfer/history additions and initial membership hardening. Later source files visibly alter lifecycle behavior. |
| `org_admin_seats` | `20261121130420_stage5_provisional_geography_admin_seats.sql` | **High**: exact filename/version match; file creates table, policy, index and seed/seat records; live table has expected structure. | Applied SQL body/checksum is not exposed by the ledger. |
| `profiles` | `20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | **High**: exact filename/version match; source creates profiles and onboarding auth hook; live table exists. | Later policy/index changes in 5.2.1 and possible onboarding refinements are applied sources whose exact details should be verified from full file contents during the final schema export. |
| `org_applications` | `20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | **High**: exact filename/version match; source creates application table; live table and associated RLS policies exist. | Exact applied-source checksum unavailable. |
| `admin_appointment_requests` | `20261121132238_stage5_3_admin_appointment_approval_engine.sql`; `20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql` | **High**: exact ledger/source version matches; source creates table and RPCs; hardening file replaces wrappers; live table, policy, trigger and RPCs exist. | Exact applied-source checksum unavailable. |
| `org_leadership_positions` | `20261121134717_stage5_4_leadership_handover_executive_management.sql` | **High**: exact filename/version match; file creates leadership position table; live table, trigger, policy and indexes exist. | Later stage files harden workflow and index behavior; full snapshot must retain final definitions rather than treating initial source as current final state. |
| `leadership_handover_requests` | `20261121134717_stage5_4_leadership_handover_executive_management.sql` | **High**: exact filename/version match; source creates handover workflow table; live table, policy, trigger and constraints exist. | Later Stage 5.4.1/5.4.2/5.4.5 change review/security behavior; exact applied SQL identity still not checksum-proven. |
| `leadership_history` | `20261121134717_stage5_4_leadership_handover_executive_management.sql` | **High**: exact filename/version match; source creates succession history; live table and policy/indexes exist. | Remains authoritative leadership succession history; must not be duplicated in a generic audit stream. |
| `leadership_notification_events` | `20261121134717_stage5_4_leadership_handover_executive_management.sql` | **High**: exact filename/version match; source creates notification event table; live table and policy/indexes exist. | Existing leadership notification history/outbox records must remain distinct from a general audit stream. |
| `org_executive_portfolios` | `20261121140551_stage5_5_executive_portfolios_directory_term_management.sql` | **High**: exact filename/version match; source creates portfolio table and sync/directory RPCs; live table, trigger, policy and indexes exist. | Stage 5.5.1 hardens directory RPC; Stage 5.5.2 has a filename timestamp mismatch. |
| `membership_transfer_requests` | Missing applied Stage 5.6.0 source `20261121142038`; subsequent hardening `20261121145919` and index `20261121145933` | **High** that live transfer workflow table exists and later source files alter it; **low** for exact original table-definition provenance. | Original table-creation source not recovered. 5.6.1, 5.6.2 and 5.6.3 sources also missing. |
| `membership_events` | Missing applied Stage 5.6.0 source `20261121142038`; later indexes/reporting in `20261121150817` | **High** that live event table exists and is used by later reporting source; **low** for exact original definition provenance. | Original table-creation source not recovered. This is authoritative membership/transfer history and must not be duplicated by V1 Phase 5.9. |
| `community_statuses` | Ledger `20261121152734`; repository `20261121162500_stage5_7_global_community_statuses.sql`; hardening files `20261121162600`, `20261121162700` | **High** semantic corroboration: repository files define table/policy/index/grant behavior and live table/policies/indexes/grants reflect that feature. | Three repository timestamps do not match ledger versions `20261121152734`, `20261121152827`, `20261121152909`. No applied SQL body/checksum is exposed, so exact identity remains unproven. |

## 3. Migration ledger-to-repository crosswalk

| Applied ledger version | Ledger migration name | Repository source | Status |
|---|---|---|---|
| `20261121130420` | `stage5_provisional_geography_admin_seats` | `20261121130420_stage5_provisional_geography_admin_seats.sql` | Exact filename/version alignment |
| `20261121131034` | `stage5_2_profiles_org_applications_member_onboarding` | `20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | Exact filename/version alignment |
| `20261121131101` | `stage5_2_1_onboarding_policy_and_fk_indexes` | `20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql` | Exact filename/version alignment |
| `20261121131109` | `stage5_2_2_limit_self_membership_to_campus_church` | `20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql` | Exact filename/version alignment |
| `20261121132238` | `stage5_3_admin_appointment_approval_engine` | `20261121132238_stage5_3_admin_appointment_approval_engine.sql` | Exact filename/version alignment |
| `20261121132415` | `stage5_3_1_harden_admin_appointment_rpc_wrappers` | `20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql` | Exact filename/version alignment |
| — | — | `20261121133000_org_foundation.sql` | Repository-only; no ledger record |
| `20261121134717` | `stage5_4_leadership_handover_executive_management` | `20261121134717_stage5_4_leadership_handover_executive_management.sql` | Exact filename/version alignment |
| `20261121134728` | `stage5_4_1_handover_security_and_review_fixes` | `20261121134728_stage5_4_1_handover_security_and_review_fixes.sql` | Exact filename/version alignment |
| `20261121134737` | `stage5_4_2_president_role_revocation_fix` | `20261121134737_stage5_4_2_president_role_revocation_fix.sql` | Exact filename/version alignment |
| `20261121134747` | `stage5_4_3_leadership_fk_indexes` | `20261121134747_stage5_4_3_leadership_fk_indexes.sql` | Exact filename/version alignment |
| `20261121134806` | `stage5_4_4_revoke_public_private_rpc_execution` | `20261121134806_stage5_4_4_revoke_public_private_rpc_execution.sql` | Exact filename/version alignment |
| `20261121134918` | `stage5_4_5_approver_inbox_and_platform_announcements` | `20261121134918_stage5_4_5_approver_inbox_and_platform_announcements.sql` | Exact filename/version alignment |
| `20261121140551` | `stage5_5_executive_portfolios_directory_term_management` | `20261121140551_stage5_5_executive_portfolios_directory_term_management.sql` | Exact filename/version alignment |
| `20261121140620` | `stage5_5_1_harden_directory_rpc_and_fk_indexes` | `20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes.sql` | Exact filename/version alignment |
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | `20261121140642_stage5_5_2_scoped_executive_term_updates.sql` | Timestamp mismatch; semantic corroboration only |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | Missing | Applied source not recovered |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | Missing | Applied source not recovered |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | Missing | Applied source not recovered |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | Missing | Applied source not recovered |
| `20261121145523` | `stage5_6_4_membership_status_lifecycle` | `20261121145523_stage5_6_4_membership_status_lifecycle.sql` | Exact filename/version alignment |
| `20261121145544` | `stage5_6_4_membership_status_actor_index` | `20261121145544_stage5_6_4_membership_status_actor_index.sql` | Exact filename/version alignment |
| `20261121145638` | `stage5_6_4_1_reject_null_status_action` | `20261121145638_stage5_6_4_1_reject_null_status_action.sql` | Exact filename/version alignment |
| `20261121145919` | `stage5_6_5_transfer_cancellation_and_rejection_hardening` | `20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql` | Exact filename/version alignment |
| `20261121145933` | `stage5_6_5_1_cancelled_by_fk_index` | `20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql` | Exact filename/version alignment |
| `20261121150236` | `stage5_6_6_scoped_membership_directory_and_statistics` | `20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.sql` | Exact filename/version alignment |
| `20261121150817` | `stage5_6_7_org_membership_review_queues_and_reporting` | `20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql` | Exact filename/version alignment |
| `20261121152734` | `stage5_7_global_community_statuses` | `20261121162500_stage5_7_global_community_statuses.sql` | Timestamp mismatch; semantic corroboration only |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` | Timestamp mismatch; semantic corroboration only |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` | Timestamp mismatch; semantic corroboration only |

## 4. Complete live function inventory and source candidates

### Private schema — 21 functions

| Function | Source candidate / status |
|---|---|
| `can_administer_org(uuid)` | Repository-only `org_foundation`; no applied ledger source identified |
| `touch_updated_at()` | Repository-only `org_foundation`; no applied ledger source identified |
| `validate_org_parent()` | Repository-only `org_foundation`; no applied ledger source identified |
| `validate_membership_role()` | Repository-only `org_foundation`; no applied ledger source identified |
| `handle_new_auth_user()` | Applied Stage 5.2 onboarding source |
| `submit_admin_appointment(uuid,text,text)` | Applied Stage 5.3; wrapper hardened in 5.3.1 |
| `review_admin_appointment(uuid,text,text)` | Applied Stage 5.3; wrapper hardened in 5.3.1 |
| `can_approve_leadership_handover(uuid,uuid,uuid)` | Applied Stage 5.4 leadership foundation |
| `submit_leadership_handover(uuid,text,text,uuid,text)` | Applied Stage 5.4 leadership foundation |
| `review_leadership_handover(uuid,text,text)` | Applied Stage 5.4 foundation; later 5.4.1, 5.4.2 and 5.4.5 refinements |
| `sync_executive_portfolio_position()` | Applied Stage 5.5 executive portfolio source |
| `save_executive_portfolio(...)` | Applied Stage 5.5; source hardening in 5.5.1 |
| `get_org_executive_directory(uuid)` | Applied Stage 5.5; source hardening in 5.5.1 |
| `set_executive_term(uuid,timestamptz,text)` | Stage 5.5.2 source exists with mismatched filename timestamp |
| `review_membership_transfer(uuid,text,text)` | Missing applied Stage 5.6.3 source; later modified by Stage 5.6.5 source |
| `cancel_membership_transfer(uuid,text)` | Applied Stage 5.6.5 source |
| `manage_membership_status(uuid,text,text)` | Applied Stage 5.6.4 and 5.6.4.1 sources |
| `get_scoped_membership_directory(uuid,text,text,integer,integer)` | Applied Stage 5.6.6 source |
| `get_scoped_membership_statistics(uuid)` | Applied Stage 5.6.6 source |
| `get_membership_review_queue(uuid,text,timestamptz,timestamptz,integer,integer)` | Applied Stage 5.6.7 source |
| `get_membership_activity_report(uuid,timestamptz,timestamptz)` | Applied Stage 5.6.7 source |

### Public schema — 15 functions

Fourteen public functions are SECURITY INVOKER wrappers for the corresponding private workflows above:
- `cancel_membership_transfer`
- `get_membership_activity_report`
- `get_membership_review_queue`
- `get_org_executive_directory`
- `get_scoped_membership_directory`
- `get_scoped_membership_statistics`
- `manage_membership_status`
- `review_admin_appointment`
- `review_leadership_handover`
- `review_membership_transfer`
- `save_executive_portfolio`
- `set_executive_term`
- `submit_admin_appointment`
- `submit_leadership_handover`

The remaining public function is `rls_auto_enable()`, an infrastructure/extension helper rather than a NAASCONNECT domain workflow. Its owning extension/source should be confirmed in the complete schema-only export before classifying it as project-authored.

## 5. Complete live trigger inventory — 11 non-internal triggers

| Table | Trigger | Candidate source |
|---|---|---|
| `admin_appointment_requests` | `set_admin_appointment_updated_at` | Stage 5.3 source; trigger helper provenance to be confirmed |
| `community_statuses` | None | Stage 5.7 source creates no user trigger |
| `leadership_handover_requests` | `leadership_handover_touch_updated_at` | Stage 5.4 source |
| `leadership_history` | None | Stage 5.4 source |
| `leadership_notification_events` | None | Stage 5.4 source |
| `membership_events` | None | Missing Stage 5.6.0 source provenance unresolved |
| `membership_transfer_requests` | None | Missing Stage 5.6.0 source provenance unresolved |
| `org_admin_seats` | `org_admin_seats_touch_updated_at` | Stage 5.1 applied source; helper definition candidate is repository-only org foundation |
| `org_applications` | `org_applications_touch_updated_at` | Stage 5.2 applied source |
| `org_executive_portfolios` | `sync_executive_portfolio_position` | Stage 5.5 applied source |
| `org_leadership_positions` | `leadership_positions_touch_updated_at` | Stage 5.4 applied source |
| `org_memberships` | `org_memberships_touch_updated_at`, `org_memberships_validate_role` | Repository-only org foundation candidate; later status changes in missing Stage 5.6.0 and applied Stage 5.6.4 sources |
| `org_units` | `org_units_touch_updated_at`, `org_units_validate_parent` | Repository-only org foundation candidate |
| `profiles` | `profiles_touch_updated_at` | Stage 5.2 applied source |

## 6. RLS policy inventory — 25 policies

| Table | Live policy names | Candidate source |
|---|---|---|
| `admin_appointment_requests` | Nominees and jurisdiction admins read appointment requests | Stage 5.3 |
| `community_statuses` | Authenticated users read unexpired community statuses; Authors or scoped admins delete statuses; Members and scoped admins create statuses | Stage 5.7 source family (timestamps mismatched) |
| `leadership_handover_requests` | Participants and approving leaders read handover requests | Stage 5.4 |
| `leadership_history` | Scoped leaders read leadership history | Stage 5.4 |
| `leadership_notification_events` | Members and approvers read leadership notifications | Stage 5.4 |
| `membership_events` | Members and scoped admins view membership history | Missing Stage 5.6.0 source provenance unresolved |
| `membership_transfer_requests` | Members and scoped admins view transfer requests; Members request their own membership transfers | Missing Stage 5.6.0 source provenance unresolved |
| `org_admin_seats` | Scoped administrators view admin seats | Stage 5.1 |
| `org_applications` | Applicants and jurisdiction admins read applications; Applicants create their own organization applications; Jurisdiction admins review applications | Stage 5.2 |
| `org_executive_portfolios` | Active organization members read executive portfolios | Stage 5.5 |
| `org_leadership_positions` | Members and scoped leaders read leadership positions | Stage 5.4 |
| `org_memberships` | Members see own membership and scoped membership rosters; Scoped administrators or users request membership; Scoped administrators update memberships | Repository-only org foundation candidate plus later Stage 5.2/5.6 changes; provenance needs source-level reconciliation |
| `org_units` | Active organizations visible to signed-in members; Scoped administrators create child organizations; Scoped administrators update organizations | Repository-only org foundation candidate |
| `profiles` | Users create own profile; Users read own profile; Users update own profile | Stage 5.2 |

## 7. Index and constraint inventory totals

The live public catalog contains **85 indexes** and **115 constraints** across the 14 public tables. The per-table distribution below is the complete count inventory from the read-only catalog capture; names and definitions must be preserved in the forthcoming schema-only export.

| Table | Indexes | Constraints |
|---|---:|---:|
| `admin_appointment_requests` | 6 | 8 |
| `community_statuses` | 4 | 6 |
| `leadership_handover_requests` | 8 | 12 |
| `leadership_history` | 7 | 8 |
| `leadership_notification_events` | 5 | 5 |
| `membership_events` | 7 | 7 |
| `membership_transfer_requests` | 9 | 12 |
| `org_admin_seats` | 4 | 8 |
| `org_applications` | 5 | 9 |
| `org_executive_portfolios` | 5 | 10 |
| `org_leadership_positions` | 7 | 9 |
| `org_memberships` | 8 | 9 |
| `org_units` | 6 | 9 |
| `profiles` | 4 | 3 |
| **Total** | **85** | **115** |

All 14 public tables have RLS enabled. None has FORCE ROW LEVEL SECURITY enabled. This is a metadata snapshot, not a complete behavioral security test.

## 8. Source confidence and discrepancy register

| ID | Discrepancy | Confidence / impact | Required resolution |
|---|---|---|---|
| D-01 | Four applied Stage 5.6.0–5.6.3 sources missing | Confirmed; high impact | Recover originals from trusted archive/clone or explicitly approve a separately labelled reconstructed forward baseline |
| D-02 | `org_foundation` is repository-only while its objects exist live and later applied migrations depend on them | Confirmed; critical provenance gap | Determine whether it was applied outside ledger, existed in an earlier baseline, or has another historical source; do not replay |
| D-03 | Stage 5.5.2 file timestamp differs from ledger version | Confirmed; medium | Recover trusted original or deployment checksum; no rename based on semantic similarity |
| D-04 | Three Stage 5.7 file timestamps differ from ledger versions | Confirmed; medium | Recover trusted original/checksum or retain explicit semantic-only confidence |
| D-05 | Ledger does not expose original applied SQL body/checksum | Confirmed; systemic | Obtain trusted deployment artifacts/logs if available; exact historical identity cannot be proven from ledger metadata alone |
| D-06 | Public function `rls_auto_enable()` ownership not attributed to NAAS migration sources | Catalog-confirmed; low/medium | Identify owning extension/schema source in full schema-only export |
| D-07 | Some current policies/indexes/triggers reflect hardening migrations and final-state catalog rather than a single creation migration | Confirmed; medium | Preserve final definitions and map each object to all creating/altering sources in schema-only export review |

## 9. Domain history and no-duplication boundaries

These live tables remain authoritative for their own domains:
- `membership_events`: membership lifecycle and transfer event history.
- `leadership_history`: leadership succession history.
- `leadership_notification_events`: leadership handover notification events.
- `membership_transfer_requests`: active transfer workflow state.

V1 Phase 5.9 must not mirror these histories into a second generic audit stream. The Phase 5.9 design document remains design-only and is not authorized for implementation by this reconciliation.

## 10. What this matrix does and does not establish

Established:
- Current live object names and counts in the inspected public/private schemas.
- Current table-to-source candidates based on actual repository SQL content, ledger metadata, and live catalog corroboration.
- Which migration filenames align exactly, mismatch, are missing, or are repository-only.
- Current RLS enablement, trigger, function, policy, index and constraint inventory at the time of capture.

Not established:
- The exact bytes/checksum of any historical SQL as executed in Supabase.
- The exact creation source for `org_units` and `org_memberships` (because the only full foundation candidate has no ledger record).
- That the repository-only `org_foundation` file was ever applied to this database.
- A restorable backup or complete schema-only export.
- Controlled-account positive authorization behavior across every hierarchy level.
- That all current database objects are fully explained by the 26 current repository SQL files.

## 11. Next read-only preservation package

Before any database change, the next package should include:
1. An owner-controlled, restorable Supabase backup/export.
2. A complete schema-only export with extensions, schemas, types, tables, views, functions, triggers, policies, grants, constraints and indexes.
3. Cryptographic hashes of the export and the remote migration ledger capture.
4. A per-object source map that records every known CREATE/ALTER source and confidence level.
5. A no-write dry-run plan for local baseline reconciliation, with no paid Supabase branches and no remote migration-history edits.
6. A separate approval request showing the exact proposed first database operation, if any.

**No database write is authorized by this document.** A separate explicit owner approval is required before any DDL, DML, migration operation, ledger change, branch creation, or Phase 5.9 implementation.

## 12. Current disposition

- Read-only object-to-source matrix: **PREPARED**.
- Four original Stage 5.6 sources: **NOT RECOVERED**.
- Repository-only `org_foundation` provenance: **UNRESOLVED**.
- Stage 5.5.2 / Stage 5.7 exact source identity: **UNPROVEN**.
- Historical migration synchronization gate: **NOT PASSED**.
- Supabase schema/history writes: **NOT AUTHORIZED**.
- Phase 5.9 DDL: **NOT AUTHORIZED**.
- Paid Supabase branches: **NOT CREATED**.
