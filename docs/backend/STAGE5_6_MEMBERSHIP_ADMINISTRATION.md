# NAASCONNECT Nigeria — Stage 5.6 Membership Administration

**Stage:** 5.6 — Member Administration & Organizational Membership Management  
**Status:** Membership transfer cancellation, two-stage review/rejection, status-management backend RPCs and audit history are implemented; scoped directory/reporting, controlled-account end-to-end tests and UI remain pending.  
**Supabase project:** NAAS (`csytneubatlaakpmnsfk`)  
**GitHub repository:** `TremendousGuru/NAAS`

## Existing foundation reused

- `public.profiles` remains the single person profile linked to Supabase Auth.
- `public.org_memberships` remains the authoritative organization membership table, supporting multiple organization memberships per user and statuses: pending, active, suspended, ended.
- Existing RLS allows members to view their own membership and authorized administrators to view memberships within their jurisdiction. Member self-enrollment remains limited to active campus/church organizations.
- Existing `private.can_administer_org` hierarchy helper is reused for scoped authorization.

## Added in this stage

### Membership transfer requests
`public.membership_transfer_requests` records a member-initiated move between campus/church organizations, including source and destination, review state, reviewer identities/timestamps, notes, and resulting membership reference.

Transfer states: `pending_source`, `pending_destination`, `approved`, `rejected`, `cancelled`.

A member may request a transfer only for their own active campus/church membership and to an active campus/church destination. Requests are visible to the member and administrators authorized over either endpoint.

### Stage 5.6.3 — Transactional transfer review engine

Added `public.review_membership_transfer(p_transfer_id, p_decision, p_reviewer_notes)`.

- Source-stage review requires an administrator authorized over the source organization.
- Source approval advances the request from `pending_source` to `pending_destination`; it does not prematurely release the member.
- Source rejection marks the request rejected and records an audit event.
- Destination-stage review requires an administrator authorized over the destination organization.
- Destination rejection marks the request rejected and records an audit event.
- Destination approval revalidates that the source membership is still active and the destination remains an active campus/church.
- Final approval atomically ends the source membership, creates or reactivates an ended destination membership, completes the request, and writes outgoing/incoming membership history events.
- If the destination already has a membership in a state other than `ended`, final approval fails rather than overwriting an active, suspended or pending record.
- The user's Supabase Auth identity and profile are not changed.

The public RPC is a `SECURITY INVOKER` wrapper. The implementation is held in the non-public `private` schema as a narrowly scoped `SECURITY DEFINER` function with an empty search path, explicit authentication and jurisdiction checks, row locks, and schema-qualified references. This is necessary because final approval updates both organizations' membership records in one transaction while direct client updates to transfer requests remain disabled.

### Membership history
`public.membership_events` stores a durable event timeline for membership requests, approvals, status changes, and transfers. Authenticated users may read their own history; scoped administrators may read history for their organizations. Direct client inserts are not granted.

### Security and indexes
- RLS enabled on both new tables.
- No anonymous table access.
- Transfer requests: member-owned insert only, pending initial state, validated active source membership and active destination campus/church.
- No direct authenticated UPDATE on transfer requests.
- No direct authenticated INSERT on membership history.
- Foreign-key indexes added for transfer reviewer/source/result references and event actor/transfer references.

## Applied migrations

- `20261121151800_stage5_6_membership_transfer_and_history_foundation`
- `20261121151900_stage5_6_1_lock_transfer_updates_pending_scoped_rpc`
- `20261121152000_stage5_6_2_membership_fk_performance_indexes`
- `20261121145225_stage5_6_3_transactional_membership_transfer_review`

## Verification

- Migration applied successfully.
- Authenticated role can execute the public review RPC; anonymous role cannot.
- Public RPC is SECURITY INVOKER; internal implementation is in the private schema.
- Internal function rejects unauthenticated callers and validates authorization against the source/destination organization using `private.can_administer_org`.
- Security advisor: zero findings.
- Health advisor: zero findings.
- Performance advisor: remaining notices are informational unused-index reports on the currently low-traffic project; no new missing-index finding was returned for this change.
- No real membership, transfer or event rows were seeded or altered.

**Testing limitation:** No controlled source-admin, destination-admin and member test accounts were available in this execution context. Therefore, the successful end-to-end path and negative cross-jurisdiction scenarios still require controlled test accounts before Stage 5.6 can be closed.


### Stage 5.6.4 — Membership suspension, reactivation and termination

Added `public.manage_membership_status(p_membership_id, p_action, p_reason)` with the private implementation `private.manage_membership_status(...)`.

Supported transitions:
- `suspend`: active → suspended.
- `reactivate`: suspended → active.
- `terminate`: active or suspended → ended.
- Pending memberships cannot be changed through this operation; ended memberships cannot be reactivated through this operation.

Authorization and safeguards:
- Requires an authenticated actor and an active administrator authorized over the membership's organization through `private.can_administer_org`. The existing hierarchy permits higher-level administrators to manage subordinate organizations, while unrelated organizations remain out of scope.
- Administrators cannot change their own membership status through this RPC.
- A non-empty reason of 10–1000 characters is mandatory.
- The target membership row is locked during transition; invalid or stale transitions fail without partial updates.
- The public RPC is SECURITY INVOKER. Its implementation is in the non-public `private` schema as SECURITY DEFINER, with an empty search path and schema-qualified relations. Anonymous execution is revoked; authenticated execution is explicitly granted.
- The membership row records the latest status reason, actor and timestamp. Each transition also inserts a durable `membership_events` record with previous status, new status and reason in the same transaction.

