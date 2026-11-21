# NAASCONNECT Phase 5.9 — Read-only Migration Preservation Package

**Inspection date:** 21 November 2026  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS` (default branch `main`)  
**Authority:** NAASCONNECT Nigeria V1.0 architecture and approved decisions  
**Disposition:** Preservation evidence recorded; schema-only export outstanding; migration integrity gate **NOT PASSED**.

## 1. Safety boundary and result

This package is a read-only preservation record. No Supabase schema, data, migration ledger, project configuration, branch, or paid resource was changed. No migration was replayed. No Phase 5.9 DDL was created or applied.

The remote ledger was read through both the Supabase migration-list interface and a read-only query of `supabase_migrations.schema_migrations`. Both returned the same **29 ordered records**. The current GitHub migration directory returned **26 SQL files**.

Reconciliation result:
- **21** ledger entries have an exact same-version and same-name repository SQL file.
- **8** ledger entries do not have a same-version source filename.
- **5** repository files do not exactly map to a ledger version/name pair.
- The four original Stage 5.6.0–5.6.3 SQL sources remain missing from the current tree and their exact-path GitHub commit-history searches returned no commits.
- Stage 5.5.2 and Stage 5.7.0–5.7.2 each have a same-name candidate with a different timestamp; those candidates are not proof of the exact applied SQL.
- `org_foundation` is a repository artifact without a matching remote ledger entry.

These are provenance discrepancies, not permission to repair the ledger or rewrite/replay history.

## 2. Preserved remote migration ledger

The following is the exact ordered ledger snapshot returned by the read-only inspection:

| Version | Applied migration name |
|---|---|
| `20261121130420` | `stage5_provisional_geography_admin_seats` |
| `20261121131034` | `stage5_2_profiles_org_applications_member_onboarding` |
| `20261121131101` | `stage5_2_1_onboarding_policy_and_fk_indexes` |
| `20261121131109` | `stage5_2_2_limit_self_membership_to_campus_church` |
| `20261121132238` | `stage5_3_admin_appointment_approval_engine` |
| `20261121132415` | `stage5_3_1_harden_admin_appointment_rpc_wrappers` |
| `20261121134717` | `stage5_4_leadership_handover_executive_management` |
| `20261121134728` | `stage5_4_1_handover_security_and_review_fixes` |
| `20261121134737` | `stage5_4_2_president_role_revocation_fix` |
| `20261121134747` | `stage5_4_3_leadership_fk_indexes` |
| `20261121134806` | `stage5_4_4_revoke_public_private_rpc_execution` |
| `20261121134918` | `stage5_4_5_approver_inbox_and_platform_announcements` |
| `20261121140551` | `stage5_5_executive_portfolios_directory_term_management` |
| `20261121140620` | `stage5_5_1_harden_directory_rpc_and_fk_indexes` |
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` |
| `20261121145523` | `stage5_6_4_membership_status_lifecycle` |
| `20261121145544` | `stage5_6_4_membership_status_actor_index` |
| `20261121145638` | `stage5_6_4_1_reject_null_status_action` |
| `20261121145919` | `stage5_6_5_transfer_cancellation_and_rejection_hardening` |
| `20261121145933` | `stage5_6_5_1_cancelled_by_fk_index` |
| `20261121150236` | `stage5_6_6_scoped_membership_directory_and_statistics` |
| `20261121150817` | `stage5_6_7_org_membership_review_queues_and_reporting` |
| `20261121152734` | `stage5_7_global_community_statuses` |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` |

## 3. Ledger-to-repository discrepancy matrix

| Remote ledger version | Remote ledger name | Current repository source |
|---|---|---|
| `20261121140749` | `stage5_5_2_scoped_executive_term_updates` | `20261121140642_stage5_5_2_scoped_executive_term_updates.sql` (same name, different timestamp) |
| `20261121142038` | `stage5_6_membership_transfer_and_history_foundation` | **No matching source file or same-name candidate** |
| `20261121142049` | `stage5_6_1_lock_transfer_updates_pending_scoped_rpc` | **No matching source file or same-name candidate** |
| `20261121142125` | `stage5_6_2_membership_fk_performance_indexes` | **No matching source file or same-name candidate** |
| `20261121145225` | `stage5_6_3_transactional_membership_transfer_review` | **No matching source file or same-name candidate** |
| `20261121152734` | `stage5_7_global_community_statuses` | `20261121162500_stage5_7_global_community_statuses.sql` (same name, different timestamp) |
| `20261121152827` | `stage5_7_1_status_policy_and_fk_index_hardening` | `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` (same name, different timestamp) |
| `20261121152909` | `stage5_7_2_restrict_authenticated_status_table_grants` | `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` (same name, different timestamp) |

### Classification

- **Four unrecovered applied Stage 5.6 files:** `20261121142038`, `20261121142049`, `20261121142125`, and `20261121145225`. Their exact source paths were queried in GitHub commit history; no path-history commits were returned. No reconstructed SQL is being labelled as original.
- **Stage 5.5.2:** ledger `20261121140749_stage5_5_2_scoped_executive_term_updates`; repository candidate `20261121140642_stage5_5_2_scoped_executive_term_updates.sql`. Existing documentation records an addition commit `173defd84c3c13b3a6542560267af160f9225ffe` and semantic/catalog corroboration, but the remote ledger does not store the applied SQL body or checksum. Exact applied-source identity remains unproven.
- **Stage 5.7:** ledger versions `20261121152734`, `20261121152827`, `20261121152909`; repository candidates are timestamped `20261121162500`, `20261121162600`, `20261121162700`. Existing provenance notes identify commits `bb2daecb7c04a63cb5a5197eb6f2f794cf534971`, `cc6f8fcfce244578d86deef654d9a2ac02fd08b0`, and `5f5acf6744e2d5978f426a48fb13aebb27e325ed`. The table/policy/grant outcomes are semantically corroborated by the live catalog, but byte-for-byte applied SQL identity is not proven.
- **Repository-only `org_foundation`:** file `20261121133000_org_foundation.sql`, blob `0dac27cb773efdc3668a773ead135611ef23efc4`, introduced by commit `489ea6ddfbaf2d17cf35247bdb5eba1a55400b83` at `2026-11-21T12:30:00Z`. Its SQL defines `public.org_units`, `public.org_memberships`, private hierarchy helpers, triggers, RLS policies and the initial national row. The applied provisional-geography migration depends on the pre-existing organization foundation and adds the reserved admin-seat layer. This establishes the file's repository authorship and its architectural relationship, but **does not establish how or when it was executed**: no matching Supabase migration ledger row exists. Do not replay it or silently mark it as applied.

## 4. Complete current repository migration-file inventory

GitHub blob SHAs below are Git object identifiers for the current file contents; they are **not** SHA-256 hashes of a database export.

| File | Bytes | Git blob SHA |
|---|---:|---|
| `20261121130420_stage5_provisional_geography_admin_seats.sql` | 6,480 | `ec343d99d6804afa6c28a717cac69360ddefcad2` |
| `20261121131034_stage5_2_profiles_org_applications_member_onboarding.sql` | 5,286 | `c39c38f18f44dde34a89fd53d26893a0c21e1ee1` |
| `20261121131101_stage5_2_1_onboarding_policy_and_fk_indexes.sql` | 1,025 | `7d8171e6862dc626c6d19f7497e561f39eb8cd21` |
| `20261121131109_stage5_2_2_limit_self_membership_to_campus_church.sql` | 823 | `3c3717fe47c18397187028443c60f909d9d742fe` |
| `20261121132238_stage5_3_admin_appointment_approval_engine.sql` | 5,647 | `db2633fa4db20a6a9961dae026d2d3c5555dbda7` |
| `20261121132415_stage5_3_1_harden_admin_appointment_rpc_wrappers.sql` | 3,816 | `fe3547c5541e1176fd351dc9c993f7c5ea32d796` |
| `20261121133000_org_foundation.sql` | 8,476 | `0dac27cb773efdc3668a773ead135611ef23efc4` |
| `20261121134717_stage5_4_leadership_handover_executive_management.sql` | 17,453 | `bdb9ff70bfd09363a67723725a0fb5dfd7f3a6d9` |
| `20261121134728_stage5_4_1_handover_security_and_review_fixes.sql` | 6,120 | `336981c6fbfb010bb489f79b646f0484eb2f3d8c` |
| `20261121134737_stage5_4_2_president_role_revocation_fix.sql` | 5,684 | `8652771c72fd6d1e4be7f7baf53753052f6231fc` |
| `20261121134747_stage5_4_3_leadership_fk_indexes.sql` | 1,356 | `bc679cbf6815223820f69d17fb38abb739896230` |
| `20261121134806_stage5_4_4_revoke_public_private_rpc_execution.sql` | 727 | `147a4aa960d36e49b3658845a05f77a3f6d3b071` |
| `20261121134918_stage5_4_5_approver_inbox_and_platform_announcements.sql` | 6,733 | `cd0441b851bc30499f37a263fc52dcb01d178999` |
| `20261121140551_stage5_5_executive_portfolios_directory_term_management.sql` | 8,117 | `c7bae3c86a32f3ceed0bcfde661770f67aa49427` |
| `20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes.sql` | 2,696 | `ce366f36d011c7db65b866a7a8d96fcafe2ac799` |
| `20261121140642_stage5_5_2_scoped_executive_term_updates.sql` | 1,928 | `86bae2fcb12f05511d8acc0c152ff2d4ac3286b1` |
| `20261121145523_stage5_6_4_membership_status_lifecycle.sql` | 4,118 | `39125bcd5ef737dcedaefa037290df081d39810f` |
| `20261121145544_stage5_6_4_membership_status_actor_index.sql` | 111 | `a3b25503284ca02ed1d3587cf26f1f67ec58cea1` |
| `20261121145638_stage5_6_4_1_reject_null_status_action.sql` | 3,291 | `76b42d09abfe4ad6f54903a3fb77b66ad9e1adc9` |
| `20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql` | 11,004 | `9a230fbe7b0f0ac4873f253fbfc5c5063b99ea68` |
| `20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql` | 118 | `a50d95f6a89171db9867a196ddb66ac03eba94fc` |
| `20261121150236_stage5_6_6_scoped_membership_directory_and_statistics.sql` | 9,240 | `d0a4465ca3badd15caa8cfb23f159a0aa1a79193` |
| `20261121150817_stage5_6_7_org_membership_review_queues_and_reporting.sql` | 9,657 | `ed40a75a8b372fd5ed142fe84539e18fb8cd8c00` |
| `20261121162500_stage5_7_global_community_statuses.sql` | 2,464 | `7595038bb22085b1b7d6046187dffef445e2d61e` |
| `20261121162600_stage5_7_1_status_policy_and_fk_index_hardening.sql` | 1,376 | `6d05c68caf6e58c41fffab63c2a90a8b64409aae` |
| `20261121162700_stage5_7_2_restrict_authenticated_status_table_grants.sql` | 292 | `3a86a729eda24c5d492fa1de0e99e40d39f36fa5` |

## 5. Current read-only database inventory

The current public table listing returned 14 tables:

- `public.org_units`
- `public.org_memberships`
- `public.org_admin_seats`
- `public.profiles`
- `public.org_applications`
- `public.admin_appointment_requests`
- `public.org_leadership_positions`
- `public.leadership_handover_requests`
- `public.leadership_history`
- `public.leadership_notification_events`
- `public.org_executive_portfolios`
- `public.membership_transfer_requests`
- `public.membership_events`
- `public.community_statuses`

The earlier read-only Phase 5.9 inspection confirmed `public.admin_audit_logs` is absent. The existing domain histories remain authoritative and must not be duplicated:
- `public.membership_events`
- `public.leadership_history`
- `public.leadership_notification_events`
- `public.membership_transfer_requests` (workflow state, not a second generic event stream)

The catalog inventory and object-to-source reconciliation matrix are useful structural evidence, but neither is a restorable schema-only SQL export.

## 6. Schema-only export — status and exact remaining action

**Status: NOT OBTAINED in this execution.**

The connected Supabase interface available here exposes read-only migration, table/catalog, SQL-query and advisor operations, but no database dump/download operation. The active runtime has no `supabase` CLI, `pg_dump`, or `psql` binary and no owner-controlled direct database URI. Therefore a complete schema-only export cannot honestly be claimed or fabricated from table metadata.

To obtain the required export on the owner's trusted machine (without sharing the database URI in chat):

1. Obtain the **direct** database connection URI from Supabase Project Settings → Database → Connection string. Keep it private.
2. With PostgreSQL client tools installed, run:

```bash
mkdir -p evidence/phase-5-9
read -rsp "Paste the direct NAASCONNECT database URI: " NAASCONNECT_DB_URL
printf '\n'
export NAASCONNECT_DB_URL

