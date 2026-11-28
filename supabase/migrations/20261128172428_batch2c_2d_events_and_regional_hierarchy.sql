-- Batch 2C/2D and regional classification foundation.
create table if not exists public.org_state_coverage (
  state_name text primary key,
  zone_org_id uuid not null references public.org_units(id) on delete restrict,
  union_org_id uuid not null references public.org_units(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint org_state_coverage_state_length check (char_length(btrim(state_name)) between 2 and 40)
);
alter table public.org_state_coverage enable row level security;
drop policy if exists org_state_coverage_authenticated_read on public.org_state_coverage;
create policy org_state_coverage_authenticated_read on public.org_state_coverage for select to authenticated using (true);
revoke all on public.org_state_coverage from anon, public;
grant select on public.org_state_coverage to authenticated;

insert into public.org_state_coverage(state_name,zone_org_id,union_org_id)
select v.state_name,z.id,z.parent_id from (values
 ('Abia','Abia Zone'),('Akwa Ibom','Akwa Ibom Zone'),('Anambra','Anambra Zone'),('Cross River','Cross River Zone'),
 ('Delta','Delta Zone'),('Ebonyi','Ebonyi Zone'),('Edo','Edo Zone'),('Ekiti','Ekiti Zone'),('Enugu','Enugu Zone'),
 ('Imo','Imo Zone'),('Kogi','Kwara / Kogi Zone'),('Kwara','Kwara / Kogi Zone'),('Lagos','Lagos Zone'),('Ogun','Ogun Zone'),
 ('Ondo','Ondo Zone'),('Osun','Osun Zone'),('Oyo','Oyo Zone'),('Rivers','Rivers & Bayelsa Zone'),('Bayelsa','Rivers & Bayelsa Zone'),
 ('FCT','North-Central Nigeria Zone'),('Nasarawa','North-Central Nigeria Zone'),('Niger','North-Central Nigeria Zone'),('Benue','North-Central Nigeria Zone'),
 ('Plateau','North-East Nigeria Zone'),('Bauchi','North-East Nigeria Zone'),('Adamawa','North-East Nigeria Zone'),('Gombe','North-East Nigeria Zone'),
 ('Taraba','North-East Nigeria Zone'),('Borno','North-East Nigeria Zone'),('Jigawa','North-East Nigeria Zone'),('Yobe','North-East Nigeria Zone'),
 ('Kaduna','North-West Nigeria Zone'),('Kano','North-West Nigeria Zone'),('Katsina','North-West Nigeria Zone'),('Kebbi','North-West Nigeria Zone'),
 ('Sokoto','North-West Nigeria Zone'),('Zamfara','North-West Nigeria Zone')
) as v(state_name,zone_name)
join public.org_units z on z.name=v.zone_name and z.org_type='zone' and z.status='active'
where z.parent_id is not null
on conflict(state_name) do update set zone_org_id=excluded.zone_org_id,union_org_id=excluded.union_org_id;

alter table public.profiles
 add column if not exists assigned_zone_id uuid references public.org_units(id) on delete set null,
 add column if not exists assigned_union_id uuid references public.org_units(id) on delete set null,
 add column if not exists regional_assignment_status text not null default 'unclassified';
alter table public.profiles drop constraint if exists profiles_regional_assignment_status_check;
alter table public.profiles add constraint profiles_regional_assignment_status_check check(regional_assignment_status in ('classified','unclassified','needs_review'));

create or replace function private.assign_profile_region()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare v_state text; v_zone uuid; v_union uuid;
begin
 v_state:=case when new.member_category='student' then nullif(btrim(new.state_of_admission),'')
  when new.member_category='non_student' then nullif(btrim(coalesce(new.preferred_region_state,new.residential_state)),'') else null end;
 if v_state is not null then
  select c.zone_org_id,c.union_org_id into v_zone,v_union from public.org_state_coverage c where lower(c.state_name)=lower(v_state) limit 1;
 else v_zone:=null; v_union:=null; end if;
 new.assigned_zone_id:=v_zone; new.assigned_union_id:=v_union;
 new.regional_assignment_status:=case when v_zone is not null and v_union is not null then 'classified' else 'unclassified' end;
 return new;
end;
$function$;
drop trigger if exists profiles_assign_region on public.profiles;
create trigger profiles_assign_region before insert or update of member_category,state_of_admission,residential_state,preferred_region_state
on public.profiles for each row execute function private.assign_profile_region();
update public.profiles set member_category=member_category;
create index if not exists profiles_assigned_zone_idx on public.profiles(assigned_zone_id) where assigned_zone_id is not null;
create index if not exists profiles_assigned_union_idx on public.profiles(assigned_union_id) where assigned_union_id is not null;

create table if not exists public.community_events (
 id uuid primary key default gen_random_uuid(), created_by uuid not null references auth.users(id) on delete cascade,
 organizer_org_id uuid references public.org_units(id) on delete set null,
 audience_org_id uuid references public.org_units(id) on delete set null,
 title text not null check(char_length(btrim(title)) between 4 and 180),
 description text not null check(char_length(btrim(description)) between 10 and 8000),
 event_mode text not null default 'in_person' check(event_mode in ('in_person','online','hybrid')),
 starts_at timestamptz not null, ends_at timestamptz not null, timezone text not null default 'Africa/Lagos',
 venue text, meeting_url text, registration_deadline timestamptz,
 capacity integer check(capacity is null or capacity between 1 and 100000),
 requires_registration boolean not null default true, cover_media_path text,
 status text not null default 'pending' check(status in ('pending','published','rejected','cancelled','completed')),
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, review_note text,
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint community_events_time_order check(ends_at>starts_at),
 constraint community_events_online_link check(event_mode='in_person' or meeting_url is not null),
 constraint community_events_in_person_venue check(event_mode='online' or venue is not null)
);
create index if not exists community_events_status_start_idx on public.community_events(status,starts_at);
create index if not exists community_events_creator_idx on public.community_events(created_by,created_at desc);
create index if not exists community_events_audience_idx on public.community_events(audience_org_id,starts_at);

create table if not exists public.event_registrations (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.community_events(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'registered' check(status in ('registered','cancelled','waitlisted')),
 registered_at timestamptz not null default now(), cancelled_at timestamptz, unique(event_id,user_id)
);
create index if not exists event_registrations_user_idx on public.event_registrations(user_id,registered_at desc);
create index if not exists event_registrations_event_status_idx on public.event_registrations(event_id,status);

create table if not exists public.user_notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 notification_type text not null check(notification_type in ('event_published','event_registration','event_updated','event_cancelled')),
 title text not null check(char_length(title) between 1 and 180), body text not null check(char_length(body) between 1 and 1000),
 href text not null default '/app/notifications', event_id uuid references public.community_events(id) on delete cascade,
 read_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists user_notifications_inbox_idx on public.user_notifications(user_id,created_at desc);
create index if not exists user_notifications_unread_idx on public.user_notifications(user_id) where read_at is null;

alter table public.community_events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.user_notifications enable row level security;
create policy community_events_read on public.community_events for select to authenticated using (
 status='published' or created_by=(select auth.uid()) or
 private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))
);
create policy community_events_insert on public.community_events for insert to authenticated with check (
 created_by=(select auth.uid()) and status='pending'
 and exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active')
 and ((organizer_org_id is null and audience_org_id is null) or
 (organizer_org_id is not null and audience_org_id=organizer_org_id and private.can_administer_org(organizer_org_id)))
);
create policy community_events_update on public.community_events for update to authenticated using (
 (created_by=(select auth.uid()) and status in ('pending','rejected')) or
 private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))
) with check (
 (created_by=(select auth.uid()) and status in ('pending','rejected') and reviewed_by is null) or
 (private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1))) and (reviewed_by is null or reviewed_by=(select auth.uid())))
);
create policy community_events_delete on public.community_events for delete to authenticated using (
 (created_by=(select auth.uid()) and status in ('pending','rejected')) or
 private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))
);
create policy event_registrations_read on public.event_registrations for select to authenticated using (
 user_id=(select auth.uid()) or exists(select 1 from public.community_events e where e.id=event_id and
 (e.created_by=(select auth.uid()) or private.can_administer_org(coalesce(e.audience_org_id,e.organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))))
);
create policy event_registrations_update_own on public.event_registrations for update to authenticated using(user_id=(select auth.uid()))
with check(user_id=(select auth.uid()) and status='cancelled');
create policy user_notifications_read_own on public.user_notifications for select to authenticated using(user_id=(select auth.uid()));
create policy user_notifications_update_own on public.user_notifications for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
revoke all on public.community_events,public.event_registrations,public.user_notifications from anon,public;
grant select,insert,update,delete on public.community_events to authenticated;
grant select,update on public.event_registrations to authenticated;
grant select,update on public.user_notifications to authenticated;

