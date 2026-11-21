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


## 7. Follow-up comparison of all 29 applied SQL payloads

A subsequent read-only comparison fetched the stored SQL payload for every ledger row and compared it with the corresponding same-version/name repository file, where one exists. The comparison removed SQL line comments and normalized whitespace before comparing text.

Results:

- **12 of 21** same-version/name repository files match their ledger payload after that normalization.
- **9 of 21** same-version/name repository files differ after normalization. Their applied ledger payloads have now also been preserved in this directory.
- The four timestamp-shifted Stage 5.5.2/5.7 candidates match their ledger payloads after comment/whitespace normalization.
- The four missing Stage 5.6 applied SQL payloads are recovered from the ledger.
- Thus **17 ledger SQL payloads** are now preserved individually: the 8 formerly unmatched entries plus 9 same-version/name content divergences.
- The other 12 same-version/name repository files are textually corroborated against their ledger payload after normalization.

The nine same-version/name content-divergent versions are:

- `20261121130420` — `stage5_provisional_geography_admin_seats`
- `20261121132238` — `stage5_3_admin_appointment_approval_engine`
- `20261121132415` — `stage5_3_1_harden_admin_appointment_rpc_wrappers`
- `20261121134717` — `stage5_4_leadership_handover_executive_management`
- `20261121134728` — `stage5_4_1_handover_security_and_review_fixes`
- `20261121134737` — `stage5_4_2_president_role_revocation_fix`
- `20261121140551` — `stage5_5_executive_portfolios_directory_term_management`
- `20261121150236` — `stage5_6_6_scoped_membership_directory_and_statistics`
- `20261121150817` — `stage5_6_7_org_membership_review_queues_and_reporting`

This is a significant new finding: the 26-file active migration directory is not merely short four Stage 5.6 files; nine other same-version/name files also differ from the SQL payload recorded in the remote ledger. The ledger-recovered SQL payloads, not the divergent repository copies, are the strongest available evidence of what the remote migration records stored.

The 12 normalized matches and 4 timestamp-shifted normalized matches are not byte-identical file proofs. The 17 preserved ledger payloads are exact as returned from the ledger statement array, but not guaranteed to recreate original file comments or local file packaging.

## 8. Revised P0 reconciliation status

The 29 remote migration entries now have a complete evidence mapping:
- 12 have same-version/name repository SQL that matches the stored ledger payload after comment/whitespace normalization.
- 4 have timestamp-shifted repository SQL candidates that match the stored ledger payload after comment/whitespace normalization.
- 13 require the ledger-recovered payload as the canonical evidence artifact (4 missing Stage 5.6 sources plus 9 same-version/name divergences).

The 17 ledger payloads for the last category and timestamp-shifted entries are preserved under `docs/backend/recovered-ledger-statements/`. All evidence files remain outside `supabase/migrations/`.

A local ordered migration source set has not been installed into the active migration runner. That is deliberate: the active directory contains duplicate/unapplied timestamp candidates and divergent copies, and changing it without an approved reconciliation plan could cause a future CLI operation to attempt unintended migrations. The archive is evidence, not a migration-runner repair.

Remaining P0 blockers are now narrowed to:
1. Complete schema-only export and SHA-256 manifest.
2. Separate full restorable backup verification.
3. Formal disposition of repository-only `org_foundation` as an out-of-band baseline, including owner/execution provenance or explicit accepted baseline treatment.
4. A final owner-reviewed migration-source mapping and non-mutating dry-run/migration-list validation using a controlled local copy of the evidence set. No file renames, ledger edits, or database writes are authorized by this addendum.

P1 audit-governance decisions remain outstanding. The database-write approval gate remains closed.


## 9. Out-of-band organizational foundation execution recovered from PostgreSQL logs

A read-only query of Supabase PostgreSQL logs for 21 November 2026 captured the organizational foundation being executed through the management API:

- **12:28:48.007 UTC:** the `private` schema, `public.org_units`, `public.org_memberships`, hierarchy helpers, triggers, RLS, grants, policies, and national root seed SQL were submitted. The log annotation identifies the source as `POST /mcp`.
- **12:29:14.311 UTC:** follow-up statements created `org_units_created_by_idx` and `org_memberships_approved_by_idx`, also annotated as `POST /mcp`.

The SQL payloads are preserved under [`docs/backend/recovered-baseline-logs/`](recovered-baseline-logs/README.md). This is execution-log evidence for an out-of-band baseline, not a 30th migration and not a reason to add a row to the migration ledger.

The committed `supabase/migrations/20261121133000_org_foundation.sql` is related to, but not byte-identical with, the logged execution. Differences include explicit `NULL` syntax, `CREATE INDEX IF NOT EXISTS` and index placement, privilege statement packaging, and the national-root description. The log-recovered SQL is the stronger evidence of what was submitted. This resolves the question of whether a foundation was executed out-of-band; it does not make the repository-only file safe to replay.

## 10. Final current P0 checklist

| Requirement | Current status |
|---|---|
| Four missing Stage 5.6 applied SQL payloads | **Recovered from remote ledger statements** |
| Stage 5.5.2 / Stage 5.7 timestamp-shifted payloads | **Recovered; candidate SQL matches after comment/whitespace normalization** |
| Nine same-version repository files with divergent SQL | **Ledger payloads recovered and preserved** |
| Twelve same-version repository files matching ledger SQL | **Textually corroborated after comment/whitespace normalization** |
| Out-of-band `org_foundation` execution | **PostgreSQL log evidence recovered; actual submitted SQL preserved** |
| Complete schema-only export and SHA-256 manifest | **Outstanding** |
| Separate full restorable backup verification | **Outstanding** |
| Owner-reviewed final 29-entry mapping and non-mutating local dry-run/migration-list validation | **Outstanding** |

The 17 ledger-recovered SQL payloads are evidence artifacts only and remain outside the active migration directory. The four reconstructed Stage 5.6 drafts remain preserved but are superseded by the recovered ledger payloads for historical-source purposes. P1 audit-governance decisions remain outstanding. The database-write approval gate remains closed.
