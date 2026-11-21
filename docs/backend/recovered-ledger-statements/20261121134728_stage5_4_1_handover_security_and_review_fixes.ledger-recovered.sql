
-- Stage 5.4 hardening: reviewer visibility, separation of duties, and position-key reference.
drop policy if exists "Participants and approving leaders read handover requests" on public.leadership_handover_requests;
create policy "Participants and approving leaders read handover requests" on public.leadership_handover_requests
for select to authenticated using (
 submitted_by=(select auth.uid()) or outgoing_user_id=(select auth.uid()) or incoming_user_id=(select auth.uid())
 or (approval_org_id is not null and (select private.can_administer_org(approval_org_id)))
 or (select private.can_administer_org(org_id))
 or (select private.can_approve_leadership_handover(org_id,approval_org_id,outgoing_user_id))
);
create or replace function private.review_leadership_handover(p_request_id uuid,p_decision text,p_reviewer_notes text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_req public.leadership_handover_requests%rowtype; v_pos public.org_leadership_positions%rowtype;
 v_org public.org_units%rowtype; v_admin_role text; v_member_role text;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_decision not in('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
 select * into v_req from public.leadership_handover_requests where id=p_request_id for update;
 if not found or v_req.status<>'pending' then raise exception 'This leadership request is not pending'; end if;
 if auth.uid()=v_req.submitted_by then raise exception 'The person who submitted a leadership request cannot approve their own request'; end if;
 if not private.can_approve_leadership_handover(v_req.org_id,v_req.approval_org_id,v_req.outgoing_user_id) then raise exception 'You are not authorized to approve this leadership transition'; end if;
 select * into v_pos from public.org_leadership_positions where id=v_req.position_id for update;
 select * into v_org from public.org_units where id=v_req.org_id;
 if p_decision='rejected' then
   update public.leadership_handover_requests set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),reviewer_notes=nullif(btrim(p_reviewer_notes),''),updated_at=now() where id=p_request_id;
   insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload)
   values(v_req.org_id,p_request_id,'leadership_handover_rejected',v_req.submitted_by,jsonb_build_object('position',v_pos.position_title,'reviewer',auth.uid()));
   return jsonb_build_object('request_id',p_request_id,'status','rejected');
 end if;
 if v_req.request_kind='handover' and (v_pos.status<>'active' or v_pos.current_user_id is distinct from v_req.outgoing_user_id) then raise exception 'The incumbent changed after this request was submitted; submit a fresh request'; end if;
 if v_req.request_kind='initial_appointment' and v_pos.status='active' then raise exception 'This position has already been filled; submit a handover instead'; end if;
 if not exists(select 1 from auth.users u where u.id=v_req.incoming_user_id and u.email_confirmed_at is not null)
   or not exists(select 1 from public.org_memberships m where m.org_id=v_req.org_id and m.user_id=v_req.incoming_user_id and m.status='active') then raise exception 'Incoming leader no longer meets account and membership requirements'; end if;
 update public.org_leadership_positions set current_user_id=v_req.incoming_user_id,status='active',term_started_at=now() where id=v_pos.id;
 if v_pos.position_key='president' then
   v_admin_role:=case v_org.org_type when 'national' then 'national_admin' when 'union' then 'union_admin' when 'zone' then 'zone_admin' when 'campus' then 'campus_admin' when 'church' then 'church_admin' end;
   v_member_role:=case when v_org.org_type='church' then 'church_member' else 'member' end;
   if v_req.outgoing_user_id is not null then
     update public.org_memberships set role=v_member_role where org_id=v_req.org_id and user_id=v_req.outgoing_user_id and status='active' and role=v_admin_role;
   end if;
   update public.org_memberships set role=v_admin_role where org_id=v_req.org_id and user_id=v_req.incoming_user_id and status='active';
   update public.org_admin_seats set status='active',updated_at=now() where org_id=v_req.org_id;
 end if;
 insert into public.leadership_history(org_id,position_id,position_key,position_title,outgoing_user_id,incoming_user_id,handover_request_id,approved_by)
 values(v_req.org_id,v_pos.id,v_pos.position_key,v_pos.position_title,v_req.outgoing_user_id,v_req.incoming_user_id,p_request_id,auth.uid());
 update public.leadership_handover_requests set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),reviewer_notes=nullif(btrim(p_reviewer_notes),''),updated_at=now() where id=p_request_id;
 insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload)
 values(v_req.org_id,p_request_id,'leadership_handover_approved',v_req.incoming_user_id,jsonb_build_object('position',v_pos.position_title,'outgoing_user_id',v_req.outgoing_user_id,'approved_by',auth.uid()));
 if v_req.outgoing_user_id is not null then
   insert into public.leadership_notification_events(org_id,handover_request_id,event_type,recipient_user_id,payload)
   values(v_req.org_id,p_request_id,'leadership_handover_approved',v_req.outgoing_user_id,jsonb_build_object('position',v_pos.position_title,'incoming_user_id',v_req.incoming_user_id,'approved_by',auth.uid()));
 end if;
 return jsonb_build_object('request_id',p_request_id,'status','approved','position_id',v_pos.id,'incoming_user_id',v_req.incoming_user_id);
end; $$;
