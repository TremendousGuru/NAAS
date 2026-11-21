
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.org_units (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid null references public.org_units(id) on delete restrict,
  org_type text not null check (org_type in ('national','union','zone','campus','church')),
  name text not null check (length(trim(name)) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+([a-z0-9-]*[a-z0-9])?$'),
  status text not null default 'pending' check (status in ('pending','active','suspended','archived')),
  state_name text,
  conference_name text,
  institution_name text,
  contact_email text,
  whatsapp_url text,
  website_url text,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint org_units_not_own_parent check (parent_id is null or parent_id <> id)
);

create index org_units_parent_id_idx on public.org_units(parent_id);
create index org_units_type_status_idx on public.org_units(org_type, status);
create index org_units_state_idx on public.org_units(state_name);

create table public.org_memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.org_units(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'member',
    'national_admin','national_president','national_executive',
    'union_admin','union_president','union_executive',
    'zone_admin','zone_president','zone_executive',
    'campus_admin','campus_president','campus_executive',
    'church_admin','church_elder','church_pastor','church_member'
  )),
  status text not null default 'pending' check (status in ('pending','active','suspended','ended')),
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index org_memberships_user_status_idx on public.org_memberships(user_id, status);
create index org_memberships_org_role_status_idx on public.org_memberships(org_id, role, status);

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger org_units_touch_updated_at
before update on public.org_units
for each row execute function private.touch_updated_at();

create trigger org_memberships_touch_updated_at
before update on public.org_memberships
for each row execute function private.touch_updated_at();

create or replace function private.validate_org_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_type text;
begin
  if new.org_type = 'national' then
    if new.parent_id is not null then
      raise exception 'A national organization cannot have a parent';
    end if;
    return new;
  end if;

  if new.parent_id is null then
    raise exception 'Only a national organization may be a root organization';
  end if;

  select org_type into parent_type
  from public.org_units
  where id = new.parent_id;

  if parent_type is null then
    raise exception 'Parent organization does not exist';
  end if;

  if (new.org_type = 'union' and parent_type <> 'national')
    or (new.org_type = 'zone' and parent_type <> 'union')
    or (new.org_type in ('campus','church') and parent_type <> 'zone') then
    raise exception 'Invalid organization hierarchy: % cannot be a child of %', new.org_type, parent_type;
  end if;

  return new;
end;
$$;

create trigger org_units_validate_parent
before insert or update of parent_id, org_type on public.org_units
for each row execute function private.validate_org_parent();

create or replace function private.validate_membership_role()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_type text;
begin
  select org_type into target_type
  from public.org_units
  where id = new.org_id;

  if target_type is null then
    raise exception 'Organization does not exist';
  end if;

  if not (
    (target_type = 'national' and new.role in ('member','national_admin','national_president','national_executive'))
    or (target_type = 'union' and new.role in ('member','union_admin','union_president','union_executive'))
    or (target_type = 'zone' and new.role in ('member','zone_admin','zone_president','zone_executive'))
    or (target_type = 'campus' and new.role in ('member','campus_admin','campus_president','campus_executive'))
    or (target_type = 'church' and new.role in ('church_admin','church_elder','church_pastor','church_member'))
  ) then
    raise exception 'Role % is not valid for organization type %', new.role, target_type;
  end if;

  return new;
end;
$$;

create trigger org_memberships_validate_role
before insert or update of org_id, role on public.org_memberships
for each row execute function private.validate_membership_role();

create or replace function private.can_administer_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  with recursive ancestors(id, org_type, parent_id) as (
    select o.id, o.org_type, o.parent_id
    from public.org_units o
    where o.id = target_org_id
    union all
    select p.id, p.org_type, p.parent_id
    from public.org_units p
    join ancestors a on a.parent_id = p.id
  )
  select exists (
    select 1
    from ancestors a
    join public.org_memberships m on m.org_id = a.id
    where m.user_id = (select auth.uid())
      and m.status = 'active'
      and (
        (a.org_type = 'national' and m.role = 'national_admin')
        or (a.org_type = 'union' and m.role = 'union_admin')
        or (a.org_type = 'zone' and m.role = 'zone_admin')
        or (a.org_type = 'campus' and m.role = 'campus_admin')
        or (a.org_type = 'church' and m.role = 'church_admin')
      )
  );
$$;

revoke all on function private.can_administer_org(uuid) from public, anon;
grant execute on function private.can_administer_org(uuid) to authenticated;

alter table public.org_units enable row level security;
alter table public.org_memberships enable row level security;

revoke all on public.org_units from anon, authenticated;
revoke all on public.org_memberships from anon, authenticated;
grant select on public.org_units to authenticated;
grant insert, update on public.org_units to authenticated;
grant select, insert, update on public.org_memberships to authenticated;

create policy "Active organizations visible to signed-in members"
on public.org_units for select to authenticated
using (status = 'active' or (select private.can_administer_org(id)));

create policy "Scoped administrators create child organizations"
on public.org_units for insert to authenticated
with check (
  parent_id is not null
  and (select private.can_administer_org(parent_id))
  and status = 'pending'
);

create policy "Scoped administrators update organizations"
on public.org_units for update to authenticated
using ((select private.can_administer_org(id)))
with check ((select private.can_administer_org(id)));

create policy "Members see own membership and scoped membership rosters"
on public.org_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_administer_org(org_id))
);

create policy "Scoped administrators add memberships"
on public.org_memberships for insert to authenticated
with check (
  status = 'pending'
  and (select private.can_administer_org(org_id))
);

create policy "Scoped administrators update memberships"
on public.org_memberships for update to authenticated
using ((select private.can_administer_org(org_id)))
with check ((select private.can_administer_org(org_id)));

-- Seed only the national root node. Geographic subdivisions remain data-driven
-- until the authoritative national/union/zonal directory is supplied and validated.
insert into public.org_units (org_type, name, slug, status, description)
values (
  'national',
  'Nigeria Association of Adventist Students',
  'naas-nigeria',
  'active',
  'National root organization for NAASCONNECT. Union, zone, campus and church records are onboarded beneath this node after jurisdiction verification.'
)
on conflict (slug) do nothing;
