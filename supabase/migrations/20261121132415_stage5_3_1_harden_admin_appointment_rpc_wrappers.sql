-- Keep privileged appointment mutation inside the private schema.
-- Public RPC entrypoints are SECURITY INVOKER wrappers only.
create or replace function private.submit_admin_appointment(p_seat_id uuid,p_nominee_name text,p_nominee_email text)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_seat public.org_admin_seats%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if char_length(btrim(coalesce(p_nominee_name,''))) not between 2 and 120 then raise exception 'A valid nominee name is required'; end if;
 if lower(btrim(coalesce(p_nominee_email,''))) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'A valid nominee email is required'; end if;
 select * into v_seat from public.org_admin_seats where id=p_seat_id for update;
 if not found or v_seat.status not in('reserved','retired') then raise exception 'Seat unavailable'; end if;
 if not private.can_administer_org(v_seat.approval_org_id) then raise exception 'Not authorized for this jurisdiction'; end if;
 insert into public.admin_appointment_requests(seat_id,nominee_name,nominee_email,requested_by) values(p_seat_id,btrim(p_nominee_name),lower(btrim(p_nominee_email)),auth.uid()) returning id into v_id;
 update public.org_admin_seats set status='pending_approval',updated_at=now() where id=p_seat_id;
 return v_id;
end; $$;
create or replace function public.submit_admin_appointment(p_seat_id uuid,p_nominee_name text,p_nominee_email text)
returns uuid language sql security invoker set search_path='' as $$ select private.submit_admin_appointment(p_seat_id,p_nominee_name,p_nominee_email); $$;
revoke all on function public.submit_admin_appointment(uuid,text,text) from public,anon;
grant execute on function private.submit_admin_appointment(uuid,text,text) to authenticated;
grant execute on function public.submit_admin_appointment(uuid,text,text) to authenticated;
create or replace function private.review_admin_appointment(p_request_id uuid,p_decision text,p_notes text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_req public.admin_appointment_requests%rowtype; v_seat public.org_admin_seats%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if p_decision not in('approved','rejected') then raise exception 'Invalid decision'; end if;
 select * into v_req from public.admin_appointment_requests where id=p_request_id for update;
 if not found or v_req.status<>'pending' then raise exception 'Request is not pending'; end if;
 select * into v_seat from public.org_admin_seats where id=v_req.seat_id for update;
 if not private.can_administer_org(v_seat.approval_org_id) then raise exception 'Not authorized to review this appointment'; end if;
 update public.admin_appointment_requests set status=p_decision,reviewed_by=auth.uid(),reviewed_at=now(),reviewer_notes=nullif(btrim(p_notes),''),updated_at=now() where id=p_request_id;
 update public.org_admin_seats set status=case when p_decision='approved' then 'awaiting_appointee' else 'reserved' end,updated_at=now() where id=v_seat.id;
 return jsonb_build_object('request_id',p_request_id,'status',p_decision,'seat_id',v_seat.id);
end; $$;
create or replace function public.review_admin_appointment(p_request_id uuid,p_decision text,p_notes text default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.review_admin_appointment(p_request_id,p_decision,p_notes); $$;
revoke all on function public.review_admin_appointment(uuid,text,text) from public,anon;
grant execute on function private.review_admin_appointment(uuid,text,text) to authenticated;
grant execute on function public.review_admin_appointment(uuid,text,text) to authenticated;
