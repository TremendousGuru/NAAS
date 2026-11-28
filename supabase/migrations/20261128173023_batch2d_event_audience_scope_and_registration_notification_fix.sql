create or replace function private.is_org_descendant_or_self(p_root_org_id uuid,p_candidate_org_id uuid)
returns boolean language sql stable security definer set search_path=''
as $function$
 with recursive scope_tree(id,parent_id) as (
  select o.id,o.parent_id from public.org_units o where o.id=p_root_org_id
  union all select child.id,child.parent_id from public.org_units child join scope_tree parent on child.parent_id=parent.id
 )
 select exists(select 1 from scope_tree where id=p_candidate_org_id);
$function$;
revoke all on function private.is_org_descendant_or_self(uuid,uuid) from public,anon;
grant execute on function private.is_org_descendant_or_self(uuid,uuid) to authenticated;

drop policy if exists community_events_read on public.community_events;
create policy community_events_read on public.community_events for select to authenticated using (
 (status='published' and (
  (audience_org_id is null and exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active'))
  or exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active' and private.is_org_descendant_or_self(community_events.audience_org_id,m.org_id))
  or private.can_administer_org(audience_org_id)
 ))
 or created_by=(select auth.uid())
 or private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))
);
drop policy if exists community_event_media_read on storage.objects;
create policy community_event_media_read on storage.objects for select to authenticated using (
 bucket_id='community-media' and exists(
  select 1 from public.community_events e where e.cover_media_path=objects.name and e.status='published'
   and ((e.audience_org_id is null and exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active'))
    or exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active' and private.is_org_descendant_or_self(e.audience_org_id,m.org_id))
    or private.can_administer_org(e.audience_org_id))
 )
);
create or replace function private.notify_event_registration()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare v_event public.community_events%rowtype;
begin
 if new.status='registered' and (tg_op='INSERT' or old.status is distinct from 'registered') then
  select * into v_event from public.community_events where id=new.event_id;
  if v_event.created_by is not null and v_event.created_by<>new.user_id then
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
   values(v_event.created_by,'event_registration','New event registration','A NAASCONNECT member registered for '||v_event.title||'.','/app/events',new.event_id)
   on conflict do nothing;
  end if;
 end if;
 return new;
end;
$function$;
