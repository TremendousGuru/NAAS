alter table public.org_memberships
  add column if not exists status_reason text,
  add column if not exists status_changed_by uuid references auth.users(id) on delete set null,
  add column if not exists status_changed_at timestamptz;

alter table public.org_memberships
  add constraint org_memberships_status_reason_length_check
  check (status_reason is null or char_length(btrim(status_reason)) between 10 and 1000);

create or replace function private.manage_membership_status(
  p_membership_id uuid,
  p_action text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_membership public.org_memberships%rowtype;
  v_next_status text;
  v_event_type text;
  v_reason text := nullif(btrim(p_reason), '');
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_action not in ('suspend','reactivate','terminate') then
    raise exception 'Action must be suspend, reactivate or terminate' using errcode = '22023';
  end if;

  if v_reason is null or char_length(v_reason) < 10 or char_length(v_reason) > 1000 then
    raise exception 'A reason between 10 and 1000 characters is required' using errcode = '22023';
  end if;

  select *
    into v_membership
  from public.org_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Membership not found' using errcode = 'P0002';
  end if;

  if v_membership.user_id = v_actor then
    raise exception 'Administrators cannot change their own membership status through this operation' using errcode = '42501';
  end if;

  if not private.can_administer_org(v_membership.org_id) then
    raise exception 'You are not authorized to manage membership in this organization' using errcode = '42501';
  end if;

  if p_action = 'suspend' then
    if v_membership.status <> 'active' then
      raise exception 'Only active memberships can be suspended' using errcode = '55000';
    end if;
    v_next_status := 'suspended';
    v_event_type := 'membership_suspended';
  elsif p_action = 'reactivate' then
    if v_membership.status <> 'suspended' then
      raise exception 'Only suspended memberships can be reactivated' using errcode = '55000';
    end if;
    v_next_status := 'active';
    v_event_type := 'membership_reactivated';
  else
    if v_membership.status not in ('active','suspended') then
      raise exception 'Only active or suspended memberships can be terminated' using errcode = '55000';
    end if;
    v_next_status := 'ended';
    v_event_type := 'membership_ended';
  end if;

  update public.org_memberships
  set status = v_next_status,
      status_reason = v_reason,
      status_changed_by = v_actor,
      status_changed_at = now(),
      updated_at = now()
  where id = v_membership.id;

  insert into public.membership_events
    (user_id,membership_id,org_id,event_type,actor_user_id,details)
  values
    (v_membership.user_id,v_membership.id,v_membership.org_id,v_event_type,v_actor,
     jsonb_build_object(
       'previous_status',v_membership.status,
       'new_status',v_next_status,
       'reason',v_reason
     ));

  return jsonb_build_object(
    'membership_id',v_membership.id,
    'user_id',v_membership.user_id,
    'org_id',v_membership.org_id,
    'previous_status',v_membership.status,
    'status',v_next_status,
    'event_type',v_event_type
  );
end;
$function$;

revoke all on function private.manage_membership_status(uuid,text,text) from public, anon;
grant execute on function private.manage_membership_status(uuid,text,text) to authenticated;

create or replace function public.manage_membership_status(
  p_membership_id uuid,
  p_action text,
  p_reason text
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.manage_membership_status(p_membership_id,p_action,p_reason);
$function$;

revoke all on function public.manage_membership_status(uuid,text,text) from public, anon;
grant execute on function public.manage_membership_status(uuid,text,text) to authenticated;
