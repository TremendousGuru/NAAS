# NAASCONNECT — Forward-only Database Change Standard

This is the required workflow for every future Supabase schema change. It is intentionally short enough to use during normal feature delivery.

## Non-negotiable rules

- GitHub defines intended application architecture; live Supabase defines actual deployed schema and data; the live migration ledger defines applied history.
- Historical migrations are immutable. Never edit, delete, backdate, rename to force ledger alignment, or replay applied migrations.
- Ledger-recovered SQL is evidence, not original authored source. Keep it outside `supabase/migrations/`.
- Never apply `20261121133000_org_foundation.sql` to the live project; it has no applied ledger record and collides with existing foundation objects.
- All future database changes receive a new timestamp and a new forward-only migration.
- No production DDL until a full backup/export has been restored successfully into an isolated disposable environment.

## Change procedure

### 1. Define the change

Record the feature, user-visible behavior, tables/RPCs/policies involved, data impact, and frontend call sites. Identify whether the live schema already supports it.

### 2. Inspect live state

Before writing SQL, inspect the exact target objects:
- columns, types, defaults, nullability;
- primary/foreign/check/unique constraints;
- indexes and query plans where relevant;
- RLS enabled state and every relevant policy;
- table/schema/function grants;
- triggers and trigger functions;
- RPC signatures, security-definer/invoker mode, search path and execute grants;
- existing rows and any required backfill.

Do not infer permission safety from RLS being enabled alone.

### 3. Design the smallest forward migration

- Use a fresh timestamp.
- Avoid unrelated cleanup bundled into a feature migration.
- Preserve existing data and public contracts.
- Make the operation safe to retry only where that is genuinely correct; do not disguise partial failures with broad `IF NOT EXISTS` clauses.
- For backfills, define batching, null handling, and a measurable completion check.
- For access changes, explicitly state allowed and denied actor/scope combinations.

### 4. Validate away from production

- Restore the verified backup into a disposable isolated project/database.
- Apply the migration there.
- Compare before/after catalog and data invariants.
- Run positive and negative authorization tests, including cross-organization access denial.
- Run affected RPC, server-action, form and browser tests.
- Verify rollback/recovery instructions against the disposable environment.

### 5. Production release

Only after the backup/restore gate passes:
- apply the new migration once through the agreed deployment path;
- verify exactly one expected new ledger entry;
- inspect changed objects and security grants/policies;
- run smoke tests against affected application workflows;
- record commit SHA, migration version, release and verification results.

## Required migration header

Each new migration should begin with a concise comment block identifying:

- purpose and linked feature/batch;
- intended existing objects and new/changed objects;
- data/backfill impact;
- security/RLS/grant impact;
- verification and recovery notes.

## Completion checklist

- [ ] Feature and data impact documented.
- [ ] Live schema and ledger inspected.
- [ ] No already-applied migration modified or replayed.
- [ ] New migration has a fresh version.
- [ ] Backup/export restored successfully in isolated environment.
- [ ] SQL and data invariants validated in isolation.
- [ ] RLS, grants, RPC scope and negative authorization cases tested.
- [ ] UI/server action/browser flows tested.
- [ ] Production migration applied through approved path.
- [ ] Ledger and catalog verified; result recorded.

## Performance-advisor findings

The previous audit observed 55 unused indexes. This is not authorization to delete them. Review actual workload/query plans and index dependencies first; any index removal must be a separate measured optimization with a rollback plan.

The previous security-advisor finding was that leaked-password protection was disabled. Treat enabling it as a separate Auth security-hardening task; validate user impact and provider configuration before changing production Auth settings.
