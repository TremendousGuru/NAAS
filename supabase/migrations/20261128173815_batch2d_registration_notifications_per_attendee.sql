alter table public.user_notifications add column if not exists actor_user_id uuid references auth.users(id) on delete set null;
drop index if exists public.user_notifications_event_type_user_unique;
create unique index if not exists user_notifications_event_actor_unique
 on public.user_notifications(user_id,event_id,notification_type,actor_user_id) where event_id is not null;
create or replace function private.notify_event_registration()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare v_event public.community_events%rowtype;
begin
 if new.status='registered' and (tg_op='INSERT' or old.status is distinct from 'registered') then
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
