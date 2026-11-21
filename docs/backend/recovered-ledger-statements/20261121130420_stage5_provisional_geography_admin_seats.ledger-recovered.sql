-- NAASCONNECT Stage 5.1: provisional geography + reserved administrator seats
-- No Auth users or passwords are created here. Credentials are issued only to verified appointees at handover.
create table if not exists public.org_admin_seats (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.org_units(id) on delete restrict,
  username text not null unique check (username ~ '^admin\.[a-z0-9]+([.-][a-z0-9]+)*$'),
  admin_role text not null check (admin_role in ('national_admin','union_admin','zone_admin','campus_admin','church_admin')),
  approval_org_id uuid not null references public.org_units(id) on delete restrict,
  status text not null default 'reserved' check (status in ('reserved','awaiting_appointee','pending_approval','active','suspended','retired')),
  credential_policy text not null default 'handover_default_then_mandatory_change',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists org_admin_seats_approval_org_idx on public.org_admin_seats(approval_org_id,status);
alter table public.org_admin_seats enable row level security;
revoke all on public.org_admin_seats from anon, authenticated;
grant select on public.org_admin_seats to authenticated;
create policy "Scoped administrators view admin seats"
on public.org_admin_seats for select to authenticated
using ((select private.can_administer_org(org_id)) or (select private.can_administer_org(approval_org_id)));

-- Union units must be children of the national root.
insert into public.org_units(parent_id,org_type,name,slug,status,description,metadata)
select n.id,v.org_type,v.name,v.slug,'active',v.description,
'{"provisional":true,"source":"user-provided NAAS territorial working list"}'::jsonb
from public.org_units n
cross join (values
('union','Western Nigeria Union Conference','wnuc','Provisional union record; confirm current official boundaries and nomenclature before public launch.'),
('union','Eastern Nigeria Union Conference','enuc','Provisional union record; confirm current official boundaries and nomenclature before public launch.'),
('union','Northern Nigeria Union Conference','nnuc','Provisional union record; confirm current official boundaries and nomenclature before public launch.')
) as v(org_type,name,slug,description)
where n.slug='naas-nigeria'
on conflict(slug) do nothing;

with u as (select id from public.org_units where slug='wnuc'),
z(name,slug,state_name,conference_name) as (values
('Lagos Zone','lagos-zone','Lagos','Lagos East Atlantic; Lagos West Atlantic; Lagos North Mainland; Lagos South Mainland'),
('Ogun Zone','ogun-zone','Ogun','Ogun Conference'),
('Oyo Zone','oyo-zone','Oyo','Oyo Conference'),
('Osun Zone','osun-zone','Osun','Osun Conference'),
('Ondo Zone','ondo-zone','Ondo','Ondo Mission'),
('Ekiti Zone','ekiti-zone','Ekiti','Ekiti Conference'),
('Kwara / Kogi Zone','kwara-kogi-zone','Kwara; Kogi','Kwara Conference; Kogi Region'),
('Edo Zone','edo-zone','Edo','Edo Conference'),
('Delta Zone','delta-zone','Delta','Delta Conference'))
insert into public.org_units(parent_id,org_type,name,slug,status,state_name,conference_name,metadata)
select u.id,'zone',z.name,z.slug,'active',z.state_name,z.conference_name,
jsonb_build_object('provisional',true,'source','user-provided NAAS territorial working list')
from u cross join z on conflict(slug) do nothing;

with u as (select id from public.org_units where slug='nnuc'),
z(name,slug,state_name,conference_name) as (values
('North-East Nigeria Zone','north-east-nigeria-zone','Plateau; Bauchi; Adamawa; Gombe; Taraba; Borno; Jigawa; Yobe','Plateau-Bauchi Nigeria Conference; Savannah Mission Conference'),
('North-Central Nigeria Zone','north-central-nigeria-zone','FCT Abuja; Niger; Nasarawa; Benue','Abuja East Nigeria Conference; Abuja West Conference'),
('North-West Nigeria Zone','north-west-nigeria-zone','Kaduna; Kano; Katsina; Kebbi; Sokoto; Zamfara','Kaduna East Conference; Kaduna West Conference'))
insert into public.org_units(parent_id,org_type,name,slug,status,state_name,conference_name,metadata)
select u.id,'zone',z.name,z.slug,'active',z.state_name,z.conference_name,
jsonb_build_object('provisional',true,'source','user-provided NAAS territorial working list')
from u cross join z on conflict(slug) do nothing;

with u as (select id from public.org_units where slug='enuc'),
z(name,slug,state_name,conference_name) as (values
('Abia Zone','abia-zone','Abia','Aba East; Aba North; Aba South; Aba West; Abia North-Central'),
('Rivers & Bayelsa Zone','rivers-bayelsa-zone','Rivers; Bayelsa','Port Harcourt East; Port Harcourt West; Rivers East; Rivers North; Rivers West-Central; Bayelsa'),
('Imo Zone','imo-zone','Imo','Imo Conference'),
('Akwa Ibom Zone','akwa-ibom-zone','Akwa Ibom','Akwa Ibom Conference'),
('Cross River Zone','cross-river-zone','Cross River','Cross River Conference; Northern Cross River Mission'),
('Anambra Zone','anambra-zone','Anambra','Anambra Conference'),
('Enugu Zone','enugu-zone','Enugu','Enugu Conference'),
('Ebonyi Zone','ebonyi-zone','Ebonyi','Ebonyi Conference'))
insert into public.org_units(parent_id,org_type,name,slug,status,state_name,conference_name,metadata)
select u.id,'zone',z.name,z.slug,'active',z.state_name,z.conference_name,
jsonb_build_object('provisional',true,'source','user-provided NAAS territorial working list')
from u cross join z on conflict(slug) do nothing;

insert into public.org_admin_seats(org_id,username,admin_role,approval_org_id,status,metadata)
select o.id,
  case when o.org_type='national' then 'admin.national' else 'admin.' || o.slug end,
  case o.org_type when 'national' then 'national_admin' when 'union' then 'union_admin' when 'zone' then 'zone_admin' end,
  case when o.org_type='zone' then o.parent_id else (select id from public.org_units where slug='naas-nigeria') end,
  'reserved',
  jsonb_build_object('default_password_policy','123456789 temporary at approved handover only; mandatory change before admin privileges','requires_verified_email',true)
from public.org_units o where o.org_type in ('national','union','zone')
on conflict(org_id) do nothing;

create trigger org_admin_seats_touch_updated_at before update on public.org_admin_seats
for each row execute function private.touch_updated_at();