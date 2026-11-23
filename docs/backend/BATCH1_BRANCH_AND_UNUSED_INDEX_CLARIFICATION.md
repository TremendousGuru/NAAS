# Batch 1 — clarification of Supabase branch and unused-index findings

**Date:** 2026-11-23  
**Project:** NAASCONNECT Nigeria / Supabase `csytneubatlaakpmnsfk`  
**Branch:** `feature/naasconnect-frontend-foundation`

## Direct answer

Neither the Supabase branch warning nor the 56 unused-index advisor findings are missing project files or duplicate Batch 1 implementations.

### Existing Supabase branch: `main` / `MIGRATIONS_FAILED`

This is a Supabase database branch/environment record, not a GitHub source file and not a table or migration. It is an existing non-production branch reported in a failed migration state. It does not, by itself, mean production is damaged or that Batch 1 cannot be completed.

It does mean this branch is not a trustworthy clean test target. Do not reset it, repair its ledger, replay migrations, or apply Batch 1 there as a shortcut. A clean disposable validation database is still needed.

### 56 unused-index advisor findings

These are PostgreSQL/Supabase performance-advisor observations about indexes that have not registered index scans in the available statistics window. They are not 56 files, not 56 broken migrations, and not proof that indexes are obsolete. Some may be used rarely, after statistics reset, or by workloads not represented in the observation window.

They do not block Batch 1. Do not drop them as part of Batch 1. Index removal would be a separate, measured performance-maintenance task with its own review.

## Fresh read-only facts relevant to Batch 1

1. The live ledger remains at Stage 5.7.2; no Batch 1 migration is present.
2. `profiles` already stores institution, course, study level and state of origin. The current onboarding milestone says category plus admission/residential/preferred region are in Auth metadata; that metadata is not a safe authorization source.
3. `org_memberships` has a unique organization/user key and current statuses `pending`, `active`, `suspended`, `ended`.
4. `membership_events` already has an allowed `membership_rejected` event type. Rejection history does not require a duplicate audit table.
5. The current self-insert RLS policy permits a pending basic membership at any active campus or church, but does not check the durable member category or region. This is the concrete policy gap.
6. The current review queue is read-only. The existing `manage_membership_status` RPC handles suspend/reactivate/terminate, not initial request approval/rejection.
7. The existing transfer RPC has explicit status assumptions and destination-membership reuse rules. Any new `rejected` membership status or same-organization resubmission path must be checked against transfer, reporting, directory, frontend and status filters before migration.
8. Current organization data contains one active national root, three pending unions and twenty pending zones; no active campus or church organizations are present. The schema can be built, but a real member request cannot pass strict eligibility until authorized campus/church records are verified and activated.

## V1.0 guardrails

- V1.0 is the authority; the implementation reconciliation register is not a scope amendment.
- One person/one account and multiple organization memberships remain supported.
- Organization hierarchy is configurable. Do not assume every church is a child of a campus or that every campus has exactly one church.
- Missing geography must not block onboarding; administrators can complete verified organizational relationships later.
- Email verification does not grant membership or administrative authority.
- Membership history stays in `membership_events`; do not add a duplicate history system.
- Organization applications remain separate from a member's request to join an existing organization.
- Preserve the service-role administrator appointment flow, transfer lifecycle and scoped authorization.

## What can proceed safely

The branch warning and unused-index findings do not require a project restart and do not block frontend work, documentation, SQL drafting or an isolated validation environment.

Production SQL still requires:
1. a complete dependent-callsite/status audit;
2. an exact migration and rollback script;
3. validation against a clean disposable database (the existing failed branch is unsuitable);
4. role-based positive/negative regression tests;
5. exact SQL review and approval before production application.

## Change-control status

Read-only inspection and this documentation only. No production schema/data/ledger changes; no branch reset; no index drops; no migration replay; no new paid branch.
