# NAASCONNECT V1.0 — Durable member onboarding extension

**Status: PROPOSED — NOT APPLIED.** This file is a review artifact, not an active migration.
**Branch:** `feature/naasconnect-frontend-foundation`
**Live project inspected:** `csytneubatlaakpmnsfk`

## Decisions from the live schema and V1.0 dossier

The existing model already separates identity, profile, organization and membership:

- `auth.users` is the identity/session source.
- `public.profiles` is one profile per person; RLS currently allows users to read and update only their own row.
- `public.org_units` stores national, union, zone, campus and church records. Its existing read policy exposes active organizations to authenticated users.
- `public.org_memberships` is the durable member-to-organization relationship and already supports a pending self-request for an active campus or church.
- `public.org_applications` is for an applicant proposing a new organization. It is not the individual member intake queue.
- `public.membership_events` already records requested, approved, rejected and lifecycle events.
- `public.get_membership_review_queue` already exists as the scoped review-queue read RPC.
- `public.manage_membership_status` handles suspend/reactivate/terminate, not initial approval. It must not be misused as the approval endpoint.
- `private.can_administer_org(uuid)` is the existing jurisdiction authorization helper.

No new onboarding or membership table is proposed. Student/non-student details belong on the existing profile. A campus/church application remains a pending row in `org_memberships`. Review remains jurisdiction-scoped.

## Proposed profile extension

Add the following optional durable columns to `profiles`:

- `member_category`: student or non_student.
- `state_of_admission`: Nigerian state/FCT where a student studies.
- `residential_state`: state/FCT for a non-student.
- `preferred_zone_id`: selected active NAAS zone, nullable until the directory is verified.
- `institution_org_id`: matched campus/ASF organization, nullable until selected/verified.

The existing `institution_name`, `course_of_study`, `level_of_study`, `phone` and `state_of_origin` columns remain in use. The free-text institution name can be retained while a user is waiting for an active campus record. Profile metadata is descriptive only; neither profile fields nor user-editable Auth metadata can grant permissions.

## Proposed membership review

The existing `org_memberships` status check currently allows pending, active, suspended and ended. Add a terminal `rejected` state so rejection is not incorrectly represented as termination. Add a narrowly scoped `public.review_member_onboarding(uuid,text,text)` RPC:

- Requires a signed-in actor.
- Locks the pending membership row.
- Blocks self-review.
- Requires `private.can_administer_org(org_id)`.
- Accepts approve/reject only.
- Requires a meaningful rejection reason.
- On approval, sets active/approved_by/approved_at/joined_at.
- On rejection, sets rejected/status_reason.
- Writes the existing `membership_events` record with the existing `membership_approved` or `membership_rejected` event type.
- Uses a fixed empty search_path and revokes public/anon execution; grants execution only to authenticated users.

The existing RLS policies remain in place. The RPC is the atomic, auditable approval route; the frontend must not directly update pending membership rows.

## SQL proposal

The complete SQL is in this file below. It has **not** been run against Supabase, inserted into the migration ledger, or added to the active migrations directory.