Database changes:
- Added nullable `status_reason`, `status_changed_by`, and `status_changed_at` columns to `public.org_memberships`.
- Added a reason-length constraint and an index for the `status_changed_by` foreign key.
- Reused the existing event constraint values `membership_suspended`, `membership_reactivated`, and `membership_ended`.

Applied migrations:
- `20261121145523_stage5_6_4_membership_status_lifecycle` — [SQL migration](../../supabase/migrations/20261121145523_stage5_6_4_membership_status_lifecycle.sql)
- `20261121145544_stage5_6_4_membership_status_actor_index` — [SQL migration](../../supabase/migrations/20261121145544_stage5_6_4_membership_status_actor_index.sql)
- `20261121145638_stage5_6_4_1_reject_null_status_action` — [SQL migration](../../supabase/migrations/20261121145638_stage5_6_4_1_reject_null_status_action.sql)

Verification:
- All three Stage 5.6.4 migrations applied successfully.
- Confirmed the three new membership columns and the event-type constraint.
- Confirmed public wrapper is SECURITY INVOKER and private implementation is SECURITY DEFINER.
- Confirmed authenticated role can execute the public RPC and anonymous role cannot; the private implementation is not executable by anon.
- Unauthenticated-call guard test passed (SQLSTATE 28000); explicit NULL-action rejection test passed (SQLSTATE 22023); no membership rows were changed or seeded.
- Security advisor: zero findings. Health advisor: zero findings.
- Performance advisor initially identified the new status-actor foreign key as unindexed; added the covering index. Remaining performance notices are informational unused-index reports.

**Testing limitation:** No controlled administrator/member test accounts were available. Therefore, full successful transition tests and negative cross-jurisdiction tests (including unrelated-admin denial and self-change denial) remain required before closing the broader Stage 5.6 workflow.


### Stage 5.6.5 — Member cancellation and complete transfer rejection coverage

Implemented the member-facing cancellation RPC and hardened both administrator review stages.

**Member-initiated cancellation**
- Added `public.cancel_membership_transfer(p_transfer_id, p_cancellation_reason)` with the implementation in `private.cancel_membership_transfer(...)`.
- Only the authenticated user who owns the transfer request may cancel it.
- Cancellation is permitted while the request is `pending_source` or `pending_destination`; approved, rejected or already-cancelled requests cannot be cancelled again.
- A reason of 10–1000 characters is required and stored with the request, actor and timestamp.
- The cancellation and `transfer_cancelled` audit event are written in one transaction. The source membership remains unchanged.

**Administrator rejection**
- Source-stage rejection requires an administrator authorized over the source organization.
- Destination-stage rejection requires an administrator authorized over the destination organization.
- Rejection requires a reason of 10–1000 characters; reviewer, timestamp, stage and reason are recorded.
- Row locking and pending-stage checks prevent duplicate or stale review actions.
- Approval remains a two-stage process and retains final source/destination revalidation.

**Audit constraint correction**
- Expanded `membership_events_event_type_check` to include event types already emitted by the transfer-review engine: `transfer_source_approved`, `transfer_completed_out`, and `transfer_completed_in`, plus the new `transfer_cancelled` event.
- This fixes a pre-existing constraint mismatch that could have caused source approval and completed transfer operations to fail when inserting their audit records.

**Database changes and migrations**
- Added `cancelled_by`, `cancelled_at`, and `cancellation_reason` to `public.membership_transfer_requests`.
- Added a cancellation-reason length constraint and an index for the cancellation actor foreign key.
- `20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening` — [SQL migration](../../supabase/migrations/20261121145919_stage5_6_5_transfer_cancellation_and_rejection_hardening.sql)
- `20261121145933_stage5_6_5_1_cancelled_by_fk_index` — [SQL migration](../../supabase/migrations/20261121145933_stage5_6_5_1_cancelled_by_fk_index.sql)

**Security and verification**
- Public RPC wrappers are SECURITY INVOKER; private implementations are SECURITY DEFINER with an empty search path and schema-qualified objects.
- Anonymous execution is revoked; authenticated execution is explicitly granted.
- Cancellation checks `auth.uid() = request.user_id` inside the privileged function; review checks jurisdiction using `private.can_administer_org`.
- Confirmed migration history, cancellation columns, expanded event constraint, function security modes and grants.
- Guard tests passed for unauthenticated cancellation (SQLSTATE 28000), invalid cancellation reason (SQLSTATE 22023), null review decision (SQLSTATE 22023), and rejection without a valid reason (SQLSTATE 22023).
- Security advisor: zero findings. Health advisor: zero findings. Performance advisor: no remaining unindexed-foreign-key finding after adding the cancellation actor index; remaining notices are informational unused-index reports.

**Testing limitation:** No controlled member/source-admin/destination-admin test accounts or transfer fixtures were available. Full end-to-end tests are still required for owner cancellation at both pending stages, non-owner cancellation denial, source and destination rejection, unrelated-admin denial, and successful two-stage approval. No production membership or transfer rows were seeded or changed during verification.

## Remaining Stage 5.6 work

1. Add scoped directory/search and aggregate membership statistics that disclose only approved profile fields.
2. Add organization-level membership review queues and reporting.
3. Test complete workflows and role boundaries with controlled test accounts.
4. Build the member administration UI in the frontend phase.

**Important:** Stage 5.6.3's database engine is implemented, but the whole Stage 5.6 feature set is not yet complete.
