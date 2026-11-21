# NAASCONNECT Phase 5.9 — Remote Ledger SQL Statement Recovery Addendum

**Project:** NAASCONNECT Nigeria  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Captured:** 21 November 2026  
**Method:** Read-only SELECT from `supabase_migrations.schema_migrations`  
**Disposition:** Applied SQL statement payloads recovered for all eight previously unmatched ledger entries. No database writes.

## 1. Correction to earlier forensic finding

The earlier migration-source forensic report described the remote ledger as exposing only version/name metadata. A subsequent read-only inspection of `information_schema.columns` found that `supabase_migrations.schema_migrations` also has `statements` (text array), `created_by`, `idempotency_key`, and `rollback` columns.

A read-only count showed all 29 ledger rows have exactly one stored SQL statement payload. Therefore the earlier statement that the ledger did not retain SQL bodies was incomplete and is corrected by this addendum.

The `statements[1]` values are the SQL statement payloads recorded in the remote migration ledger for each applied entry. They preserve the submitted SQL content, but should not be described as byte-for-byte copies of original local migration files: original comments and local file formatting may not be retained.

## 2. Recovered unmatched ledger entries

Eight previously unmatched ledger payloads were retrieved and committed under `docs/backend/recovered-ledger-statements/`:

| Ledger version | Name | SQL characters | Evidence |
|---|---|---:|---|
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | 1,884 | [Recovered payload](recovered-ledger-statements/20261121140749_stage5_5_2_scoped_executive_term_updates.ledger-recovered.sql) |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | 5,408 | [Recovered payload](recovered-ledger-statements/20261121142038_stage5_6_membership_transfer_and_history_foundation.ledger-recovered.sql) |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | 177 | [Recovered payload](recovered-ledger-statements/20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc.ledger-recovered.sql) |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | 750 | [Recovered payload](recovered-ledger-statements/20261121142125_stage5_6_2_membership_fk_performance_indexes.ledger-recovered.sql) |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | 7,761 | [Recovered payload](recovered-ledger-statements/20261121145225_stage5_6_3_transactional_membership_transfer_review.ledger-recovered.sql) |
| `20261121152734` | `stage5_7_global_community_statuses` | 2,234 | [Recovered payload](recovered-ledger-statements/20261121152734_stage5_7_global_community_statuses.ledger-recovered.sql) |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | 1,307 | [Recovered payload](recovered-ledger-statements/20261121152827_stage5_7_1_status_policy_and_fk_index_hardening.ledger-recovered.sql) |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | 135 | [Recovered payload](recovered-ledger-statements/20261121152909_stage5_7_2_restrict_authenticated_status_table_grants.ledger-recovered.sql) |

## 3. Timestamp-shifted source comparison

The four timestamp-shifted repository candidates were compared with the corresponding ledger-recovered SQL payloads:

- Stage 5.5.2 candidate `20261121140642_stage5_5_2_scoped_executive_term_updates.sql`: exact file text differs because of comments/whitespace; SQL text matches after removing comments and whitespace.
- Stage 5.7.0 candidate `20261121162500_stage5_7_global_community_statuses.sql`: SQL text matches after removing comments and normalizing whitespace.
- Stage 5.7.1 candidate `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql`: SQL text matches after removing comments and normalizing whitespace.
- Stage 5.7.2 candidate `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql`: SQL text matches after removing comments and normalizing whitespace.

This materially resolves the applied SQL content for those four mismatches. The timestamp discrepancy remains a repository-history/provenance issue; do not rename files or edit the remote ledger.

## 4. Impact on the four Stage 5.6 reconstructed files

The owner-approved reconstructed files remain preserved as a record of the reconstruction exercise. However, the ledger-recovered Stage 5.6 SQL payloads now supersede them for historical applied-SQL evidence.

In particular, the recovered Stage 5.6.1 payload is only the policy removal and authenticated UPDATE revoke. It is not the broader policy reconstruction in the draft. The recovered Stage 5.6.3 payload is the original ledger-recorded review function, not the later Stage 5.6.5 hardened function body used in the draft. Do not treat the reconstructed drafts as a substitute for the recovered ledger payloads.

## 5. Updated migration reconciliation status

- Remote ledger: 29 rows; all 29 contain one SQL statement payload.
- Current active repository migration directory: 26 files.
- Exact same-version/name repository file matches: 21.
- Previously unmatched ledger entries: 8; all 8 applied SQL payloads now recovered from the remote ledger.
- Timestamp-shifted repository candidates: 4; all 4 SQL bodies match their ledger payload after comment/whitespace normalization.
- Repository-only `org_foundation`: still has no ledger row; its execution is not proven by this ledger.
- Four missing Stage 5.6 original local file wrappers/comments remain unrecovered, but their applied SQL payloads are recovered from the remote ledger.

A complete comparison of the 21 same-version repository files against their respective ledger statement payloads remains a final source-integrity check before declaring the ordered source set fully reconciled.

## 6. Remaining work and safety

Still required:
1. Compare all 21 same-version/name repository SQL files against the 21 corresponding ledger statement payloads.
2. Resolve/document `org_foundation` as an out-of-band baseline, including who/when/how it was executed or formally accepted.
3. Obtain and verify the complete schema-only export and SHA-256 manifest.
4. Obtain/verify the separate full restorable backup.
5. Complete a non-mutating migration-list/dry-run validation against the final ordered evidence set.
6. Complete Phase 5.9 P1 audit-governance decisions before implementation.

No Supabase schema/data/ledger changes, migration replay, paid branch creation, or Phase 5.9 DDL occurred during this recovery. All recovered SQL payload files are outside `supabase/migrations/` and are evidence only. The database-write approval gate remains closed. NAASCONNECT V1.0 remains the source of truth.