```sql
-- PROPOSAL ONLY — DO NOT APPLY WITHOUT OWNER APPROVAL.
-- Extends the existing V1.0 profiles/org_memberships model.
-- No new member, membership-request, or organization-application table is created.

begin;

alter table public.profiles
  add column if not exists member_category text,
  add column if not exists state_of_admission text,
  add column if not exists residential_state text,
  add column if not exists preferred_zone_id uuid references public.org_units(id) on delete set null,
  add column if not exists institution_org_id uuid references public.org_units(id) on delete set null;

alter table public.profiles
  add constraint profiles_member_category_check
  check (member_category is null or member_category in ('student','non_student'));

alter table public.org_memberships
  drop constraint if exists org_memberships_status_check;

alter table public.org_memberships
  add constraint org_memberships_status_check
  check (status = any (array['pending','active','suspended','ended','rejected']));

create or replace function public.review_member_onboarding(
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
  v_event_type text;
  v_next_status text;
  v_notes text := nullif(btrim(p_reviewer_notes), '');
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_decision not in ('approve','reject') then
    raise exception 'Decision must be approve or reject' using errcode = '22023';
  end if;
  if p_decision = 'reject' and (v_notes is null or char_length(v_notes) < 10 or char_length(v_notes) > 1000) then
    raise exception 'A rejection reason between 10 and 1000 characters is required' using errcode = '22023';
  end if;

  select * into v_membership
  from public.org_memberships
  where id = p_membership_id
  for update;

  if not found then
    raise exception 'Membership request not found' using errcode = 'P0002';
  end if;
  if v_membership.user_id = v_actor then
    raise exception 'You cannot review your own membership request' using errcode = '42501';
  end if;
  if v_membership.status <> 'pending' then
    raise exception 'Only pending membership requests can be reviewed' using errcode = '55000';
  end if;
  if not private.can_administer_org(v_membership.org_id) then
    raise exception 'You are not authorized to review this organization membership' using errcode = '42501';
  end if;

  if p_decision = 'approve' then
    v_next_status := 'active';
    v_event_type := 'membership_approved';
    update public.org_memberships
      set status = 'active', approved_by = v_actor, approved_at = now(),
          joined_at = coalesce(joined_at, now()), status_reason = null,
          status_changed_by = v_actor, status_changed_at = now(), updated_at = now()
      where id = v_membership.id;
  else
    v_next_status := 'rejected';
    v_event_type := 'membership_rejected';
    update public.org_memberships
      set status = 'rejected', status_reason = v_notes,
          status_changed_by = v_actor, status_changed_at = now(), updated_at = now()
      where id = v_membership.id;
  end if;

  insert into public.membership_events
    (user_id,membership_id,org_id,event_type,actor_user_id,details)
  values
    (v_membership.user_id,v_membership.id,v_membership.org_id,v_event_type,v_actor,
     jsonb_build_object('previous_status','pending','new_status',v_next_status,'reviewer_notes',v_notes));

  return jsonb_build_object('membership_id',v_membership.id,'status',v_next_status,'event_type',v_event_type);
end;
$function$;

revoke all on function public.review_member_onboarding(uuid,text,text) from public;
revoke all on function public.review_member_onboarding(uuid,text,text) from anon;
grant execute on function public.review_member_onboarding(uuid,text,text) to authenticated;

commit;

```

## Current data and operational constraints

At inspection, the live directory had 24 organization rows: one national root, three pending unions and twenty pending zones; there were no active campus or church records. `org_memberships` had zero rows. Therefore, the existing self-service membership request path cannot yet present a valid campus/church destination. Do not manufacture organization records or activate provisional geography to make the form appear complete.

The existing member registration form captures student/non-student, state, institution, course and level. The current branch also adds self-profile editing against existing profile columns. Durable category/admission/residential/zone fields and a transactional approval RPC require the proposed schema change above.

## Email verification and session recovery

Current application code uses Supabase Auth email confirmation, a PKCE callback, server-side `getUser()`, cookie/session refresh middleware, password reset email and `updateUser({ password })` on the recovery page. A valid confirmation code is exchanged for a session before redirecting. The app never treats email verification as organization membership or admin approval.

Before production acceptance, the project owner must verify in Supabase Auth settings:
- Site URL and allowed redirect URLs include the deployed NAASCONNECT domains.
- Email confirmation is enabled as intended.
- SMTP/provider delivery and sender identity work.
- Confirmation and recovery templates use the correct callback links.

A real email delivery and recovery test cannot be completed from repository inspection alone.

## Approval requested

Please review the SQL proposal and explicitly approve or reject applying it to the live Supabase project. Until that separate approval is received, this SQL remains documentation only. No database migration, schema write, migration-ledger change, paid branch or service-role action has been performed.
