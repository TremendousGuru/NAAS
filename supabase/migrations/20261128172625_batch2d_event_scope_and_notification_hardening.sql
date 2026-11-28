-- Harden event visibility, scoped notifications, storage reads and member update grants.
drop policy if exists community_events_read on public.community_events;
create policy community_events_read on public.community_events for select to authenticated using (
 (status='published' and (
   (audience_org_id is null and exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active'))
   or exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.org_id=community_events.audience_org_id and m.status='active')
   or private.can_administer_org(audience_org_id)
 ))
 or created_by=(select auth.uid())
 or private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))
);
drop policy if exists community_events_update on public.community_events;
create policy community_events_update on public.community_events for update to authenticated using (
 (created_by=(select auth.uid()) and status in ('pending','rejected') and organizer_org_id is null and audience_org_id is null)
 or private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1)))
) with check (
 (created_by=(select auth.uid()) and status in ('pending','rejected') and organizer_org_id is null and audience_org_id is null and reviewed_by is null)
 or (private.can_administer_org(coalesce(audience_org_id,organizer_org_id,(select id from public.org_units where org_type='national' and status='active' order by created_at limit 1))) and (reviewed_by is null or reviewed_by=(select auth.uid())))
);
revoke update on public.user_notifications from authenticated;
grant update(read_at) on public.user_notifications to authenticated;
revoke update on public.event_registrations from authenticated;
drop policy if exists community_event_media_read on storage.objects;
create policy community_event_media_read on storage.objects for select to authenticated using (
 bucket_id='community-media' and exists(
  select 1 from public.community_events e where e.cover_media_path=objects.name and e.status='published'
   and ((e.audience_org_id is null and exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active'))
    or exists(select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.org_id=e.audience_org_id and m.status='active')
    or private.can_administer_org(e.audience_org_id))
 )
);
create unique index if not exists user_notifications_event_type_user_unique
 on public.user_notifications(user_id,event_id,notification_type) where event_id is not null;

create or replace function private.notify_event_published()
returns trigger language plpgsql security definer set search_path=''
as $function$
begin
 if new.status='published' and (tg_op='INSERT' or old.status is distinct from 'published') then
  if new.audience_org_id is null then
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
   select distinct m.user_id,'event_published','New NAASCONNECT event: '||new.title,
    'A new event is available. Open Events to view details and register.','/app/events',new.id
   from public.org_memberships m where m.status='active' and m.user_id<>new.created_by
   on conflict do nothing;
  else
   with recursive audience_orgs(id) as (
    select new.audience_org_id
    union all select child.id from public.org_units child join audience_orgs parent on child.parent_id=parent.id
   )
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
   select distinct m.user_id,'event_published','New NAASCONNECT event: '||new.title,
    'A new event is available in your organization. Open Events to view details.','/app/events',new.id
   from public.org_memberships m join audience_orgs a on a.id=m.org_id
   where m.status='active' and m.user_id<>new.created_by on conflict do nothing;
  end if;
 end if;
 return new;
end;
$function$;
