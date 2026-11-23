-- NAASCONNECT Batch 1 migration candidate — REVIEW ONLY
-- This file is intentionally stored under docs/, NOT supabase/migrations/.
-- Do not execute against production or add to migration history without
-- owner review, independent testing, and separate explicit approval.
-- Source: docs/backend/BATCH1_FINAL_MIGRATION_CANDIDATE_REVIEW_ONLY.md
-- Branch: feature/naasconnect-frontend-foundation
--
-- WARNING: This candidate has not been validated in an isolated database.
-- It may require revision after independent testing and schema reconciliation.

begin;

-- Durable member classification and separate geographic facts.
alter table public.profiles
  add column if not exists member_category text,
  add column if not exists state_of_admission text,
  add column if not exists residential_state text,
  add column if not exists preferred_region_state text;

alter table public.profiles
  add constraint profiles_member_category_check
  check (member_category is null or member_category in ('student','non_student'));

-- Nigeria states and FCT. Null remains allowed for legacy accounts that
-- must complete onboarding; a request RPC will fail closed until required.
alter table public.profiles
  add constraint profiles_state_of_admission_check
  check (state_of_admission is null or state_of_admission = any (array[
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
    'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara'
  ]::text[]));

alter table public.profiles
  add constraint profiles_residential_state_check
  check (residential_state is null or residential_state = any (array[
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
    'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara'
  ]::text[]));

alter table public.profiles
  add constraint profiles_preferred_region_state_check
  check (preferred_region_state is null or preferred_region_state = any (array[
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
    'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
    'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
    'Yobe','Zamfara'
  ]::text[]));

-- Preserve one membership row per person/organization. Rejected is a
-- distinct terminal decision state, not "ended" or "suspended".
alter table public.org_memberships
  drop constraint org_memberships_status_check;
alter table public.org_memberships
  add constraint org_memberships_status_check
  check (status = any (array['pending','active','suspended','ended','rejected']));

-- Ordinary users can no longer bypass category/geography checks with a
-- direct INSERT. Preserve the existing scoped-admin pending insert path.
drop policy "Scoped administrators or users request membership"
  on public.org_memberships;

create policy "Scoped administrators create pending memberships"
on public.org_memberships
for insert to authenticated
with check (
  status = 'pending'
  and (select private.can_administer_org(org_id))
);