create or replace function private.register_for_event(p_event_id uuid)
returns jsonb language plpgsql security definer set search_path=''
as $function$
declare v_user uuid:=auth.uid(); v_event public.community_events%rowtype; v_count integer; v_registration uuid;
begin
 if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
 select * into v_event from public.community_events where id=p_event_id for update;
 if not found or v_event.status<>'published' then raise exception 'Event is not open for registration' using errcode='23514'; end if;
 if not exists(select 1 from public.org_memberships m where m.user_id=v_user and m.status='active') then raise exception 'An active NAAS membership is required' using errcode='42501'; end if;
 if not v_event.requires_registration then raise exception 'Registration is not required for this event' using errcode='23514'; end if;
 if v_event.registration_deadline is not null and v_event.registration_deadline<now() then raise exception 'Registration deadline has passed' using errcode='23514'; end if;
 select count(*) into v_count from public.event_registrations r where r.event_id=p_event_id and r.status='registered';
 if v_event.capacity is not null and v_count>=v_event.capacity then raise exception 'Event capacity has been reached' using errcode='23514'; end if;
 insert into public.event_registrations(event_id,user_id,status) values(p_event_id,v_user,'registered')
 on conflict(event_id,user_id) do update set status='registered',registered_at=now(),cancelled_at=null
 where public.event_registrations.status='cancelled' returning id into v_registration;
 if v_registration is null then raise exception 'You are already registered for this event' using errcode='23505'; end if;
 return jsonb_build_object('registration_id',v_registration,'event_id',p_event_id,'status','registered');
