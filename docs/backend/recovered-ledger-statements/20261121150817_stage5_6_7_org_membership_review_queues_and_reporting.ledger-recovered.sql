-- Stage 5.6.7: organization-scoped membership review queues and reporting.
create index if not exists org_memberships_org_pending_created_idx
 on public.org_memberships(org_id,created_at desc) where status='pending';
create index if not exists membership_events_org_created_idx
 on public.membership_events(org_id,created_at desc);
create index if not exists membership_events_org_type_created_idx
 on public.membership_events(org_id,event_type,created_at desc);

create or replace function private.get_membership_review_queue(
 p_org_id uuid,
 p_search text default null,
 p_from timestamptz default null,
 p_to timestamptz default null,
 p_limit integer default 50,
 p_offset integer default 0
) returns jsonb
language plpgsql stable security definer set search_path=''
as $function$
declare
 v_actor uuid:=auth.uid();
 v_search text:=nullif(btrim(p_search),'');
 v_total bigint;
 v_items jsonb;
begin
 if v_actor is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_org_id is null then raise exception 'An organization scope is required' using errcode='22023'; end if;
 if not private.can_administer_org(p_org_id) then
  raise exception 'You are not authorized to review memberships in this organization' using errcode='42501';
 end if;
 if p_limit is null or p_limit<1 or p_limit>100 then raise exception 'Page size must be between 1 and 100' using errcode='22023'; end if;
 if p_offset is null or p_offset<0 or p_offset>100000 then raise exception 'Offset must be between 0 and 100000' using errcode='22023'; end if;
 if v_search is not null and char_length(v_search)>100 then raise exception 'Search text cannot exceed 100 characters' using errcode='22023'; end if;
 if p_from is not null and p_to is not null and p_from>p_to then raise exception 'Start date must not be after end date' using errcode='22023'; end if;

 with recursive scoped_orgs(id,path) as (
  select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
  union all select child.id,parent.path||child.id from public.org_units child
   join scoped_orgs parent on child.parent_id=parent.id where not child.id=any(parent.path)
 ), filtered as (
  select m.id as membership_id,m.org_id,o.name as org_name,o.org_type,
   coalesce(nullif(btrim(p.display_name),''),'Member') as display_name,
   p.institution_name,p.course_of_study,p.level_of_study,m.role,m.created_at as requested_at
  from scoped_orgs s join public.org_units o on o.id=s.id
  join public.org_memberships m on m.org_id=o.id
  left join public.profiles p on p.id=m.user_id
  where m.status='pending'
   and (p_from is null or m.created_at>=p_from)
   and (p_to is null or m.created_at<=p_to)
   and (v_search is null or lower(coalesce(p.display_name,'')) like lower(v_search)||'%'
      or lower(coalesce(p.institution_name,'')) like lower(v_search)||'%')
 )
 select count(*) into v_total from filtered;

 with recursive scoped_orgs(id,path) as (
  select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
  union all select child.id,parent.path||child.id from public.org_units child
   join scoped_orgs parent on child.parent_id=parent.id where not child.id=any(parent.path)
 ), filtered as (
  select m.id as membership_id,m.org_id,o.name as org_name,o.org_type,
   coalesce(nullif(btrim(p.display_name),''),'Member') as display_name,
   p.institution_name,p.course_of_study,p.level_of_study,m.role,m.created_at as requested_at
  from scoped_orgs s join public.org_units o on o.id=s.id
  join public.org_memberships m on m.org_id=o.id
  left join public.profiles p on p.id=m.user_id
  where m.status='pending'
   and (p_from is null or m.created_at>=p_from)
   and (p_to is null or m.created_at<=p_to)
   and (v_search is null or lower(coalesce(p.display_name,'')) like lower(v_search)||'%'
      or lower(coalesce(p.institution_name,'')) like lower(v_search)||'%')
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'membership_id',membership_id,'organization_id',org_id,
  'organization_name',org_name,'organization_type',org_type,
  'display_name',display_name,'institution_name',institution_name,
  'course_of_study',course_of_study,'level_of_study',level_of_study,
  'requested_role',role,'requested_at',requested_at
 ) order by requested_at asc,membership_id),'[]'::jsonb)
 into v_items from (
  select * from filtered order by requested_at asc,membership_id limit p_limit offset p_offset
 ) page;
 return jsonb_build_object('organization_id',p_org_id,'total_count',v_total,
  'limit',p_limit,'offset',p_offset,'items',v_items);
end;
$function$;

create or replace function public.get_membership_review_queue(
 p_org_id uuid,p_search text default null,p_from timestamptz default null,
 p_to timestamptz default null,p_limit integer default 50,p_offset integer default 0
) returns jsonb language sql stable security invoker set search_path=''
as $function$
 select private.get_membership_review_queue(p_org_id,p_search,p_from,p_to,p_limit,p_offset);
