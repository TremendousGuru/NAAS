-- NAASCONNECT Stage 5.4: executive appointments and jurisdictional leadership handovers.
create table public.org_leadership_positions (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.org_units(id) on delete restrict,
 position_key text not null check(position_key ~ '^[a-z][a-z0-9_]{1,49}$'),
 position_title text not null check(char_length(btrim(position_title)) between 2 and 100),
 current_user_id uuid references auth.users(id) on delete restrict,
 status text not null default 'vacant' check(status in('vacant','active','suspended')),
 term_started_at timestamptz, term_ends_at timestamptz, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(org_id,position_key),
 check((status='active' and current_user_id is not null and term_started_at is not null) or (status<>'active' and current_user_id is null))
);
create index org_leadership_positions_current_user_idx on public.org_leadership_positions(current_user_id,status);
create index org_leadership_positions_org_status_idx on public.org_leadership_positions(org_id,status);
create table public.leadership_handover_requests (
 id uuid primary key default gen_random_uuid(), position_id uuid not null references public.org_leadership_positions(id) on delete restrict,
 org_id uuid not null references public.org_units(id) on delete restrict, approval_org_id uuid references public.org_units(id) on delete restrict,
 request_kind text not null check(request_kind in('initial_appointment','handover')),
 outgoing_user_id uuid references auth.users(id) on delete restrict, incoming_user_id uuid not null references auth.users(id) on delete restrict,
 submitted_by uuid not null references auth.users(id) on delete restrict,
 status text not null default 'pending' check(status in('pending','approved','rejected','cancelled')),
 request_notes text, reviewer_notes text, reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((request_kind='initial_appointment' and outgoing_user_id is null) or (request_kind='handover' and outgoing_user_id is not null)),
 check((status='pending' and reviewed_at is null and reviewed_by is null) or (status<>'pending' and (status='cancelled' or (reviewed_at is not null and reviewed_by is not null))))
);
create unique index leadership_one_pending_request_per_position on public.leadership_handover_requests(position_id) where status='pending';
create index leadership_handover_org_status_idx on public.leadership_handover_requests(org_id,status,created_at desc);
create index leadership_handover_approval_idx on public.leadership_handover_requests(approval_org_id,status,created_at desc);
create table public.leadership_history (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.org_units(id) on delete restrict,
 position_id uuid not null references public.org_leadership_positions(id) on delete restrict, position_key text not null, position_title text not null,
 outgoing_user_id uuid references auth.users(id) on delete restrict, incoming_user_id uuid not null references auth.users(id) on delete restrict,
 handover_request_id uuid not null unique references public.leadership_handover_requests(id) on delete restrict,
 approved_by uuid not null references auth.users(id) on delete restrict, effective_at timestamptz not null default now(), created_at timestamptz not null default now()
);
create index leadership_history_org_effective_idx on public.leadership_history(org_id,effective_at desc);
create index leadership_history_people_idx on public.leadership_history(outgoing_user_id,incoming_user_id);
create table public.leadership_notification_events (
 id uuid primary key default gen_random_uuid(), org_id uuid not null references public.org_units(id) on delete restrict,
 handover_request_id uuid not null references public.leadership_handover_requests(id) on delete restrict,
 event_type text not null check(event_type in('leadership_handover_submitted','leadership_handover_approved','leadership_handover_rejected')),
 recipient_user_id uuid references auth.users(id) on delete cascade, payload jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), delivered_at timestamptz
);
create index leadership_notification_recipient_idx on public.leadership_notification_events(recipient_user_id,created_at desc);
alter table public.org_leadership_positions enable row level security;
alter table public.leadership_handover_requests enable row level security;
alter table public.leadership_history enable row level security;
alter table public.leadership_notification_events enable row level security;
revoke all on public.org_leadership_positions,public.leadership_handover_requests,public.leadership_history,public.leadership_notification_events from anon,authenticated;
grant select on public.org_leadership_positions,public.leadership_handover_requests,public.leadership_history,public.leadership_notification_events to authenticated;
create policy "Members and scoped leaders read leadership positions" on public.org_leadership_positions for select to authenticated using (
 exists(select 1 from public.org_memberships m where m.org_id=org_leadership_positions.org_id and m.user_id=(select auth.uid()) and m.status='active') or (select private.can_administer_org(org_id)));
create policy "Participants and approving leaders read handover requests" on public.leadership_handover_requests for select to authenticated using (
 submitted_by=(select auth.uid()) or outgoing_user_id=(select auth.uid()) or incoming_user_id=(select auth.uid())
 or (approval_org_id is not null and (select private.can_administer_org(approval_org_id))) or (select private.can_administer_org(org_id)));
create policy "Scoped leaders read leadership history" on public.leadership_history for select to authenticated using (
 (select private.can_administer_org(org_id)) or outgoing_user_id=(select auth.uid()) or incoming_user_id=(select auth.uid()));
