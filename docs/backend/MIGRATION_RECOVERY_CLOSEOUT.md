# NAASCONNECT — Migration Recovery and Reconciliation Close-out

**Project:** NAASCONNECT Nigeria  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Working branch:** `feature/naasconnect-frontend-foundation`  
**Close-out record date:** 27 November 2026  
**Disposition:** Historical discrepancy investigation closed for forward development. Live database mutation remains gated by verified backup and isolated validation.

## Purpose

This document is the single operational hand-off for the migration/source-integrity work. It consolidates the decisions that future feature work must follow so the team does not repeatedly reopen the historical investigation.

## Source-of-truth decisions

1. **Application architecture and intended behavior:** GitHub repository and approved NAASCONNECT architecture/decision records.
2. **Actual database state, data, policies and deployed objects:** live Supabase project `csytneubatlaakpmnsfk`.
3. **Applied migration history:** live `supabase_migrations.schema_migrations` ledger. It is historical evidence and must not be rewritten to make repository filenames appear aligned.
4. **Recovered SQL payloads:** `docs/backend/recovered-ledger-statements/`. These are ledger-recovered evidence, not original workstation files unless independently proven.
5. When these sources disagree, compare the live catalog with intended application behavior and choose the narrowest forward-only correction. Never blindly replay a repository file against production.

## Current verified inventory (27 November 2026)

- Live project status: `ACTIVE_HEALTHY`; PostgreSQL 17.12.
- Applied migration ledger: **30 entries** (the older 29-entry reports below are historical snapshots).
- Public application tables: **14**, with RLS enabled on all 14.
- Active Edge Functions: `admin-appointment` (version 2; JWT verification enabled).
- Storage bucket `community-media`: not present at the time of inspection.
- Supabase development branch named `main` reported `MIGRATIONS_FAILED`; this is distinct from the healthy main project and must not be “fixed” by resetting production.
- The 30th ledger entry is `20261123062356_batch1_member_onboarding_eligibility_and_review`.

Counts and statuses are point-in-time evidence. Recheck only when an actual schema/deployment task requires it, not as a recurring project-wide rediscovery exercise.

## Historical discrepancies and final disposition

### A. Four missing original Stage 5.6 source files

The live ledger contains these applied entries, but the original local source files are absent from the current migration directory:

- `20261121142038_stage5_6_membership_transfer_and_history_foundation`
- `20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc`
- `20261121142125_stage5_6_2_membership_fk_performance_indexes`
- `20261121145225_stage5_6_3_transactional_membership_transfer_review`

Their SQL statement payloads have been recovered into `docs/backend/recovered-ledger-statements/`. Preserve those files as immutable evidence. They must retain the `.ledger-recovered.sql` suffix and must never be presented as the original authored migration files.

**Disposition:** evidence recovered; original-file provenance limitation permanently recorded. Do not spend future feature time trying to recreate or authenticate the original workstation files unless new trusted evidence becomes available.

### B. Timestamp mismatches

- Stage 5.5.2: ledger version `20261121140749`; repository candidate filename uses `20261121140642`.
- Stage 5.7 entries: ledger versions `20261121152734`, `20261121152827`, `20261121152909`; repository candidate filenames use `20261121162500`, `20261121162600`, `20261121162700`.

Semantic/catalog corroboration exists, but the ledger does not expose an applied SQL checksum. Do not rename these files or assert byte-for-byte identity based only on similar names or resulting objects.

**Disposition:** mapping documented; no renaming or ledger rewrite required for forward development.

### C. Repository-only organization foundation artifact

`supabase/migrations/20261121133000_org_foundation.sql` has no matching applied ledger entry and defines objects already present in the live database. It is not an authorized production replay candidate.

**Disposition:** quarantine operationally. Leave it in place as historical repository evidence; do not include it in deployment or replay. Any eventual archival move must preserve Git history and be a separate reviewed change.

### D. Historical reports

The 29-entry reports are retained as point-in-time forensic records and must not be silently rewritten. This close-out record supersedes their counts and provides the current 30-entry status. The four recovered Stage 5.6 payloads and object-source matrix remain supporting evidence.

## Permanent migration operating rules

1. Every new schema change is a **new forward-only migration** with a fresh timestamp and a narrowly scoped purpose.
2. Never edit, delete, renumber, backdate, or replay a migration already recorded as applied in the live ledger.
3. Never insert recovered historical SQL into the active migration directory under old timestamps.
4. Never deploy `20261121133000_org_foundation.sql` to the live project.
5. Before authoring a migration, inspect the live object(s) it affects and check whether the intended capability already exists.
6. Prefer additive, idempotent-safe operations where appropriate; do not use broad destructive statements or drop/recreate existing data structures to force alignment.
7. A migration must include a matching application impact note and verification plan (RLS, grants, constraints, triggers, RPC behavior, and relevant UI flows).
8. Test the migration against an isolated disposable database/project that reflects the current live schema. Do not use the production project as a test environment.
9. Before any production DDL, obtain and verify a restorable backup/export and document the restore path. A dashboard label or an untested export is not a verified backup.
10. After applying a migration, verify the ledger entry, catalog diff, security posture, and affected application flows. Record the resulting commit and migration version.

## Backup and isolated validation gate

The previous audit did **not** establish a complete, tested, restorable backup/export workflow. Therefore production schema changes remain blocked until the operator verifies:

- a full schema-and-data backup/export appropriate to the change;
- that the export is accessible outside the project;
- a successful restore into a disposable isolated project/database;
- a documented rollback/recovery owner and procedure.

This is a one-time infrastructure safety gate. Once completed and recorded, it should be treated as a reusable project prerequisite rather than a reason to repeat the entire migration forensic investigation.

## What is closed vs. what is not

| Item | Status | Future handling |
|---|---|---|
| Historical 30-entry ledger inventory | Recorded | Do not re-audit without a concrete mismatch |
| Four Stage 5.6 SQL payloads | Recovered from ledger | Preserve as evidence; no recreation required |
| Stage 5.5.2 / Stage 5.7 timestamp mismatches | Classified | Do not rename or rewrite history |
| Repository-only `org_foundation` artifact | Quarantined by policy | Never replay to production |
| GitHub vs. Supabase authority | Decided | Follow source-of-truth rules above |
| Forward-only migration policy | Established | Apply to all future work |
| Verified restorable backup | **Outstanding external gate** | Complete once before next production DDL |
| Isolated migration restore test | **Outstanding external gate** | Complete with backup gate |
| Batch 2 feature implementation | Separate product work | Continue against verified current schema |
| Batch 2/3 frontend and end-to-end QA | Separate product work | Continue in project plan |

## Close-out rule

The historical migration/source-integrity investigation is considered closed for forward feature development. Reopen it only if a concrete new fact shows that a planned feature would collide with existing schema, permissions, data, or migration history. Do not reopen it merely because old source filenames differ from the applied ledger.

This document does not certify that all future production migrations are safe without the backup/restore gate, nor does it claim that unimplemented product features are complete.
