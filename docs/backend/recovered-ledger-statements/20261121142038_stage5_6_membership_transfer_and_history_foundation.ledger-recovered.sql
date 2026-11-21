
create table if not exists public.membership_transfer_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_membership_id uuid not null references public.org_memberships(id) on delete restrict,
 source_org_id uuid not null references public.org_units(id) on delete restrict,
 destination_org_id uuid not null references public.org_units(id) on delete restrict,
 reason text,
 status text not null default 'pending_source'
   check (status in ('pending_source','pending_destination','approved','rejected','cancelled')),
 source_reviewed_by uuid references auth.users(id) on delete set null,
 source_reviewed_at timestamptz,
 destination_reviewed_by uuid references auth.users(id) on delete set null,
 destination_reviewed_at timestamptz,
 reviewer_notes text,
 resulting_membership_id uuid references public.org_memberships(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint transfer_different_orgs check (source_org_id <> destination_org_id)
);
create index if not exists membership_transfer_user_status_idx
 on public.membership_transfer_requests(user_id,status,created_at desc);
create index if not exists membership_transfer_source_org_idx
 on public.membership_transfer_requests(source_org_id,status,created_at desc);
create index if not exists membership_transfer_destination_org_idx
 on public.membership_transfer_requests(destination_org_id,status,created_at desc);

create table if not exists public.membership_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 membership_id uuid references public.org_memberships(id) on delete set null,
 org_id uuid not null references public.org_units(id) on delete restrict,
 event_type text not null check (event_type in
  ('membership_requested','membership_approved','membership_rejected','membership_suspended',
   'membership_reactivated','membership_ended','transfer_requested','transfer_released',
   'transfer_accepted','transfer_rejected')),
 actor_user_id uuid references auth.users(id) on delete set null,
 related_transfer_id uuid references public.membership_transfer_requests(id) on delete set null,
 details jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists membership_events_user_created_idx
 on public.membership_events(user_id,created_at desc);
create index if not exists membership_events_org_created_idx
 on public.membership_events(org_id,created_at desc);
create index if not exists membership_events_membership_idx
 on public.membership_events(membership_id);

alter table public.membership_transfer_requests enable row level security;
alter table public.membership_events enable row level security;

drop policy if exists "Members and scoped admins view transfer requests" on public.membership_transfer_requests;
create policy "Members and scoped admins view transfer requests"
 on public.membership_transfer_requests for select to authenticated
 using (user_id=(select auth.uid())
   or (select private.can_administer_org(source_org_id))
   or (select private.can_administer_org(destination_org_id)));

drop policy if exists "Members request their own membership transfers" on public.membership_transfer_requests;
create policy "Members request their own membership transfers"
 on public.membership_transfer_requests for insert to authenticated
 with check (
  user_id=(select auth.uid())
  and status='pending_source'
  and source_reviewed_by is null and source_reviewed_at is null
  and destination_reviewed_by is null and destination_reviewed_at is null
  and resulting_membership_id is null
  and exists (
   select 1 from public.org_memberships m
   join public.org_units src on src.id=m.org_id
   join public.org_units dst on dst.id=destination_org_id
   where m.id=source_membership_id and m.user_id=(select auth.uid())
    and m.org_id=source_org_id and m.status='active'
    and src.org_type in ('campus','church')
    and dst.org_type in ('campus','church') and dst.status='active'
  )
 );

drop policy if exists "Scoped administrators review transfers" on public.membership_transfer_requests;
create policy "Scoped administrators review transfers"
 on public.membership_transfer_requests for update to authenticated
 using (
  (status='pending_source' and (select private.can_administer_org(source_org_id)))
  or (status='pending_destination' and (select private.can_administer_org(destination_org_id)))
 )
 with check (
  (status in ('pending_source','pending_destination','approved','rejected')
   and ((select private.can_administer_org(source_org_id))
     or (select private.can_administer_org(destination_org_id))))
 );

drop policy if exists "Members and scoped admins view membership history" on public.membership_events;
create policy "Members and scoped admins view membership history"
 on public.membership_events for select to authenticated
 using (user_id=(select auth.uid()) or (select private.can_administer_org(org_id)));

revoke all on public.membership_transfer_requests from anon, authenticated;
grant select, insert, update on public.membership_transfer_requests to authenticated;
revoke all on public.membership_events from anon, authenticated;
grant select on public.membership_events to authenticated;
