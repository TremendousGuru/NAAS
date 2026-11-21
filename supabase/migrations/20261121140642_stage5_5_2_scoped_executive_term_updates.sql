-- Stage 5.5.2: scoped executive term updates.
create or replace function private.set_executive_term(p_position_id uuid,p_term_ends_at timestamptz,p_appointment_notes text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_pos public.org_leadership_positions%rowtype;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select * into v_pos from public.org_leadership_positions where id=p_position_id for update;
 if not found then raise exception 'Executive position not found'; end if;
 if not private.can_administer_org(v_pos.org_id) then raise exception 'You cannot manage executives outside your administrative jurisdiction'; end if;
 if v_pos.status<>'active' then raise exception 'Only an active executive appointment can have a term end date'; end if;
 if p_term_ends_at is not null and p_term_ends_at<=coalesce(v_pos.term_started_at,now()) then raise exception 'Term end must be after the appointment start date'; end if;
 update public.org_leadership_positions set term_ends_at=p_term_ends_at,appointment_notes=nullif(btrim(p_appointment_notes),''),updated_at=now() where id=p_position_id;
 return jsonb_build_object('position_id',p_position_id,'term_ends_at',p_term_ends_at,'updated',true);
end; $$;
create or replace function public.set_executive_term(p_position_id uuid,p_term_ends_at timestamptz,p_appointment_notes text default null)
returns jsonb language sql security invoker set search_path='' as $$ select private.set_executive_term($1,$2,$3); $$;
revoke all on function private.set_executive_term(uuid,timestamptz,text) from public,anon,authenticated;
grant execute on function private.set_executive_term(uuid,timestamptz,text) to authenticated;
revoke all on function public.set_executive_term(uuid,timestamptz,text) from public,anon;
grant execute on function public.set_executive_term(uuid,timestamptz,text) to authenticated;
