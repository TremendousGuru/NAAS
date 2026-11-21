# NAASCONNECT Phase 5.9 — 29-Entry Migration Reconciliation Register

**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Remote ledger snapshot:** 21 November 2026, read-only  
**Authority:** NAASCONNECT Nigeria V1.0  
**Status:** Source evidence mapped; final local validation and preservation exports outstanding.

## Executive result

The remote ledger contains **29 applied entries**, each with exactly one SQL statement in its `statements` array. The active repository contains **26 migration files**.

The reconciliation is:

- **12** same-version/name repository files match their ledger SQL after comments and whitespace are normalized.
- **9** same-version/name repository files differ from the stored ledger SQL after that normalization. The exact ledger payloads are preserved under `docs/backend/recovered-ledger-statements/`.
- **4** timestamp-shifted repository candidates (Stage 5.5.2 and Stage 5.7.0–5.7.2) match their ledger payload after comment/whitespace normalization.
- **4** original Stage 5.6 local migration files are absent, but their applied SQL payloads are recovered from the ledger.
- **17** ledger SQL payloads are preserved individually in the recovered-ledger archive (the 8 previously unmatched entries plus 9 divergent same-version files).

A normalized textual match is not byte-for-byte proof of the original local file. Ledger statement payloads are the best available evidence of the SQL recorded for each applied entry.

## Complete ordered mapping

| Ledger version | Ledger name | Current repository source | Classification | Ledger payload evidence |
|---|---|---|---|---|
| `20261121130420` | `stage5_provisional_geography_admin_seats` | `supabase/migrations/20261121130420_stage5_provisional_geography_admin_seats.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121130420_stage5_provisional_geography_admin_seats.ledger-recovered.sql` |
| `20261121131034` | `stage5_2_profiles_org_applications_member_onboarding` | `supabase/migrations/20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | MATCH_NORMALIZED | — |
| `20261121131101` | `stage5_2_1_onboarding_policy_and_fk_indexes` | `supabase/migrations/20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql` | MATCH_NORMALIZED | — |
| `20261121131109` | `stage5_2_2_limit_self_membership_to_campus_church` | `supabase/migrations/20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql` | MATCH_NORMALIZED | — |
| `20261121132238` | `stage5_3_admin_appointment_approval_engine` | `supabase/migrations/20261121132238_stage5_3_admin_appointment_approval_engine.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121132238_stage5_3_admin_appointment_approval_engine.ledger-recovered.sql` |
| `20261121132415` | `stage5_3_1_harden_admin_appointment_rpc_wrappers` | `supabase/migrations/20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.ledger-recovered.sql` |
| `20261121134717` | `stage5_4_leadership_handover_executive_management` | `supabase/migrations/20261121134717_stage5_4_leadership_handover_executive_management.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121134717_stage5_4_leadership_handover_executive_management.ledger-recovered.sql` |
| `20261121134728` | `stage5_4_1_handover_security_and_review_fixes` | `supabase/migrations/20261121134728_stage5_4_1_handover_security_and_review_fixes.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121134728_stage5_4_1_handover_security_and_review_fixes.ledger-recovered.sql` |
| `20261121134737` | `stage5_4_2_president_role_revocation_fix` | `supabase/migrations/20261121134737_stage5_4_2_president_role_revocation_fix.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121134737_stage5_4_2_president_role_revocation_fix.ledger-recovered.sql` |
| `20261121134747` | `stage5_4_3_leadership_fk_indexes` | `supabase/migrations/20261121134747_stage5_4_3_leadership_fk_indexes.sql` | MATCH_NORMALIZED | — |
| `20261121134806` | `stage5_4_4_revoke_public_private_rpc_execution` | `supabase/migrations/20261121134806_stage5_4_4_revoke_public_private_rpc_execution.sql` | MATCH_NORMALIZED | — |
| `20261121134918` | `stage5_4_5_approver_inbox_and_platform_announcements` | `supabase/migrations/20261121134918_stage5_4_5_approver_inbox_and_platform_announcements.sql` | MATCH_NORMALIZED | — |
| `20261121140551` | `stage5_5_executive_portfolios_directory_term_management` | `supabase/migrations/20261121140551_stage5_5_executive_portfolios_directory_term_management.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121140551_stage5_5_executive_portfolios_directory_term_management.ledger-recovered.sql` |
| `20261121140620` | `stage5_5_1_harden_directory_rpc_and_fk_indexes` | `supabase/migrations/20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes.sql` | MATCH_NORMALIZED | — |
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | `supabase/migrations/20261121140642_stage5_5_2_scoped_executive_term_updates.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121140749_stage5_5_2_scoped_executive_term_updates.ledger-recovered.sql` |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121142038_stage5_6_membership_transfer_and_history_foundation.ledger-recovered.sql` |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc.ledger-recovered.sql` |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121142125_stage5_6_2_membership_fk_performance_indexes.ledger-recovered.sql` |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | `— original file absent` | MISSING_FILE_LEDGER_SQL_RECOVERED | `docs/backend/recovered-ledger-statements/20261121145225_stage5_6_3_transactional_membership_transfer_review.ledger-recovered.sql` |
| `20261121145523` | `stage5_6_4_membership_status_lifecycle` | `supabase/migrations/20261121145523_stage5_6_4_membership_status_lifecycle.sql` | MATCH_NORMALIZED | — |
| `20261121145544` | `stage5_6_4_membership_status_actor_index` | `supabase/migrations/20261121145544_stage5_6_4_membership_status_actor_index.sql` | MATCH_NORMALIZED | — |
| `20261121145638` | `stage5_6_4_1_reject_null_status_action` | `supabase/migrations/20261121145638_stage5_6_4_1_reject_null_status_action.sql` | MATCH_NORMALIZED | — |
| `20261121145919` | `stage5_6_5_transfer_cancellation_and_rejection_hardening` | `supabase/migrations/20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql` | MATCH_NORMALIZED | — |
| `20261121145933` | `stage5_6_5_1_cancelled_by_fk_index` | `supabase/migrations/20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql` | MATCH_NORMALIZED | — |
| `20261121150236` | `stage5_6_6_scoped_membership_directory_and_statistics` | `supabase/migrations/20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.ledger-recovered.sql` |
| `20261121150817` | `stage5_6_7_org_membership_review_queues_and_reporting` | `supabase/migrations/20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql` | DIVERGENT | `docs/backend/recovered-ledger-statements/20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.ledger-recovered.sql` |
| `20261121152734` | `stage5_7_global_community_statuses` | `supabase/migrations/20261121162500_stage5_7_global_community_statuses.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121152734_stage5_7_global_community_statuses.ledger-recovered.sql` |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | `supabase/migrations/20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121152827_stage5_7_1_status_policy_and_fk_index_hardening.ledger-recovered.sql` |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | `supabase/migrations/20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` | TIMESTAMP_SHIFT_CANDIDATE_MATCH | `docs/backend/recovered-ledger-statements/20261121152909_stage5_7_2_restrict_authenticated_status_table_grants.ledger-recovered.sql` |