create policy "Recipients and scoped leaders read leadership notifications" on public.leadership_notification_events for select to authenticated using (
 recipient_user_id=(select auth.uid()) or (select private.can_administer_org(org_id)));
create trigger leadership_positions_touch_updated_at before update on public.org_leadership_positions for each row execute function private.touch_updated_at();
create trigger leadership_handover_touch_updated_at before update on public.leadership_handover_requests for each row execute function private.touch_updated_at();
create or replace function private.can_approve_leadership_handover(p_org_id uuid,p_approval_org_id uuid,p_outgoing_user_id uuid)
returns boolean language plpgsql stable security definer set search_path='' as $$
declare v_org_type text; v_role_prefix text;
begin
 if auth.uid() is null or auth.uid()=p_outgoing_user_id then return false; end if;
 if p_approval_org_id is null then
  select org_type into v_org_type from public.org_units where id=p_org_id;
  if v_org_type<>'national' then return false; end if;
  return exists(select 1 from public.org_memberships m where m.org_id=p_org_id and m.user_id=auth.uid() and m.status='active' and m.role in('national_admin','national_president'));
 end if;
 select org_type into v_org_type from public.org_units where id=p_approval_org_id;
 if v_org_type is null then return false; end if;
 v_role_prefix:=case v_org_type when 'national' then 'national' when 'union' then 'union' when 'zone' then 'zone' when 'campus' then 'campus' when 'church' then 'church' else null end;
 if v_role_prefix is null then return false; end if;
 return exists(select 1 from public.org_memberships m where m.org_id=p_approval_org_id and m.user_id=auth.uid() and m.status='active' and m.role in(v_role_prefix||'_admin',v_role_prefix||'_president'));
end; $$;
revoke all on function private.can_approve_leadership_handover(uuid,uuid,uuid) from public,anon;
grant execute on function private.can_approve_leadership_handover(uuid,uuid,uuid) to authenticated;
create or replace function private.submit_leadership_handover(p_org_id uuid,p_position_key text,p_position_title text,p_incoming_user_id uuid,p_request_notes text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_org public.org_units%rowtype; v_position public.org_leadership_positions%rowtype; v_kind text; v_outgoing uuid; v_approval_org uuid; v_request_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if char_length(btrim(coalesce(p_position_key,''))) not between 2 and 50 or p_position_key !~ '^[a-z][a-z0-9_]{1,49}$' then raise exception 'Invalid position key'; end if;
 if char_length(btrim(coalesce(p_position_title,''))) not between 2 and 100 then raise exception 'A valid position title is required'; end if;
 if p_incoming_user_id is null or p_incoming_user_id=auth.uid() then raise exception 'Select a different, existing member as the incoming leader'; end if;
 select * into v_org from public.org_units where id=p_org_id and status='active';
 if not found then raise exception 'Organization is not active'; end if;
 if not exists(select 1 from auth.users u where u.id=p_incoming_user_id and u.email_confirmed_at is not null) then raise exception 'Incoming leader must have a verified email account'; end if;
 if not exists(select 1 from public.org_memberships m where m.org_id=p_org_id and m.user_id=p_incoming_user_id and m.status='active') then raise exception 'Incoming leader must already be an active member of this organization'; end if;
 select * into v_position from public.org_leadership_positions where org_id=p_org_id and position_key=p_position_key for update;
 if not found then
  if not private.can_administer_org(p_org_id) then raise exception 'Only an administrator of this organization can submit its initial leadership appointment'; end if;
  insert into public.org_leadership_positions(org_id,position_key,position_title,status) values(p_org_id,p_position_key,btrim(p_position_title),'vacant') returning * into v_position;
 end if;
 if v_position.status='active' then
  v_kind:='handover'; v_outgoing:=v_position.current_user_id;
  if auth.uid()<>v_outgoing and not private.can_administer_org(p_org_id) then raise exception 'Only the current position holder or an organization administrator can request a handover'; end if;
 else
  v_kind:='initial_appointment'; v_outgoing:=null;
  if not private.can_administer_org(p_org_id) then raise exception 'Only an administrator of this organization can submit its initial leadership appointment'; end if;
 end if;
 v_approval_org:=v_org.parent_id;
 insert into public.leadership_handover_requests(position_id,org_id,approval_org_id,request_kind,outgoing_user_id,incoming_user_id,submitted_by,request_notes)
 values(v_position.id,p_org_id,v_approval_org,v_kind,v_outgoing,p_incoming_user_id,auth.uid(),nullif(btrim(p_request_notes),'')) returning id into v_request_id;
 insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload)
 values(p_org_id,v_request_id,'leadership_handover_submitted',v_outgoing,jsonb_build_object('position',p_position_title,'incoming_user_id',p_incoming_user_id,'submitted_by',auth.uid()));
 return v_request_id;
