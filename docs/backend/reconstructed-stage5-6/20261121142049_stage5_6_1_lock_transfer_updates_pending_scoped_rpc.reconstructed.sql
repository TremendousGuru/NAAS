-- RECONSTRUCTED EVIDENCE ARTIFACT — NOT AN ORIGINAL APPLIED MIGRATION.
-- Reconstructed from repository documentation, later migration source, and live catalogue evidence.
-- Stored outside supabase/migrations/. DO NOT APPLY OR REPLAY.
-- Original applied SQL body/checksum was not recovered. NAASCONNECT V1.0 remains authoritative.

-- Reconstructed Stage 5.6.1 transfer submission and direct-mutation guardrails.
-- Exact original SQL was not recovered. This is a behaviour-level reconstruction from
-- the Stage 5.6 documentation and live policy/grant state, not a byte-identical source.

create policy "Members request their own membership transfer"
on public.membership_transfer_requests for insert to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'pending_source'
  and exists (
    select 1
    from public.org_memberships m
    join public.org_units source_org on source_org.id = m.org_id
    join public.org_units destination_org on destination_org.id = destination_org_id
    where m.id = source_membership_id
      and m.user_id = (select auth.uid())
      and m.org_id = source_org_id
      and m.status = 'active'
      and source_org.org_type in ('campus','church')
      and destination_org.status = 'active'
      and destination_org.org_type in ('campus','church')
      and source_org_id <> destination_org_id
  )
);

-- Requests can be created and read by the member, but clients cannot change review state.
revoke update, delete, truncate, references, trigger
on public.membership_transfer_requests from authenticated;
grant select, insert on public.membership_transfer_requests to authenticated;

-- Event history is readable under RLS and written only by trusted database functions.
revoke insert, update, delete, truncate, references, trigger
on public.membership_events from authenticated;
grant select on public.membership_events to authenticated;

revoke all on public.membership_transfer_requests from anon;
revoke all on public.membership_events from anon;