pg_dump \
  --dbname="$NAASCONNECT_DB_URL" \
  --schema-only \
  --format=custom \
  --file=evidence/phase-5-9/naasconnect-schema-only.dump

pg_restore --list evidence/phase-5-9/naasconnect-schema-only.dump \
  > evidence/phase-5-9/naasconnect-schema-only.manifest.txt

sha256sum evidence/phase-5-9/naasconnect-schema-only.dump \
  evidence/phase-5-9/naasconnect-schema-only.manifest.txt \
  > evidence/phase-5-9/SHA256SUMS

unset NAASCONNECT_DB_URL
```

3. Confirm the dump command exits successfully, the archive can be listed by `pg_restore --list`, and the SHA-256 manifest is non-empty. Record the PostgreSQL client version, capture time (UTC), project ref, dump byte size, and SHA-256.
4. Store the dump and manifest in owner-controlled encrypted backup storage, **not** in a public GitHub repository. Review the archive for sensitive function literals or embedded configuration before sharing any portion.
5. Separately obtain/verify a restorable full backup. A schema-only export contains no table data and is not a full database backup.

If the direct connection is unavailable because of network/IPv6 restrictions, stop and choose an owner-approved Supabase connection method; do not substitute a schema pull that writes migration history. Supabase CLI v3 changed database commands to target the local stack by default; any CLI fallback must explicitly target the remote database and must be used only for a read-only dump. Do not use `db pull`, `db push`, `migration repair`, or `apply_migration` for this preservation step.

## 7. V1.0 alignment and no-duplication safeguards

V1.0 remains the source of truth. This preservation package does not revise hierarchy, roles, organization onboarding, leadership handover, membership lifecycle, or community-status decisions.

Phase 5.9 must remain a separate general administrative/security audit trail. It must not mirror membership transfer/status events, leadership succession history, or leadership notification events. Null-target platform events require explicitly approved national-level visibility; null must never imply global read access. The existing Phase 5.9 design specification remains design-only until the integrity gate and governance decisions are satisfied.

## 8. Remaining integrity gate (all items required)

### P0 — preservation and provenance
- [ ] Obtain the owner-controlled full restorable backup.
- [ ] Obtain and verify the complete schema-only export and SHA-256 manifest described above.
- [ ] Recover the original four Stage 5.6 SQL files from the trusted authoring machine/backup/object archive, **or** execute the separately approved reconstructed-baseline procedure with reconstructed files clearly labelled as reconstructed and never represented as original.
- [ ] Resolve exact-source provenance for Stage 5.5.2 and Stage 5.7.0–5.7.2; semantic similarity alone is insufficient for a byte-level claim.
- [ ] Document the `org_foundation` execution history (who/when/how it was applied) or formally document the approved baseline treatment. Do not replay it.
- [ ] Assemble a complete ordered local migration source set and reconcile it against the preserved 29-row remote ledger without changing the remote ledger.
- [ ] Run and retain non-mutating validation evidence showing no already-applied migration would be replayed and no applied source remains unaccounted for.

### P1 — audit governance choices
- [ ] Approve audit retention, archive/export, and lawful deletion/immutability exceptions.
- [ ] Decide whether non-admin actors may view their own audit entries.
- [ ] Define which national audit role(s) may read null-target platform events.
- [ ] Approve the initial `action_key` and `entity_type` allowlists and explicit exclusions for existing domain histories.
- [ ] Approve the minimal safe metadata allowlist.
- [ ] Decide which denied privileged operations are logged and how sensitive target information is protected.

### P2 — Phase 5.9 implementation after P0/P1
Only after P0 and P1 pass: recheck object-name collisions; create and review the migration; implement least-privilege grants, RLS and a trusted append-only write path; prove atomicity, no recursion and no duplicate domain-history events; test hierarchy inheritance and sibling isolation with controlled accounts; run advisors; document verification; update the V1 reconciliation register.

**Separate explicit owner approval is still required before any Supabase database write.** Passing this preservation gate does not itself authorize DDL.

## 9. Final disposition

| Item | Status |
|---|---|
| Remote migration ledger snapshot | **Preserved in this GitHub evidence document (29 records)** |
| Current migration-file inventory | **Preserved (26 files with Git blob SHAs)** |
| Four original Stage 5.6 SQL files | **Not recovered** |
| Stage 5.5.2 and Stage 5.7 exact applied SQL identity | **Not proven** |
| `org_foundation` repository authorship | **Resolved; execution provenance unresolved** |
| Complete schema-only export | **Not obtained** |
| Full restorable backup | **Not verified** |
| Migration integrity gate | **NOT PASSED** |
| Phase 5.9 DDL/migration | **Not implemented** |
| Stage 6 implementation | **Not started** |

**Safety attestation:** No Supabase schema/data/ledger change, migration replay, paid branch, or Phase 5.9 DDL was performed during this preservation pass.