$function$;
revoke all on function private.get_membership_review_queue(uuid,text,timestamptz,timestamptz,integer,integer) from public,anon;
grant execute on function private.get_membership_review_queue(uuid,text,timestamptz,timestamptz,integer,integer) to authenticated;
revoke all on function public.get_membership_review_queue(uuid,text,timestamptz,timestamptz,integer,integer) from public,anon;
grant execute on function public.get_membership_review_queue(uuid,text,timestamptz,timestamptz,integer,integer) to authenticated;

create or replace function private.get_membership_activity_report(
 p_org_id uuid,p_from timestamptz default null,p_to timestamptz default null
) returns jsonb
language plpgsql stable security definer set search_path=''
as $function$
declare
 v_actor uuid:=auth.uid();
 v_total bigint;
 v_pending bigint;
 v_status jsonb;
 v_activity jsonb;
 v_orgs jsonb;
begin
 if v_actor is null then raise exception 'Authentication required' using errcode='28000'; end if;
 if p_org_id is null then raise exception 'An organization scope is required' using errcode='22023'; end if;
 if not private.can_administer_org(p_org_id) then
  raise exception 'You are not authorized to view membership reports for this organization' using errcode='42501';
 end if;
 if p_from is not null and p_to is not null and p_from>p_to then raise exception 'Start date must not be after end date' using errcode='22023'; end if;

 with recursive scoped_orgs(id,path) as (
  select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
  union all select child.id,parent.path||child.id from public.org_units child
   join scoped_orgs parent on child.parent_id=parent.id where not child.id=any(parent.path)
 )
 select count(*),count(*) filter(where m.status='pending'),
  jsonb_build_object(
   'pending',count(*) filter(where m.status='pending'),
   'active',count(*) filter(where m.status='active'),
   'suspended',count(*) filter(where m.status='suspended'),
   'ended',count(*) filter(where m.status='ended')
  )
 into v_total,v_pending,v_status
 from public.org_memberships m join scoped_orgs s on s.id=m.org_id;

 with recursive scoped_orgs(id,path) as (
  select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
  union all select child.id,parent.path||child.id from public.org_units child
   join scoped_orgs parent on child.parent_id=parent.id where not child.id=any(parent.path)
 ), events as (
  select e.event_type,count(*)::bigint as total
  from public.membership_events e join scoped_orgs s on s.id=e.org_id
  where (p_from is null or e.created_at>=p_from) and (p_to is null or e.created_at<=p_to)
  group by e.event_type
 )
 select coalesce(jsonb_object_agg(event_type,total),'{}'::jsonb) into v_activity from events;

 with recursive scoped_orgs(id,path) as (
  select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
  union all select child.id,parent.path||child.id from public.org_units child
   join scoped_orgs parent on child.parent_id=parent.id where not child.id=any(parent.path)
 ), org_report as (
  select o.id,o.name,o.org_type,
   count(m.id)::bigint as total,
   count(m.id) filter(where m.status='pending')::bigint as pending,
   count(m.id) filter(where m.status='active')::bigint as active,
   count(m.id) filter(where m.status='suspended')::bigint as suspended,
   count(m.id) filter(where m.status='ended')::bigint as ended,
   (select count(*)::bigint from public.membership_events e where e.org_id=o.id
     and (p_from is null or e.created_at>=p_from) and (p_to is null or e.created_at<=p_to)) as events_in_period
  from scoped_orgs s join public.org_units o on o.id=s.id
  left join public.org_memberships m on m.org_id=o.id
  group by o.id,o.name,o.org_type
 )
 select coalesce(jsonb_agg(jsonb_build_object(
  'organization_id',id,'organization_name',name,'organization_type',org_type,
  'total_memberships',total,'pending',pending,'active',active,'suspended',suspended,
  'ended',ended,'activity_events',events_in_period
 ) order by org_type,name),'[]'::jsonb) into v_orgs from org_report;

 return jsonb_build_object('organization_id',p_org_id,
  'period',jsonb_build_object('from',p_from,'to',p_to),
  'total_memberships',v_total,'pending_review',v_pending,
  'memberships_by_status',v_status,'activity_by_event_type',v_activity,
  'organizations',v_orgs);
end;
$function$;

create or replace function public.get_membership_activity_report(
 p_org_id uuid,p_from timestamptz default null,p_to timestamptz default null
) returns jsonb language sql stable security invoker set search_path=''
as $function$ select private.get_membership_activity_report(p_org_id,p_from,p_to); $function$;
revoke all on function private.get_membership_activity_report(uuid,timestamptz,timestamptz) from public,anon;
grant execute on function private.get_membership_activity_report(uuid,timestamptz,timestamptz) to authenticated;
revoke all on function public.get_membership_activity_report(uuid,timestamptz,timestamptz) from public,anon;
grant execute on function public.get_membership_activity_report(uuid,timestamptz,timestamptz) to authenticated;
