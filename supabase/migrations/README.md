# Supabase migrations — NAASCONNECT

This directory is for **new forward-only migrations only**.

Before adding a migration, read:
- [Migration recovery close-out](../../docs/backend/MIGRATION_RECOVERY_CLOSEOUT.md)
- [Forward migration standard](../../docs/backend/FORWARD_MIGRATION_STANDARD.md)

## Do not

- Edit, delete, renumber, backdate, or replay a migration already recorded in the live Supabase ledger.
- Copy ledger-recovered SQL from `docs/backend/recovered-ledger-statements/` into this directory and present it as original source.
- Deploy `20261121133000_org_foundation.sql` to the live project. It is a repository-only historical artifact with no matching applied ledger entry and collides with objects already present.
- Treat a filename match as cryptographic proof of applied SQL identity.

## Required for every new file

1. Use a fresh timestamp and descriptive stage name.
2. Include purpose, affected objects, data impact, security impact, and verification notes in the SQL header.
3. Inspect the live schema and ledger before authoring.
4. Validate on a restored isolated database before production.
5. Verify the new ledger entry, catalog, RLS/grants and affected application flows after release.

The current live ledger snapshot is 30 entries as of 27 November 2026. Historical reports with 29 entries are preserved as earlier snapshots; see the close-out record for the current disposition.
