
create or replace function private.review_membership_transfer(
  p_transfer_id uuid,
  p_decision text,
  p_reviewer_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_request public.membership_transfer_requests%rowtype;
  v_new_membership_id uuid;
  v_existing_status text;
  v_destination_type text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject' using errcode = '22023';
  end if;

  select *
    into v_request
  from public.membership_transfer_requests
  where id = p_transfer_id
  for update;

  if not found then
    raise exception 'Transfer request not found' using errcode = 'P0002';
  end if;

  if v_request.status not in ('pending_source','pending_destination') then
    raise exception 'Transfer request is not awaiting review' using errcode = '55000';
  end if;

  if v_request.status = 'pending_source' then
    if not private.can_administer_org(v_request.source_org_id) then
      raise exception 'You are not authorized to review the source organization' using errcode = '42501';
    end if;

    if p_decision = 'reject' then
      update public.membership_transfer_requests
      set status = 'rejected',
          source_reviewed_by = v_actor,
          source_reviewed_at = now(),
          reviewer_notes = nullif(btrim(p_reviewer_notes),''),
          updated_at = now()
      where id = v_request.id;

      insert into public.membership_events
        (user_id,membership_id,org_id,event_type,actor_user_id,related_transfer_id,details)
      values
        (v_request.user_id,v_request.source_membership_id,v_request.source_org_id,
         'transfer_rejected',v_actor,v_request.id,
         jsonb_build_object('review_stage','source','notes',nullif(btrim(p_reviewer_notes),'')));

      return jsonb_build_object('transfer_id',v_request.id,'status','rejected','review_stage','source');
    end if;

    update public.membership_transfer_requests
    set status = 'pending_destination',
        source_reviewed_by = v_actor,
        source_reviewed_at = now(),
        reviewer_notes = nullif(btrim(p_reviewer_notes),''),
        updated_at = now()
    where id = v_request.id;

    insert into public.membership_events
      (user_id,membership_id,org_id,event_type,actor_user_id,related_transfer_id,details)
    values
      (v_request.user_id,v_request.source_membership_id,v_request.source_org_id,
       'transfer_source_approved',v_actor,v_request.id,
       jsonb_build_object('destination_org_id',v_request.destination_org_id,'notes',nullif(btrim(p_reviewer_notes),'')));

    return jsonb_build_object('transfer_id',v_request.id,'status','pending_destination','review_stage','destination');
  end if;

  if not private.can_administer_org(v_request.destination_org_id) then
    raise exception 'You are not authorized to review the destination organization' using errcode = '42501';
  end if;

  if p_decision = 'reject' then
    update public.membership_transfer_requests
    set status = 'rejected',
        destination_reviewed_by = v_actor,
        destination_reviewed_at = now(),
        reviewer_notes = nullif(btrim(p_reviewer_notes),''),
        updated_at = now()
    where id = v_request.id;

    insert into public.membership_events
      (user_id,membership_id,org_id,event_type,actor_user_id,related_transfer_id,details)
    values
      (v_request.user_id,v_request.source_membership_id,v_request.destination_org_id,
       'transfer_rejected',v_actor,v_request.id,
       jsonb_build_object('review_stage','destination','notes',nullif(btrim(p_reviewer_notes),'')));

    return jsonb_build_object('transfer_id',v_request.id,'status','rejected','review_stage','destination');
  end if;

  -- Revalidate both ends at final approval; do not transfer a stale or inactive membership.
  perform 1
  from public.org_memberships
  where id = v_request.source_membership_id
    and user_id = v_request.user_id
    and org_id = v_request.source_org_id
    and status = 'active'
  for update;

  if not found then
    raise exception 'Source membership is no longer active; transfer cannot be completed' using errcode = '55000';
  end if;

  select org_type into v_destination_type
  from public.org_units
  where id = v_request.destination_org_id
    and status = 'active'
    and org_type in ('campus','church')
  for update;

  if not found then
    raise exception 'Destination organization is not active or eligible' using errcode = '55000';
  end if;

  select id,status into v_new_membership_id,v_existing_status
  from public.org_memberships
  where org_id = v_request.destination_org_id
    and user_id = v_request.user_id
  for update;

  if found then
    if v_existing_status <> 'ended' then
      raise exception 'A destination membership already exists and is not ended' using errcode = '23505';
    end if;

    update public.org_memberships
    set status = 'active',
        role = case when v_destination_type = 'church' then 'church_member' else 'member' end,
        approved_by = v_actor,
        approved_at = now(),
        joined_at = now(),
        updated_at = now()
    where id = v_new_membership_id;
  else
    insert into public.org_memberships
      (org_id,user_id,role,status,approved_by,approved_at,joined_at)
    values
      (v_request.destination_org_id,v_request.user_id,
       case when v_destination_type = 'church' then 'church_member' else 'member' end,
       'active',v_actor,now(),now())
    returning id into v_new_membership_id;
  end if;

  update public.org_memberships
  set status = 'ended',
      updated_at = now()
  where id = v_request.source_membership_id;

  update public.membership_transfer_requests
  set status = 'approved',
      destination_reviewed_by = v_actor,
      destination_reviewed_at = now(),
      reviewer_notes = nullif(btrim(p_reviewer_notes),''),
      resulting_membership_id = v_new_membership_id,
      updated_at = now()
  where id = v_request.id;

  insert into public.membership_events
    (user_id,membership_id,org_id,event_type,actor_user_id,related_transfer_id,details)
  values
    (v_request.user_id,v_request.source_membership_id,v_request.source_org_id,
     'transfer_completed_out',v_actor,v_request.id,
     jsonb_build_object('destination_org_id',v_request.destination_org_id,'resulting_membership_id',v_new_membership_id)),
    (v_request.user_id,v_new_membership_id,v_request.destination_org_id,
     'transfer_completed_in',v_actor,v_request.id,
     jsonb_build_object('source_org_id',v_request.source_org_id,'source_membership_id',v_request.source_membership_id));

  return jsonb_build_object(
    'transfer_id',v_request.id,
    'status','approved',
    'source_membership_id',v_request.source_membership_id,
    'destination_membership_id',v_new_membership_id
  );
end;
$function$;

revoke all on function private.review_membership_transfer(uuid,text,text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.review_membership_transfer(uuid,text,text) to authenticated;

create or replace function public.review_membership_transfer(
  p_transfer_id uuid,
  p_decision text,
  p_reviewer_notes text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.review_membership_transfer(p_transfer_id,p_decision,p_reviewer_notes);
$function$;

revoke all on function public.review_membership_transfer(uuid,text,text) from public, anon;
grant execute on function public.review_membership_transfer(uuid,text,text) to authenticated;
