# Recovered SQL Payloads from the Remote Supabase Migration Ledger

**Project:** NAASCONNECT Nigeria  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Capture method:** Read-only SELECT from `supabase_migrations.schema_migrations`  
**Captured:** 21 November 2026  
**Disposition:** Evidence artifacts only; never replay these files.

## Evidence meaning

The remote migration ledger table contains a `statements` array. A read-only query retrieved `statements[1]` for each of the eight ledger entries that lacked an exact same-version file in the active repository migration directory. Each returned array contained one SQL payload. The files in this folder preserve that SQL payload as returned, without adding SQL comments or changing the statement text.

These are the SQL statement payloads recorded in the remote ledger for the applied migration entries. They are stronger evidence than reconstructing from the live schema. They do not necessarily reproduce the original local migration file byte-for-byte, including comments, formatting outside the stored statement, or the exact original file packaging.

## Captured ledger entries

| Ledger version | Ledger name | Payload file | Characters |
|---|---|---|---:|
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | `20261121140749_stage5_5_2_scoped_executive_term_updates.ledger-recovered.sql` | 1884 |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | `20261121142038_stage5_6_membership_transfer_and_history_foundation.ledger-recovered.sql` | 5408 |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | `20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc.ledger-recovered.sql` | 177 |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | `20261121142125_stage5_6_2_membership_fk_performance_indexes.ledger-recovered.sql` | 750 |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | `20261121145225_stage5_6_3_transactional_membership_transfer_review.ledger-recovered.sql` | 7761 |
| `20261121152734` | `stage5_7_global_community_statuses` | `20261121152734_stage5_7_global_community_statuses.ledger-recovered.sql` | 2234 |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | `20261121152827_stage5_7_1_status_policy_and_fk_index_hardening.ledger-recovered.sql` | 1307 |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | `20261121152909_stage5_7_2_restrict_authenticated_status_table_grants.ledger-recovered.sql` | 135 |

## Comparison with timestamp-shifted repository candidates

- `20261121140749`: candidate `supabase/migrations/20261121140642_stage5_5_2_scoped_executive_term_updates.sql`; exact text match: **false**; SQL comparison after stripping line comments and normalizing whitespace: **false**; repository blob SHA: `86bae2fcb12f05511d8acc0c152ff2d4ac3286b1`.
- `20261121152734`: candidate `supabase/migrations/20261121162500_stage5_7_global_community_statuses.sql`; exact text match: **false**; SQL comparison after stripping line comments and normalizing whitespace: **true**; repository blob SHA: `7595038bb22085b1b7d6046187dffef445e2d61e`.
- `20261121152827`: candidate `supabase/migrations/20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql`; exact text match: **false**; SQL comparison after stripping line comments and normalizing whitespace: **true**; repository blob SHA: `6d05c68caf6e58c41fffab63c2a90a8b64409aae`.
- `20261121152909`: candidate `supabase/migrations/20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql`; exact text match: **false**; SQL comparison after stripping line comments and normalizing whitespace: **true**; repository blob SHA: `3a86a729eda24c5d492fa1de0e99e40d39f36fa5`.

A normalized match supports that the current repository candidate has the same SQL statements, even though its filename timestamp differs. It does not establish why the filename timestamp differs or prove that the local file was the exact artifact used at execution time.

## Safety

- Every recovered payload is stored under `docs/backend/recovered-ledger-statements/`, outside `supabase/migrations/`.
- No recovered payload was applied or replayed.
- No migration ledger row was edited.
- No schema, data, function, branch, or paid resource was changed.
- Do not copy these files into the active migration directory or run them against any database.
- NAASCONNECT V1.0 remains the source of truth.
