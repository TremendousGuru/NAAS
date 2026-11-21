# NAASCONNECT Nigeria — Stage 5.6 Membership Administration

**Stage:** 5.6 — Member Administration & Organizational Membership Management  
**Status:** Backend foundation implemented; workflow RPCs and frontend remain in progress.  
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

Initial transfer states: `pending_source`, `pending_destination`, `approved`, `rejected`, `cancelled`.

A member may request a transfer only for their own active campus/church membership and to an active campus/church destination. Requests are visible to the member and administrators authorized over either endpoint.

Direct authenticated UPDATE is intentionally disabled until the scoped, transactional review RPC is implemented. This prevents a client from altering review outcomes or bypassing the source/destination approval sequence.

### Membership history
`public.membership_events` stores a durable event timeline for membership requests, approvals, status changes, and transfers. Authenticated users may read their own history; scoped administrators may read history for their organizations. Direct client inserts are not granted.

### Security and indexes
- RLS enabled on both new tables.
- No anonymous table access.
- Transfer requests: member-owned insert only, pending initial state, validated active source membership and active destination campus/church.
- No direct client update to transfer requests.
- No direct client insert to membership history.
- Foreign-key indexes added for transfer reviewer/source/result references and event actor/transfer references.

## Applied migrations

- `20261121151800_stage5_6_membership_transfer_and_history_foundation`
- `20261121151900_stage5_6_1_lock_transfer_updates_pending_scoped_rpc`
- `20261121152000_stage5_6_2_membership_fk_performance_indexes`

## Verification

- RLS enabled on both tables.
- Authenticated UPDATE on transfer requests: denied.
- Authenticated INSERT on membership events: denied.
- Anonymous access: no grants.
- Security advisor: no findings.
- Health advisor: no findings.
- Performance advisor: six new unindexed-FK findings addressed with indexes. Existing unused-index notices remain informational on a low-traffic/new project.
- No live membership/transfer/event rows were seeded.

## Remaining Stage 5.6 work

1. Implement transactional source-release and destination-acceptance RPCs.
2. Ensure approved transfer atomically ends the source membership and creates/activates destination membership without changing the person's Auth identity.
3. Add member-initiated cancellation and authorized rejection with audit events.
4. Add authorized membership status management (suspend/reactivate/end) with reason and audit.
5. Add scoped directory/search and aggregate membership statistics that disclose only approved profile fields.
6. Add organization-level membership review queues and reporting.
7. Test role boundaries and complete workflows with controlled test accounts.
8. Build the member administration UI in the frontend phase.

**Important:** The current implementation is the secure data foundation, not a claim that the entire Stage 5.6 user workflow is finished.
