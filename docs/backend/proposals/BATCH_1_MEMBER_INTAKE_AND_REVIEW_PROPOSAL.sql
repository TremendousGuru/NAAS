-- NAASCONNECT Batch 1 proposal only.
-- NOT APPLIED. This file is intentionally outside supabase/migrations/.
-- Target project: csytneubatlaakpmnsfk
-- Review against the live schema and V1.0 before separate database-write approval.
--
-- Design:
-- 1) Keep profiles.institution_name/course_of_study/level_of_study as their existing
--    canonical fields; do not duplicate them in a new table.
-- 2) Store student/non-student classification, admission/residence state and
--    optional preferred campus/church in a one-row-per-user intake record.
-- 3) Keep membership lifecycle and review status in org_memberships + membership_events.
-- 4) Use a private SECURITY DEFINER transaction with explicit auth.uid() and scoped
--    administrator checks only for initial approval/rejection; expose a narrow wrapper.

begin;

create table if not exists public.member_onboarding_intakes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_category text not null
    check (member_category in ('student','non_student')),
  state_of_admission text,
  state_of_residence text,
  preferred_org_id uuid references public.org_units(id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_onboarding_intakes_category_state_check check (
    (member_category = 'student'
      and nullif(btrim(state_of_admission),'') is not null
      and state_of_residence is null)
    or
    (member_category = 'non_student'
      and nullif(btrim(state_of_residence),'') is not null
      and state_of_admission is null)
  )
);

alter table public.member_onboarding_intakes enable row level security;
revoke all on public.member_onboarding_intakes from anon, authenticated;
grant select, insert, update on public.member_onboarding_intakes to authenticated;

create policy "Users read own onboarding intake"
  on public.member_onboarding_intakes for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users create own onboarding intake"
  on public.member_onboarding_intakes for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update own onboarding intake"
  on public.member_onboarding_intakes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- The existing org_memberships table has no rejected state. Add it explicitly so
-- rejection is not misrepresented as termination/ended.
alter table public.org_memberships
  drop constraint org_memberships_status_check;
alter table public.org_memberships
  add constraint org_memberships_status_check
  check (status = any (array['pending','active','suspended','ended','rejected']));

-- The live membership_events constraint already contains membership_approved and
-- membership_rejected, so no event-type constraint change is needed.

create or replace function private.review_membership_request(
  p_membership_id uuid,
  p_decision text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_membership public.org_memberships%rowtype;
  v_event_type text;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject' using errcode = '22023';
  end if;

  if p_decision = 'reject'
     and (nullif(btrim(p_reason),'') is null
       or char_length(btrim(p_reason)) < 10
       or char_length(btrim(p_reason)) > 1000) then
    raise exception 'A rejection reason between 10 and 1000 characters is required'
      using errcode = '22023';
  end if;

  select * into v_membership
  from public.org_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Membership request not found' using errcode = 'P0002';
  end if;

  if v_membership.user_id = v_actor then
    raise exception 'Administrators cannot review their own membership'
      using errcode = '42501';
  end if;

  if not private.can_administer_org(v_membership.org_id) then
    raise exception 'Not authorized for this organization scope'
      using errcode = '42501';
  end if;

  if v_membership.status <> 'pending' then
    raise exception 'Only pending membership requests can be reviewed'
      using errcode = '55000';
  end if;

  if p_decision = 'approve' then
    update public.org_memberships
      set status = 'active',
          approved_by = v_actor,
          approved_at = now(),
          joined_at = now(),
          status_reason = null,
          status_changed_by = v_actor,
          status_changed_at = now(),
          updated_at = now()
    where id = v_membership.id;
    v_event_type := 'membership_approved';
  else
    update public.org_memberships
      set status = 'rejected',
          status_reason = btrim(p_reason),
          status_changed_by = v_actor,
          status_changed_at = now(),
          updated_at = now()
    where id = v_membership.id;
    v_event_type := 'membership_rejected';
  end if;

  insert into public.membership_events
    (user_id,membership_id,org_id,event_type,actor_user_id,details)
  values
    (v_membership.user_id,v_membership.id,v_membership.org_id,v_event_type,v_actor,
     jsonb_build_object(
       'previous_status','pending',
       'new_status',case when p_decision='approve' then 'active' else 'rejected' end,
       'reason',nullif(btrim(p_reason),'')
     ));

  return jsonb_build_object(
    'membership_id',v_membership.id,
    'user_id',v_membership.user_id,
    'org_id',v_membership.org_id,
    'decision',p_decision,
    'status',case when p_decision='approve' then 'active' else 'rejected' end,
    'event_type',v_event_type
  );
end;
$function$;

revoke all on function private.review_membership_request(uuid,text,text) from public, anon;
grant execute on function private.review_membership_request(uuid,text,text) to authenticated;

create or replace function public.review_membership_request(
  p_membership_id uuid,
  p_decision text,
  p_reason text default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $function$
  select private.review_membership_request(p_membership_id,p_decision,p_reason);
$function$;

revoke all on function public.review_membership_request(uuid,text,text) from public, anon;
grant execute on function public.review_membership_request(uuid,text,text) to authenticated;

commit;

-- Required pre-apply validation (run in a disposable/local clone first):
-- * Verify the exact current constraint names and event schema.
-- * Verify private schema grants and wrapper execute grants.
-- * Add a transaction test for own-intake RLS and cross-user denial.
-- * Add tests for scoped admin approval/rejection, no self-review, concurrent review,
--   rejection reason validation, and event creation.
-- * Run Supabase security/performance advisors.
-- * Review how pending union/zone/campus/church records are activated/populated.
--
-- This proposal intentionally does not seed organizations, alter V1.0 roles,
-- backfill user metadata, or apply any database changes.