-- Internal request implementation. The private SECURITY DEFINER is required
-- to perform the atomic insert/rejected-row reuse while direct member INSERT
-- is closed. It checks auth.uid() itself, fixes search_path, and qualifies
-- every relation. The exposed public wrapper is SECURITY INVOKER.
create or replace function private.request_member_onboarding(
  p_org_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_org public.org_units%rowtype;
  v_role text;
  v_membership_id uuid;
  v_previous_status text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_actor
  for update;

  if not found then
    raise exception 'Complete your member profile before requesting membership'
      using errcode = '23514';
  end if;

  select * into v_org
  from public.org_units
  where id = p_org_id and status = 'active'
  for share;

  if not found then
    raise exception 'Selected organization is not active' using errcode = '23514';
  end if;

  if v_profile.member_category = 'student' then
    if v_org.org_type <> 'campus' then
      raise exception 'Students may request membership only in a campus/ASF'
        using errcode = '23514';
    end if;
    if nullif(btrim(v_profile.institution_name),'') is null
       or v_profile.state_of_admission is null
       or nullif(btrim(v_org.institution_name),'') is null
       or v_org.state_name is null then
      raise exception 'Student profile and campus institution/state details must be completed and verified'
        using errcode = '23514';
    end if;
    if lower(btrim(v_profile.institution_name)) <> lower(btrim(v_org.institution_name))
       or lower(btrim(v_profile.state_of_admission)) <> lower(btrim(v_org.state_name)) then
      raise exception 'Selected campus does not match your institution and state of admission'
        using errcode = '42501';
    end if;
    v_role := 'member';
  elsif v_profile.member_category = 'non_student' then
    if v_org.org_type <> 'church' then
      raise exception 'Non-students may request membership only in a local church'
        using errcode = '23514';
    end if;
    if v_profile.preferred_region_state is null or v_org.state_name is null then
      raise exception 'Preferred region and verified church state are required'
        using errcode = '23514';
    end if;
    if lower(btrim(v_profile.preferred_region_state)) <> lower(btrim(v_org.state_name)) then
      raise exception 'Selected church is outside your preferred region'
        using errcode = '42501';
    end if;
    v_role := 'church_member';
  else
    raise exception 'Choose and complete your student or non-student category'
      using errcode = '23514';
  end if;

  -- New membership, or same-organization resubmission after rejection.
  -- A pending/active/suspended/ended row is never overwritten.
  insert into public.org_memberships
    (org_id,user_id,role,status,approved_by,approved_at,joined_at,
     status_reason,status_changed_by,status_changed_at)
  values
    (p_org_id,v_actor,v_role,'pending',null,null,null,null,null,null)
  on conflict (org_id,user_id) do update
    set role = excluded.role,
        status = 'pending',
        approved_by = null,
        approved_at = null,
        joined_at = null,
        status_reason = null,
        status_changed_by = null,
        status_changed_at = null,
        updated_at = now()
    where public.org_memberships.status = 'rejected'
  returning id into v_membership_id;

  if v_membership_id is null then
    raise exception 'A membership request already exists or this membership cannot be resubmitted'
      using errcode = '23505';
  end if;

  select details->>'previous_status' into v_previous_status
  from public.membership_events
  where membership_id = v_membership_id
    and event_type = 'membership_rejected'
  order by created_at desc
  limit 1;

  insert into public.membership_events
    (user_id,membership_id,org_id,event_type,actor_user_id,details)
  values
    (v_actor,v_membership_id,p_org_id,'membership_requested',v_actor,
     jsonb_build_object(
       'member_category',v_profile.member_category,
       'eligibility_region',
         case when v_profile.member_category='student'
              then v_profile.state_of_admission
              else v_profile.preferred_region_state end,
       'resubmission', v_previous_status is not null
     ));

  return jsonb_build_object(
    'membership_id',v_membership_id,
    'org_id',p_org_id,
    'status','pending',
    'resubmission',v_previous_status is not null
  );
end;
$function$;

revoke all on function private.request_member_onboarding(uuid) from public, anon, authenticated;
grant execute on function private.request_member_onboarding(uuid) to authenticated;

create or replace function public.request_member_onboarding(p_org_id uuid)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.request_member_onboarding(p_org_id);
$function$;

revoke all on function public.request_member_onboarding(uuid) from public, anon;
grant execute on function public.request_member_onboarding(uuid) to authenticated;

-- Review is separate from request submission and scoped to the selected org.
create or replace function private.review_member_onboarding(
  p_membership_id uuid,
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
  v_membership public.org_memberships%rowtype;
  v_profile public.profiles%rowtype;
  v_org public.org_units%rowtype;
  v_notes text := nullif(btrim(p_reviewer_notes),'');
  v_next_status text;
  v_event_type text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_decision is null or p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject' using errcode = '22023';
  end if;
  if p_decision='reject' and (v_notes is null or char_length(v_notes)<10 or char_length(v_notes)>1000) then
    raise exception 'A rejection reason of 10–1000 characters is required' using errcode = '22023';
  end if;

  select * into v_membership
  from public.org_memberships
  where id=p_membership_id
  for update;
  if not found then
    raise exception 'Membership request not found' using errcode = 'P0002';
  end if;
  if v_membership.user_id=v_actor then
    raise exception 'Self-review is prohibited' using errcode = '42501';
  end if;
  if v_membership.status <> 'pending' then
    raise exception 'Only pending requests can be reviewed' using errcode = '55000';
  end if;
  if v_membership.role not in ('member','church_member') then
    raise exception 'This workflow reviews ordinary member requests only' using errcode = '42501';
  end if;
  if not private.can_administer_org(v_membership.org_id) then
    raise exception 'Not authorized for this organization' using errcode = '42501';
  end if;

  -- Revalidate the current profile and organization before approval.
  if p_decision='approve' then
    select * into v_profile from public.profiles where id=v_membership.user_id;
    select * into v_org from public.org_units where id=v_membership.org_id and status='active';
    if not found then
      raise exception 'Organization is no longer active' using errcode = '23514';
    end if;
    if v_profile.member_category='student' then
      if v_org.org_type<>'campus'
        or v_profile.state_of_admission is null
        or lower(btrim(v_profile.state_of_admission))<>lower(btrim(coalesce(v_org.state_name,'')))
        or lower(btrim(coalesce(v_profile.institution_name,'')))<>lower(btrim(coalesce(v_org.institution_name,''))) then
        raise exception 'Student eligibility no longer matches this campus' using errcode = '23514';
      end if;
    elsif v_profile.member_category='non_student' then
      if v_org.org_type<>'church'
        or v_profile.preferred_region_state is null
        or lower(btrim(v_profile.preferred_region_state))<>lower(btrim(coalesce(v_org.state_name,''))) then
        raise exception 'Non-student eligibility no longer matches this church' using errcode = '23514';
      end if;
    else
      raise exception 'Member category is incomplete' using errcode = '23514';
    end if;
  end if;

  if p_decision='approve' then
    v_next_status := 'active';
    v_event_type := 'membership_approved';
    update public.org_memberships
      set status='active', approved_by=v_actor, approved_at=now(),
          joined_at=coalesce(joined_at,now()), status_reason=null,
          status_changed_by=v_actor, status_changed_at=now(), updated_at=now()
      where id=v_membership.id;
  else
    v_next_status := 'rejected';
    v_event_type := 'membership_rejected';
    update public.org_memberships
      set status='rejected', status_reason=v_notes,
          status_changed_by=v_actor, status_changed_at=now(), updated_at=now()
      where id=v_membership.id;
  end if;

  insert into public.membership_events
    (user_id,membership_id,org_id,event_type,actor_user_id,details)
  values
    (v_membership.user_id,v_membership.id,v_membership.org_id,v_event_type,v_actor,
     jsonb_build_object('previous_status','pending','new_status',v_next_status,'reviewer_notes',v_notes));

  return jsonb_build_object('membership_id',v_membership.id,'status',v_next_status,'event_type',v_event_type);
end;
$function$;

revoke all on function private.review_member_onboarding(uuid,text,text) from public, anon, authenticated;
grant execute on function private.review_member_onboarding(uuid,text,text) to authenticated;

create or replace function public.review_member_onboarding(
  p_membership_id uuid,
  p_decision text,
  p_reviewer_notes text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.review_member_onboarding(p_membership_id,p_decision,p_reviewer_notes);
$function$;

revoke all on function public.review_member_onboarding(uuid,text,text) from public, anon;
grant execute on function public.review_member_onboarding(uuid,text,text) to authenticated;

commit;