end;
$function$;
create or replace function public.register_for_event(p_event_id uuid) returns jsonb language sql set search_path='' as $function$ select private.register_for_event(p_event_id); $function$;
revoke all on function private.register_for_event(uuid) from public,anon,authenticated;
revoke all on function public.register_for_event(uuid) from public,anon;
grant execute on function public.register_for_event(uuid) to authenticated;

create or replace function private.notify_event_published()
returns trigger language plpgsql security definer set search_path=''
as $function$
begin
 if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
  insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
  select distinct m.user_id,'event_published','New NAASCONNECT event: '||new.title,
   'A new event is available. Open Events to view details and register.','/app/events',new.id
  from public.org_memberships m where m.status='active' and m.user_id<>new.created_by on conflict do nothing;
 end if;
 return new;
end;
$function$;
create trigger community_events_notify_published after insert or update of status on public.community_events for each row execute function private.notify_event_published();

create or replace function private.notify_event_registration()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare v_event public.community_events%rowtype;
begin
 if new.status='registered' and (tg_op='INSERT' or old.status is distinct from 'registered') then
  select * into v_event from public.community_events where id=new.event_id;
  if v_event.created_by is not null and v_event.created_by<>new.user_id then
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
   values(v_event.created_by,'event_registration','New event registration','A NAASCONNECT member registered for '||v_event.title||'.','/app/events',new.event_id);
  end if;
 end if;
 return new;
end;
$function$;
create trigger event_registrations_notify_creator after insert or update of status on public.event_registrations for each row execute function private.notify_event_registration();

create or replace function public.get_national_structure_summary()
returns table(id uuid,parent_id uuid,org_type text,name text,state_name text,status text,member_count bigint,student_count bigint,institution_count bigint)
language plpgsql security definer set search_path=''
as $function$
declare v_national uuid;
begin
 select o.id into v_national from public.org_units o where o.org_type='national' and o.status='active' order by o.created_at limit 1;
 if v_national is null or not private.can_administer_org(v_national) then raise exception 'National administrator authority required' using errcode='42501'; end if;
 return query select o.id,o.parent_id,o.org_type,o.name,o.state_name,o.status,
  case when o.org_type='zone' then (select count(*) from public.profiles p where p.assigned_zone_id=o.id) else 0 end,
  case when o.org_type='zone' then (select count(*) from public.profiles p where p.assigned_zone_id=o.id and p.member_category='student') else 0 end,
  case when o.org_type='zone' then (select count(*) from public.org_units c where c.parent_id=o.id and c.org_type='campus') else 0 end
 from public.org_units o where o.id=v_national or o.parent_id=v_national or o.parent_id in(select u.id from public.org_units u where u.parent_id=v_national)
 order by case o.org_type when 'national' then 1 when 'union' then 2 when 'zone' then 3 else 4 end,o.name;
end;
$function$;
revoke all on function public.get_national_structure_summary() from public,anon;
grant execute on function public.get_national_structure_summary() to authenticated;
