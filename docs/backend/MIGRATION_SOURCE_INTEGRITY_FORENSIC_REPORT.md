# NAASCONNECT Nigeria — Migration Source Integrity Forensic Report

**Project:** NAASCONNECT Nigeria  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Inspection:** 21 November 2026  
**Disposition:** Migration synchronization is **BLOCKED** pending trusted source recovery. No database or migration-history writes were performed.

## Executive finding

The live Supabase ledger contains 29 applied migration records. The current GitHub `supabase/migrations` directory contains 26 SQL files. The ledger and directory do not form a safe, complete one-to-one migration source set.

The repository's available Git commit history was inspected for the relevant files and related commits. The original SQL source for the four applied Stage 5.6 migrations below was not found in the available current tree or inspected commit history. The migration ledger exposes version/name metadata, not the original SQL body or a checksum. Therefore the original applied SQL cannot be authenticated by comparing only the live ledger.

## 1. Four missing applied membership sources

| Applied Supabase version | Ledger name | Repository source status |
|---|---|---|
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | No matching source file found. |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | No matching source file found. |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | No matching source file found. |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | No matching source file found. |

The current `docs/backend/STAGE5_6_MEMBERSHIP_ADMINISTRATION.md` incorrectly lists the first three as versions `20261121151800`, `20261121151900`, and `20261121152000`. Those values do not match the live ledger. Its Stage 5.6.3 entry uses `20261121145225`, which matches the ledger, but its SQL file is also absent.

The live database does contain the resulting `membership_transfer_requests` and `membership_events` tables and the current transfer/status RPCs. This corroborates that membership functionality exists; it does not reconstruct the original four migration files or prove the precise SQL sequence applied.

**Recovery decision:** Do not fabricate source SQL from the current schema and label it as original. Recover the original files from the authoring workstation, trusted backup, local Supabase migration directory, or a separately retained commit/object archive. If original files cannot be recovered, create a separately labelled *reconstructed current-state baseline* only after a formal owner-approved recovery plan; never backdate or pretend that reconstruction is the original applied migration.

## 2. Stage 5.5.2 filename mismatch

- Applied ledger: `20261121140749_stage5_5_2_scoped_executive_term_updates`.
- Repository file: `20261121140642_stage5_5_2_scoped_executive_term_updates.sql`.
- Git history contains the addition commit `173defd84c3c13b3a6542560267af160f9225ffe` with the same migration name and SQL body as the current file.
- Live database catalog contains `private.set_executive_term` and its public SECURITY INVOKER wrapper.

This is strong semantic corroboration of the intended migration, but the Supabase ledger does not provide the applied SQL body/checksum. **Exact applied-source identity is not proven.** Do not rename the file solely on timestamp similarity.

## 3. Stage 5.7 filename mismatches

| Applied ledger version | GitHub filename | Git commit evidence | Live catalog evidence |
|---|---|---|---|
| `20261121152734` | `20261121162500_stage5_7_global_community_statuses.sql` | Commit `bb2daecb7c04a63cb5a5197eb6f2f794cf534971` adds this file. | `community_statuses` exists. |
| `20261121152827` | `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` | Commit `cc6f8fcfce244578d86deef654d9a2ac02fd08b0` adds the hardening source. | Status policies and author indexes are present in catalog. |
| `20261121152909` | `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` | Commit `5f5acf6744e2d5978f426a48fb13aebb27e325ed` adds the privilege restriction source. | Current grant state can be inspected; exact original SQL still unavailable from ledger. |

The commit history establishes the intended source files and their authored contents. The live catalog corroborates the resulting table and policy/index structures. However, there is no checksum or original applied SQL body in the migration ledger, so byte-for-byte identity cannot be asserted. **These files are not safe to rename to the ledger timestamps solely on the evidence available.**

## 4. Repository-only `org_foundation` artifact

- File: `20261121133000_org_foundation.sql`.
- No matching version/name entry exists in the 29-entry Supabase ledger.
- It creates `public.org_units` and `public.org_memberships` without `IF NOT EXISTS`, and creates the organizational hierarchy foundation.
- Those tables already exist in the live database and are part of the earlier applied provisional-geography foundation.

This file is therefore an **untracked repository artifact / likely superseded draft**, not a verified applied migration. Applying it to the current database would collide with existing objects. Keep it out of automated migration deployment. Do not delete it until its origin and relationship to the applied `20261121130420_stage5_provisional_geography_admin_seats` source are formally reviewed.

## 5. What was verified read-only

- Supabase migration ledger: 29 records.
- GitHub migration directory: 26 SQL files.
- Public tables: 14; RLS enabled on all 14 in the previous inventory.
- Membership structures exist: `membership_transfer_requests`, `membership_events`, `org_memberships`, `profiles`.
- Leadership structures exist: `leadership_history`, `leadership_notification_events`, `leadership_handover_requests`.
- Current RPC catalog includes public SECURITY INVOKER wrappers and private SECURITY DEFINER implementations for membership and leadership workflows.
- Security advisor returned no lints in this inspection.
- No migration replay, DDL, DML, ledger edit, file rename, file deletion, branch creation or paid resource creation occurred.

## 6. Required recovery gate before any new migration

1. Retrieve the four missing original Stage 5.6 SQL files from the trusted authoring source or backup.
2. Confirm their original contents and intended order against the actual ledger names/versions and the historical implementation notes.
3. Recover the originally applied source or a trustworthy hash/backup for Stage 5.5.2 and all three Stage 5.7 migrations; verify file contents before any filename alignment.
4. Identify the origin of `org_foundation`, compare its contents with the original applied provisional-geography migration, and quarantine it from deployment until resolved.
5. Correct the Stage 5.6 backend documentation's incorrect version references only after the source/version mapping is agreed.
6. Assemble a complete, ordered local migration directory that matches the remote applied ledger without changing the remote ledger.
7. Run a non-mutating migration-list/dry-run validation with the approved Supabase CLI/tooling. Do not run `db push` until the dry run proves no already-applied migration would be replayed and no missing source remains.
8. Record the recovery decision and owner approval in GitHub before proceeding with any new schema migration.

**Gate status: NOT PASSED.** The source recovery requirement is not yet satisfied. New database migrations are on hold.

---
