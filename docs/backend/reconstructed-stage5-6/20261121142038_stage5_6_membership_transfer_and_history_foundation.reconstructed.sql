-- RECONSTRUCTED EVIDENCE ARTIFACT — NOT AN ORIGINAL APPLIED MIGRATION.
-- Reconstructed from repository documentation, later migration source, and live catalogue evidence.
-- Stored outside supabase/migrations/. DO NOT APPLY OR REPLAY.
-- Original applied SQL body/checksum was not recovered. NAASCONNECT V1.0 remains authoritative.

-- Reconstructed Stage 5.6 foundation: transfer requests and membership event history.
-- Basis: Stage 5.6 administration documentation; live columns, constraints, and foreign keys.
-- Later cancellation metadata (Stage 5.6.5) is intentionally excluded from this foundation.

create table public.membership_transfer_requests (
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

create table public.membership_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid references public.org_memberships(id) on delete set null,
  org_id uuid not null references public.org_units(id) on delete restrict,
  event_type text not null check (event_type = any (array[
    'membership_requested','membership_approved','membership_rejected',
    'transfer_requested','transfer_released','transfer_accepted','transfer_rejected'
  ]::text[])),
  actor_user_id uuid references auth.users(id) on delete set null,
  related_transfer_id uuid references public.membership_transfer_requests(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.membership_transfer_requests enable row level security;
alter table public.membership_events enable row level security;

create policy "Members and scoped admins view transfer requests"
on public.membership_transfer_requests for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_administer_org(source_org_id))
  or (select private.can_administer_org(destination_org_id))
);

create policy "Members and scoped admins view membership history"
on public.membership_events for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_administer_org(org_id))
);

revoke all on public.membership_transfer_requests from anon, authenticated;
revoke all on public.membership_events from anon, authenticated;
grant select, insert on public.membership_transfer_requests to authenticated;
grant select on public.membership_events to authenticated;
