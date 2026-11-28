create or replace function private.notify_event_published()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare v_should_notify boolean:=false;
begin
 if new.status='published' then
  if tg_op='INSERT' then v_should_notify:=true;
  elsif tg_op='UPDATE' then v_should_notify:=old.status is distinct from 'published'; end if;
 end if;
 if v_should_notify then
  if new.audience_org_id is null then
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
   select distinct m.user_id,'event_published','New NAASCONNECT event: '||new.title,'A new event is available. Open Events to view details and register.','/app/events',new.id
   from public.org_memberships m where m.status='active' and m.user_id<>new.created_by on conflict do nothing;
  else
   with recursive audience_orgs(id) as (select new.audience_org_id union all select child.id from public.org_units child join audience_orgs parent on child.parent_id=parent.id)
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id)
   select distinct m.user_id,'event_published','New NAASCONNECT event: '||new.title,'A new event is available in your organization. Open Events to view details.','/app/events',new.id
   from public.org_memberships m join audience_orgs a on a.id=m.org_id where m.status='active' and m.user_id<>new.created_by on conflict do nothing;
  end if;
 end if;
 return new;
end;
$function$;
create or replace function private.notify_event_registration()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare v_event public.community_events%rowtype; v_should_notify boolean:=false;
begin
 if new.status='registered' then
  if tg_op='INSERT' then v_should_notify:=true;
  elsif tg_op='UPDATE' then v_should_notify:=old.status is distinct from 'registered'; end if;
 end if;
 if v_should_notify then
  select * into v_event from public.community_events where id=new.event_id;
  if v_event.created_by is not null and v_event.created_by<>new.user_id then
   insert into public.user_notifications(user_id,notification_type,title,body,href,event_id,actor_user_id)
   values(v_event.created_by,'event_registration','New event registration','A NAASCONNECT member registered for '||v_event.title||'.','/app/events',new.event_id,new.user_id)
   on conflict do nothing;
  end if;
 end if;
 return new;
end;
$function$;
