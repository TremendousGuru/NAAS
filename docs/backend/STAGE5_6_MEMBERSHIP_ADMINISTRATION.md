# NAASCONNECT Nigeria — Stage 5.6 Membership Administration

**Stage:** 5.6 — Member Administration & Organizational Membership Management  
**Status:** Transfer review engine implemented; full member-facing workflows and controlled-account end-to-end tests remain pending.  
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

## Remaining Stage 5.6 work

1. Add member-initiated cancellation and authorized rejection coverage with audit events.
2. Add authorized membership status management (suspend/reactivate/end) with reason and audit.
3. Add scoped directory/search and aggregate membership statistics that disclose only approved profile fields.
4. Add organization-level membership review queues and reporting.
5. Test complete workflows and role boundaries with controlled test accounts.
6. Build the member administration UI in the frontend phase.

**Important:** Stage 5.6.3's database engine is implemented, but the whole Stage 5.6 feature set is not yet complete.
