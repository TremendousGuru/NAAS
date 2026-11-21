# NAASCONNECT Stage 5.6 — Reconstructed SQL Evidence Package

**Disposition:** Reconstructed evidence only; not recovered originals and not approved migrations.  
**Repository:** `TremendousGuru/NAAS`  
**Canonical architecture:** NAASCONNECT Nigeria V1.0  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Prepared:** 2026-11-21

## Why this package exists

The live migration ledger records four Stage 5.6 versions for which the original SQL source was not found in the current repository or the inspected Git history:

| Ledger version | Ledger name | Reconstructed artifact |
|---|---|---|
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | `20261121142038_stage5_6_membership_transfer_and_history_foundation.reconstructed.sql` |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | `20261121142049_stage5_6_1_lock_transfer_updates_pending_scoped_rpc.reconstructed.sql` |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | `20261121142125_stage5_6_2_membership_fk_performance_indexes.reconstructed.sql` |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | `20261121145225_stage5_6_3_transactional_membership_transfer_review.reconstructed.sql` |

The filenames deliberately carry the ledger versions for traceability but use a `.reconstructed.sql` suffix and live under `docs/backend/reconstructed-stage5-6/`, never under `supabase/migrations/`.

## Evidence inspected

1. Current repository sources:
   - `supabase/migrations/20261121133000_org_foundation.sql`
   - `supabase/migrations/20261121140642_stage5_5_2_scoped_executive_term_updates.sql`
   - Stage 5.6.4, 5.6.5, 5.6.6 and 5.6.7 migration files.
   - Stage 5.7.0, 5.7.1 and 5.7.2 migration files.
2. `docs/backend/STAGE5_6_MEMBERSHIP_ADMINISTRATION.md`, including its feature descriptions, security model, and recorded limitations.
3. `docs/backend/MIGRATION_SOURCE_INTEGRITY_FORENSIC_REPORT.md`.
4. Commit `437b73dc96872b427f5015250b89ad269c3b50d5`, documenting Stage 5.6.3 transactional transfer review.
5. Read-only Supabase inspection of migration ledger, public table/column definitions, constraints, foreign keys, indexes, RLS policies, grants, triggers, and private/public transfer functions.

## Provenance and confidence by artifact

### 5.6 foundation

The transfer request and membership event table structures are reconstructed from the live catalogue. The stage document confirms the intent, statuses, ownership model, and RLS model. The live schema has since evolved: cancellation metadata and the `transfer_cancelled` event are later additions and are not represented as original foundation fields in this artifact.

### 5.6.1 transfer mutation guardrails

The stage title and stage documentation support member-owned request creation and denial of direct authenticated updates. The precise original RPC/policy implementation was not recovered. The policy in the artifact is an explicit reconstruction of the documented behavior and must be independently reviewed before any future use.

### 5.6.2 indexes

Six foreign-key index definitions are corroborated by the live catalogue: source membership, source reviewer, destination reviewer, resulting membership, event actor, and related transfer. The artifact is a reconstruction of those definitions, not proof of the original migration's exact order or additional statements.

### 5.6.3 transactional review

The Stage 5.6.3 commit documents two-stage source/destination review, atomic final transfer, row locking, jurisdiction checks, and membership history writes. The function body is taken from the later Stage 5.6.5 hardening migration and corroborated against the live function. It includes later rejection hardening, so it must not be represented as the byte-identical original Stage 5.6.3 body.

## Important repository documentation discrepancy

The Stage 5.6 administration document lists the first three migrations with versions `20261121151800`, `20261121151900`, and `20261121152000`, while the inspected live ledger and forensic report identify `20261121142038`, `20261121142049`, and `20261121142125`. This package follows the live ledger versions for reference and does not rewrite historical ledger records.

## Safety and validation status

- All four SQL files are outside `supabase/migrations/`.
- No Supabase schema, data, migration ledger, or functions were modified.
- No migration was replayed or applied.
- No paid Supabase branch was created.
- No original checksum/body is claimed.
- Static review performed for file boundaries, expected object names, stage separation, security wrappers, and index inventory.
- These files have not been executed against a database or certified by a PostgreSQL parser.
- The schema-only export and independent backup verification remain separate migration-integrity requirements.
- Controlled positive and negative end-to-end transfer tests remain outstanding as documented for Stage 5.6.

## Database-write approval gate — remains CLOSED

No one may apply these reconstructed files, copy them into `supabase/migrations/`, edit the remote migration ledger, replay any migration, or implement Phase 5.9 DDL without a separate explicit approval after the migration-integrity gate is demonstrably passed. This approval to create GitHub evidence files is not database-write approval.

V1.0 remains the source of truth. If any reconstructed detail conflicts with V1.0, V1.0 prevails and the discrepancy must be documented rather than silently changing the architecture.
