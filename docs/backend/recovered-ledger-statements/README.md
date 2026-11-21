# Recovered SQL Payloads from the Remote Supabase Migration Ledger

**Project:** NAASCONNECT Nigeria  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Capture method:** Read-only SELECT from `supabase_migrations.schema_migrations`  
**Captured:** 21 November 2026  
**Disposition:** Applied SQL statement payloads preserved as evidence only; do not replay.

## Evidence meaning

The remote migration ledger contains a `statements` text-array column. A read-only inspection found that all **29** ledger rows contain exactly **one** SQL statement payload. The SQL text returned by `statements[1]` is the SQL statement payload stored for that applied migration entry.

This is stronger than reconstructing from current catalog objects. It preserves the submitted SQL statement content recorded in the ledger. It does **not** guarantee byte-for-byte recovery of the original local `.sql` file, including comments, filename, local file formatting, or original Git blob.

## Recovered payload archive

Seventeen ledger payloads were preserved as individual files in this directory. They comprise:
- 8 ledger entries without an exact same-version source filename (including all four missing Stage 5.6 sources and the four timestamp-shifted Stage 5.5.2/5.7 candidates).
- 9 additional same-version/name entries whose active repository SQL did not match the ledger payload after comments and whitespace were removed.

| Ledger version | Ledger name | SQL chars | Comparison / reason |
|---|---|---:|---|
| `20261121130420` | `stage5_provisional_geography_admin_seats` | 6359 | same-version file differs |
| `20261121132238` | `stage5_3_admin_appointment_approval_engine` | 5430 | same-version file differs |
| `20261121132415` | `stage5_3_1_harden_admin_appointment_rpc_wrappers` | 3873 | same-version file differs |
| `20261121134717` | `stage5_4_leadership_handover_executive_management` | 17680 | same-version file differs |
| `20261121134728` | `stage5_4_1_handover_security_and_review_fixes` | 5669 | same-version file differs |
| `20261121134737` | `stage5_4_2_president_role_revocation_fix` | 4986 | same-version file differs |
| `20261121140551` | `stage5_5_executive_portfolios_directory_term_management` | 8072 | same-version file differs |
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | 1884 | timestamp-shifted candidate matches after whitespace/comment normalization |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | 5408 | no same-version source file |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | 177 | no same-version source file |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | 750 | no same-version source file |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | 7761 | no same-version source file |
| `20261121150236` | `stage5_6_6_scoped_membership_directory_and_statistics` | 10027 | same-version file differs |
| `20261121150817` | `stage5_6_7_org_membership_review_queues_and_reporting` | 10089 | same-version file differs |
| `20261121152734` | `stage5_7_global_community_statuses` | 2234 | timestamp-shifted candidate matches after comment/whitespace normalization |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | 1307 | timestamp-shifted candidate matches after comment/whitespace normalization |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | 135 | timestamp-shifted candidate matches after comment/whitespace normalization |

## Full 29-row comparison result

- Remote ledger rows: **29**.
- Ledger rows with exactly one stored SQL statement: **29**.
- Current active `supabase/migrations/` SQL files: **26**.
- Same-version/name source files: **21**.
- Of those 21, **12** match the ledger SQL after removing line comments and normalizing whitespace.
- Of those 21, **9** differ from the ledger SQL after that normalization; their ledger payloads are preserved here.
- The four timestamp-shifted Stage 5.5.2/5.7 candidates all match their ledger payloads after comment/whitespace normalization.
- The four missing Stage 5.6 source files have their SQL statement payloads recovered directly from the ledger.
- The repository-only `org_foundation` file has no matching ledger row and remains a separate baseline-provenance issue.

The comparison is textual normalization, not a PostgreSQL parser or semantic equivalence proof. Any differing source file must be reviewed against the recovered ledger payload; do not silently overwrite it.

## Safety

- Every recovered payload is stored under `docs/backend/recovered-ledger-statements/`, outside `supabase/migrations/`.
- No recovered payload was applied or replayed.
- No migration ledger row was edited.
- No schema, data, function, branch, or paid resource was changed.
- Do not copy these files into the active migration directory or run them against any database.
- NAASCONNECT V1.0 remains the source of truth.
