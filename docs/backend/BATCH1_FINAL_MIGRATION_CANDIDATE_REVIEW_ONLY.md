# NAASCONNECT Batch 1 — final migration candidate (REVIEW ONLY)

**Status:** Draft for exact owner review; NOT applied  
**V1 authority:** `docs/architecture/NAASCONNECT_Nigeria_System_Architecture_v1.0.md` and `docs/decisions/NAASCONNECT_Nigeria_Approved_Decisions_v1.0.md`  
**Branch:** `feature/naasconnect-frontend-foundation`  
**Supabase project:** `csytneubatlaakpmnsfk`

> This is a review candidate, not an active migration. Do not copy it into the production migrations directory or execute it until the isolated-validation and final-approval gates have passed.

## 1. Eligibility interpretation

The user explicitly confirmed that non-student church eligibility uses the preferred-region state and that residential and preferred-region values remain separate.

For students, V1.0 architecture says ordinary student registration captures basic details and routes the member to the relevant campus; the existing registration code captures both institution and state of admission. This candidate therefore matches a student to an active campus only when **both** the institution name and state of admission match the campus record. This is the conservative interpretation of the fields the existing form collects; it does not invent a new organization hierarchy. If a campus record lacks verified state/institution metadata, the request fails closed and an authorized administrator must correct the organization record. This does not prevent account creation or email verification.

Missing member geography does not block account onboarding. It blocks only a membership request that cannot be validated.

## 2. Live schema facts used

Read-only live inspection on 2026-11-23 confirmed:

- `profiles` currently has `institution_name`, `course_of_study`, `level_of_study`, `state_of_origin`, but no durable category/admission/residence/preferred-region columns.
- `org_units` has `org_type`, `status`, `state_name`, `institution_name`.
- `org_memberships` has unique `(org_id,user_id)`, statuses pending/active/suspended/ended, and a direct self-insert policy that only limits destination to an active campus/church; it does not validate category or region.
- `membership_events` already supports `membership_requested`, `membership_approved`, and `membership_rejected`.
- `private.can_administer_org(uuid)` is the existing hierarchy authorization helper.
- `public.get_membership_review_queue(uuid,text,timestamptz,timestamptz,integer,integer)` is already the read-only scoped queue.
- The existing status-management RPC only suspends/reactivates/ends active memberships; it is not reused for onboarding decisions.
- The transfer engine relies on existing statuses and unique destination membership semantics. The candidate does not change transfer functions.

## 3. Migration SQL candidate

```sql
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
```

## 4. Required application changes (not yet applied in this document)

- Registration writes `member_category`, `state_of_admission`, `residential_state`, and `preferred_region_state` to the authenticated user's `profiles` row after signup/session establishment, or through a narrowly scoped profile-completion server action when email confirmation is pending. Do not use `user_metadata` for authorization.
- Preserve the exact separate fields in profile editor.
- Replace direct `org_memberships.insert(...)` in `app/app/actions.ts` with `supabase.rpc('request_member_onboarding',{p_org_id: orgId})`.
- Add administrator approve/reject server actions calling `review_member_onboarding`; no direct membership UPDATE.
- Handle rejected memberships by showing resubmit action for the same organization; the RPC handles row reuse and event append.
- Keep transfer RPCs and organization-application workflow unchanged.

## 5. Backfill policy

Do not assume the existing Auth metadata is complete. Before any migration, run a read-only reconciliation query grouping accounts into:
- valid student metadata;
- valid non-student metadata with preferred region;
- incomplete/unknown category;
- missing preferred region;
- missing state/institution.

Only exact existing metadata values may be backfilled. Never infer preferred region from residential state. Do not fabricate any missing state or institution. Incomplete accounts retain NULL values and can finish onboarding; they cannot submit a membership request until complete.

## 6. Required regression/security tests

Run in a clean disposable database with controlled accounts before production:

1. Anonymous caller cannot execute either RPC.
2. Authenticated user can submit only their own request; RPC ignores no client-supplied user ID because none is accepted.
3. Student + matching active campus (institution and state) creates one pending `member` membership and one request event.
4. Student + church is rejected.
5. Student + campus with wrong institution is rejected.
6. Student + campus with wrong state is rejected.
7. Non-student + matching preferred-region church creates one pending `church_member` membership and one request event.
8. Non-student + church matching residential state but not preferred region is rejected.
9. Non-student + campus is rejected.
10. Missing category/required geography fails closed.
11. Direct authenticated self-INSERT into `org_memberships` fails.
12. Scoped administrator pending insert path remains functional and cannot grant active authority.
13. Rejected same-organization request resubmits by reusing the same membership ID, resets decision fields, and appends a new request event while preserving the old rejection event.
14. Existing pending/active/suspended/ended same-organization rows cannot be overwritten by the request RPC.
15. Review self-approval is denied.
16. Unrelated/peer administrator review is denied; authorized ancestor/assigned administrator review succeeds.
17. Rejection requires a 10–1000 character reason; approval/rejection and event insert are atomic.
18. Approval revalidates the member profile and active organization.
19. Existing transfer request, transfer approval/rejection/cancellation and destination-reuse rules are unchanged.
20. Existing suspend/reactivate/terminate RPC behavior is unchanged.
21. Existing admin appointment, leadership handover, org application, review queue, scoped directory/reporting, and global status policies remain unchanged.
22. RLS and grants: no anon access; no direct event insert; users can only edit their own profile; no user-editable Auth metadata is used for eligibility.

## 7. Rollback candidate (only if no rejected rows have been created)

Rollback must be reviewed against the final applied migration and live data. The status constraint cannot be reverted while any `rejected` membership rows exist. If such rows exist, first export/preserve their decision history and design a data-preserving forward correction; do not silently map rejected to ended.

For an immediate rollback before any member data is written, in one transaction:
- drop the public wrappers and private functions;
- drop the scoped-admin-only INSERT policy;
- restore the prior combined insert policy only after restoring the original security decision (this would reopen the known eligibility bypass and is therefore **not an acceptable production rollback**);
- restore the status constraint only if no rejected rows exist;
- remove the new profile constraints/columns only after confirming they contain no user data.

Because restoring the old direct self-insert policy reopens the known security gap, the safer operational response to a failed deployment is a forward fix that keeps self-insert closed, not an automatic rollback to insecure policy. The exact production rollback plan must be finalized before migration approval.

## 8. Current gate

- V1.0 architecture and approved decisions reviewed.
- Non-student preferred-region rule confirmed by user.
- Student rule in this candidate is explicitly derived from the current form fields (institution + state of admission), not a new V1 policy amendment.
- Live schema, policies, constraints, membership uniqueness, event types and migration ledger inspected read-only.
- Production schema/data/ledger unchanged.
- No SQL applied; no branch created/reset; no migration replay; no index dropped.
- No clean disposable validation database is available yet. Existing Supabase development branch `main` reports `MIGRATIONS_FAILED` and is not suitable.
- Security advisor currently reports leaked-password protection disabled; this is an existing Auth setting, not a migration regression.
- Current directory has no active campus/church records, so positive end-to-end member requests require controlled fixtures in the isolated test environment.

**Decision requested:** review the complete SQL and test/rollback plan above. This document is not permission to apply the SQL. The prior change-control rule still requires explicit approval of this exact SQL package after isolated validation.
