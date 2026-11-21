# NAASCONNECT — Out-of-band Organizational Foundation Execution Evidence

**Supabase project:** `csytneubatlaakpmnsfk`  
**Repository:** `TremendousGuru/NAAS`  
**Evidence source:** Supabase PostgreSQL logs, read-only query  
**Window inspected:** 21 November 2026, 12:20–13:05 UTC  
**Disposition:** Execution-log evidence preserved; not a migration-ledger entry and not approved for replay.

## Log evidence

The PostgreSQL logs contain two successful management-API statement records:

1. **2026-11-21 12:28:48.007 UTC** — organizational foundation SQL creating the `private` schema, `public.org_units`, `public.org_memberships`, helper functions, triggers, RLS, grants, policies, and the national root row. Source annotation in the log: `POST /mcp`.
   - Preserved SQL: [out-of-band foundation execution](20261121122848_org_foundation_out_of_band_execution.ledger-log-recovered.sql)
2. **2026-11-21 12:29:14.311 UTC** — follow-up indexes for `org_units.created_by` and `org_memberships.approved_by`. Source annotation in the log: `POST /mcp`.
   - Preserved SQL: [index follow-up](20261121122914_org_foundation_index_followup.ledger-log-recovered.sql)

These records establish that the organizational foundation was executed through the management API before the Stage 5.1 provisional-geography migration, but outside the 29-row migration ledger.

## Comparison with repository-only `org_foundation.sql`

The committed file `supabase/migrations/20261121133000_org_foundation.sql` is related to the executed foundation, but it is **not an exact copy** of the logged SQL:

- The logged `org_units.parent_id` declaration includes explicit `NULL`; the committed file omits the explicit keyword.
- The two `created_by` / `approved_by` indexes were separate follow-up statements in the logs and use `CREATE INDEX IF NOT EXISTS`; the repository file places them in the main file and omits `IF NOT EXISTS`.
- The logged `org_units` privileges are granted in separate `SELECT` and `INSERT, UPDATE` statements; the repository file combines them.
- The national root description text differs.
- The logged execution consists of 62 semicolon-delimited statements across two API calls; the committed file has a different statement packaging.

These differences are recorded rather than silently treating the repository file as the exact executed source. The recovered log SQL is the stronger evidence of the statements actually submitted.

## Safety

- The SQL payloads are stored under `docs/backend/recovered-baseline-logs/`, outside `supabase/migrations/`.
- No SQL was replayed or applied during this recovery.
- No migration ledger row was added or edited.
- No schema/data was changed.
- Do not move these files into the active migration runner.
- NAASCONNECT V1.0 remains authoritative.
