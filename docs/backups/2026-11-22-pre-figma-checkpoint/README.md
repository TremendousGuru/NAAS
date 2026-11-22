# NAASCONNECT pre-Figma backup checkpoint

- Captured: 2026-11-22T08:07:14.474Z
- Supabase project: NAAS (csytneubatlaakpmnsfk), eu-west-1, PostgreSQL 17.12.0.000, ACTIVE_HEALTHY
- GitHub repository: TremendousGuru/NAAS
- GitHub baseline commit: fca25c36798a1d8c58565285a7f52553f4da5c95
- GitHub snapshot branch: backup/2026-11-22-pre-figma
- Live migration ledger entries: 29
- Public schema table count: 14

## Scope and limitations
This is a read-only structural evidence capture, not a full restorable Supabase backup. It records table/column/constraint information, remote migration ledger and catalog definitions for schemas, views, functions, policies, indexes, triggers, types and RLS flags. It intentionally does not export application row data, auth user records, storage objects/buckets, secrets, environment variables, edge-function deployment bundles or provider configuration. No Supabase database writes, migrations, branches or paid resources were created.

A full backup still requires a Supabase-managed backup/PITR restore point (if included in the plan) and a separate downloadable database dump including data, plus Storage object export and secure secrets/config inventory. Validate restoration in a separate approved environment before relying on it.

## GitHub recovery point
The snapshot branch points to the exact main commit above. It preserves all tracked repository content as of that commit. GitHub history remains the source-control history; this branch is a named recovery pointer, not a downloadable offline archive. For independent disaster recovery, also download a repository ZIP or perform a git clone --mirror locally and store it in at least two controlled locations.

## Future checkpoint policy
Create a new named GitHub recovery point and Supabase backup/export checkpoint after each approved major milestone: (1) Figma design approval, (2) frontend shell and auth integration, (3) each major feature group, (4) pre-production integration, (5) pre-release, and (6) final handover. For Supabase, capture managed backup/PITR reference, schema-only dump, full data dump, storage export and migration ledger together. Record timestamp, commit SHA, project ref, file hashes, restoration test and owner approval. Never treat a schema inventory alone as a restorable backup.
