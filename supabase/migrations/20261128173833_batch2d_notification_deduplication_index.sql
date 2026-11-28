drop index if exists public.user_notifications_event_actor_unique;
create unique index user_notifications_event_actor_unique
 on public.user_notifications(user_id,event_id,notification_type,(coalesce(actor_user_id,'00000000-0000-0000-0000-000000000000'::uuid)))
 where event_id is not null;