end; $$;
create or replace function public.submit_leadership_handover(p_org_id uuid,p_position_key text,p_position_title text,p_incoming_user_id uuid,p_request_notes text default null)
returns uuid language sql security invoker set search_path='' as $$ select private.submit_leadership_handover(p_org_id,p_position_key,p_position_title,p_incoming_user_id,p_request_notes); $$;
revoke all on function public.submit_leadership_handover(uuid,text,text,uuid,text) from public,anon;
grant execute on function private.submit_leadership_handover(uuid,text,text,uuid,text) to authenticated;
grant execute on function public.submit_leadership_handover(uuid,text,text,uuid,text) to authenticated;
create or replace function private.review_leadership_handover(p_request_id uuid,p_decision text,p_reviewer_notes text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_req public.leadership_handover_requests%rowtype; v_pos public.org_leadership_positions%rowtype; v_org public.org_units%rowtype; v_admin_role text; v_member_role text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_decision not in('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
 select * into v_req from public.leadership_handover_requests where id=p_request_id for update;
 if not found or v_req.status<>'pending' then raise exception 'This leadership request is not pending'; end if;
 if not private.can_approve_leadership_handover(v_req.org_id,v_req.approval_org_id,v_req.outgoing_user_id) then raise exception 'You are not authorized to approve this leadership transition'; end if;
 select * into v_pos from public.org_leadership_positions where id=v_req.position_id for update;
 select * into v_org from public.org_units where id=v_req.org_id;
 if p_decision='rejected' then
  update public.leadership_handover_requests set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),reviewer_notes=nullif(btrim(p_reviewer_notes),''),updated_at=now() where id=p_request_id;
  insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload) values(v_req.org_id,p_request_id,'leadership_handover_rejected',v_req.submitted_by,jsonb_build_object('position',v_pos.position_title,'reviewer',auth.uid()));
  return jsonb_build_object('request_id',p_request_id,'status','rejected');
 end if;
 if v_req.request_kind='handover' and (v_pos.status<>'active' or v_pos.current_user_id is distinct from v_req.outgoing_user_id) then raise exception 'The incumbent changed after this request was submitted; submit a fresh request'; end if;
 if v_req.request_kind='initial_appointment' and v_pos.status='active' then raise exception 'This position has already been filled; submit a handover instead'; end if;
 if not exists(select 1 from auth.users u where u.id=v_req.incoming_user_id and u.email_confirmed_at is not null)
  or not exists(select 1 from public.org_memberships m where m.org_id=v_req.org_id and m.user_id=v_req.incoming_user_id and m.status='active') then raise exception 'Incoming leader no longer meets account and membership requirements'; end if;
 update public.org_leadership_positions set current_user_id=v_req.incoming_user_id,status='active',term_started_at=now() where id=v_pos.id;
 if v_req.position_key='president' then
  v_admin_role:=case v_org.org_type when 'national' then 'national_admin' when 'union' then 'union_admin' when 'zone' then 'zone_admin' when 'campus' then 'campus_admin' when 'church' then 'church_admin' end;
  v_member_role:=case when v_org.org_type='church' then 'church_member' else 'member' end;
  if v_req.outgoing_user_id is not null then update public.org_memberships set role=v_member_role where org_id=v_req.org_id and user_id=v_req.outgoing_user_id and status='active' and role=v_admin_role; end if;
  update public.org_memberships set role=v_admin_role where org_id=v_req.org_id and user_id=v_req.incoming_user_id and status='active';
  update public.org_admin_seats set status='active',updated_at=now() where org_id=v_req.org_id;
 end if;
 insert into public.leadership_history(org_id,position_id,position_key,position_title,outgoing_user_id,incoming_user_id,handover_request_id,approved_by)
 values(v_req.org_id,v_pos.id,v_pos.position_key,v_pos.position_title,v_req.outgoing_user_id,v_req.incoming_user_id,p_request_id,auth.uid());
 update public.leadership_handover_requests set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),reviewer_notes=nullif(btrim(p_reviewer_notes),''),updated_at=now() where id=p_request_id;
 insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload) values(v_req.org_id,p_request_id,'leadership_handover_approved',v_req.incoming_user_id,jsonb_build_object('position',v_pos.position_title,'outgoing_user_id',v_req.outgoing_user_id,'approved_by',auth.uid()));
 if v_req.outgoing_user_id is not null then insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload) values(v_req.org_id,p_request_id,'leadership_handover_approved',v_req.outgoing_user_id,jsonb_build_object('position',v_pos.position_title,'incoming_user_id',v_req.incoming_user_id,'approved_by',auth.uid())); end if;
 return jsonb_build_object('request_id',p_request_id,'status','approved','position_id',v_pos.id,'incoming_user_id',v_req.incoming_user_id);
end; $$;
create or replace function public.review_leadership_handover(p_request_id uuid,p_decision text,p_reviewer_notes text default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.review_leadership_handover(p_request_id,p_decision,p_reviewer_notes); $$;
revoke all on function public.review_leadership_handover(uuid,text,text) from public,anon;
grant execute on function private.review_leadership_handover(uuid,text,text) to authenticated;
grant execute on function public.review_leadership_handover(uuid,text,text) to authenticated;