## Repository-only baseline artifact

`supabase/migrations/20261121133000_org_foundation.sql` has no corresponding migration ledger row. PostgreSQL logs record the actual out-of-band foundation execution at 2026-11-21 12:28:48.007 UTC and follow-up indexes at 12:29:14.311 UTC, via `POST /mcp`. Those exact logged SQL payloads are preserved under `docs/backend/recovered-baseline-logs/`. The committed repository file is related but not byte-identical to the logged statements. See [out-of-band foundation provenance](recovered-baseline-logs/README.md).

## Divergence review flags

The nine divergent same-version files are not merely whitespace differences. Examples visible in the compared SQL include:
- Stage 5.1 repository file contains an additional update setting provisional union/zone status to pending that is absent from the ledger payload.
- Stage 5.3 repository file adds a lower-case email check and changes FK delete behavior relative to the ledger payload.
- Stage 5.3.1 repository file changes review error handling/messages.
- Stage 5.4 repository file differs in approval-organization handling for root organizations.
- Stage 5.4.1 ledger payload contains a self-approval prohibition that is absent from the current repository candidate.
- Stage 5.4.2 repository candidate contains a public wrapper not present in the ledger payload.
- Stage 5.5 repository policy source differs from the ledger payload.
- Stage 5.6.6 and 5.6.7 directory/reporting SQL differ from the applied ledger statements.

The ledger-recovered SQL must be reviewed as the historical applied statement. Do not silently overwrite the active repository files or treat the current repository copy as the applied source.

## What this register does and does not authorize

This register maps the applied SQL source evidence for all 29 ledger entries. It does not repair the active migration directory and does not authorize renames, deletes, edits, ledger changes, migration replay, `db push`, or any Supabase DDL/DML.

The recovered payload archive and the out-of-band foundation log archive remain outside `supabase/migrations/`. Do not move them into the migration runner.

## Remaining Phase 5.9 integrity gate

1. Obtain a complete schema-only export and verify its archive listing and SHA-256 manifest.
2. Obtain and verify a separate full restorable backup.
3. Have the owner review and approve this 29-entry mapping, especially the nine divergent same-version files and the out-of-band baseline distinction.
4. Perform a non-mutating local validation/migration-list dry run against a controlled source copy, confirming that no applied migration would be replayed and all 29 ledger rows are accounted for. Do not run `db push`, `migration repair`, or `apply_migration`.
5. Complete Phase 5.9 P1 audit-governance decisions before implementation.

**Database-write approval gate: CLOSED.** Passing this evidence review does not itself authorize a database write. NAASCONNECT V1.0 remains the source of truth.
