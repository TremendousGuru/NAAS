drop function if exists public.get_national_structure_summary();
drop function if exists public.get_scoped_structure_summary(uuid);
create or replace function private.get_scoped_structure_summary(p_org_id uuid)
returns table(id uuid,parent_id uuid,org_type text,name text,state_name text,status text,member_count bigint,student_count bigint,institution_count bigint)
language plpgsql security definer set search_path=''
as $function$
begin
 if p_org_id is null or not private.can_administer_org(p_org_id) then raise exception 'You are not authorized to view this organizational scope' using errcode='42501'; end if;
 return query
 with recursive scope_tree(id,parent_id,org_type,name,state_name,status) as (
  select o.id,o.parent_id,o.org_type,o.name,o.state_name,o.status from public.org_units o where o.id=p_org_id
  union all
  select child.id,child.parent_id,child.org_type,child.name,child.state_name,child.status from public.org_units child join scope_tree parent on child.parent_id=parent.id
 )
 select s.id,s.parent_id,s.org_type,s.name,s.state_name,s.status,
  case when s.org_type='zone' then (select count(*) from public.profiles p where p.assigned_zone_id=s.id)
       when s.org_type in ('campus','church') then (select count(*) from public.org_memberships m where m.org_id=s.id and m.status='active') else 0 end,
  case when s.org_type='zone' then (select count(*) from public.profiles p where p.assigned_zone_id=s.id and p.member_category='student') else 0 end,
  case when s.org_type='zone' then (select count(*) from public.org_units c where c.parent_id=s.id and c.org_type='campus') else 0 end
 from scope_tree s order by case s.org_type when 'national' then 1 when 'union' then 2 when 'zone' then 3 when 'campus' then 4 else 5 end,s.name;
end;
$function$;
revoke all on function private.get_scoped_structure_summary(uuid) from public,anon;
grant execute on function private.get_scoped_structure_summary(uuid) to authenticated;
create function public.get_scoped_structure_summary(p_org_id uuid)
returns table(id uuid,parent_id uuid,org_type text,name text,state_name text,status text,member_count bigint,student_count bigint,institution_count bigint)
language sql stable set search_path=''
as $function$ select * from private.get_scoped_structure_summary(p_org_id); $function$;
revoke all on function public.get_scoped_structure_summary(uuid) from public,anon;
grant execute on function public.get_scoped_structure_summary(uuid) to authenticated;
create index if not exists community_events_organizer_org_idx on public.community_events(organizer_org_id);
create index if not exists community_events_reviewed_by_idx on public.community_events(reviewed_by);
create index if not exists org_state_coverage_zone_idx on public.org_state_coverage(zone_org_id);
create index if not exists org_state_coverage_union_idx on public.org_state_coverage(union_org_id);
create index if not exists user_notifications_event_idx on public.user_notifications(event_id);
