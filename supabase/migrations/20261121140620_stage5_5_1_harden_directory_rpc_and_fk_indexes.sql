-- Stage 5.5.1: harden the directory RPC and cover new foreign keys.
create index if not exists org_executive_portfolios_created_by_idx on public.org_executive_portfolios(created_by);
create index if not exists org_leadership_positions_org_portfolio_idx on public.org_leadership_positions(org_id,portfolio_id);
create or replace function private.get_org_executive_directory(p_org_id uuid)
returns table(position_id uuid,position_key text,position_title text,portfolio_description text,responsibilities text[],
 display_order integer,is_required boolean,leader_user_id uuid,leader_name text,leader_avatar_url text,
 term_started_at timestamptz,term_ends_at timestamptz,term_status text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.org_memberships m where m.org_id=p_org_id and m.user_id=auth.uid() and m.status='active')
 and not private.can_administer_org(p_org_id) then raise exception 'You are not a member of this organization'; end if;
 return query select p.id,p.position_key,p.position_title,coalesce(ep.description,''),coalesce(ep.responsibilities,'{}'::text[]),
 coalesce(ep.display_order,100),coalesce(ep.is_required,false),p.current_user_id,pr.display_name,pr.avatar_url,
 p.term_started_at,p.term_ends_at,
 case when p.status<>'active' then 'vacant' when p.term_ends_at is null then 'active_no_end_date'
 when p.term_ends_at<now() then 'term_expired' when p.term_ends_at<=now()+interval '60 days' then 'term_ending_soon' else 'active' end
 from public.org_leadership_positions p left join public.org_executive_portfolios ep on ep.id=p.portfolio_id
 left join public.profiles pr on pr.id=p.current_user_id where p.org_id=p_org_id
 order by coalesce(ep.display_order,100),p.position_title;
end; $$;
revoke all on function private.get_org_executive_directory(uuid) from public,anon,authenticated;
grant execute on function private.get_org_executive_directory(uuid) to authenticated;
create or replace function public.get_org_executive_directory(p_org_id uuid)
returns table(position_id uuid,position_key text,position_title text,portfolio_description text,responsibilities text[],
 display_order integer,is_required boolean,leader_user_id uuid,leader_name text,leader_avatar_url text,
 term_started_at timestamptz,term_ends_at timestamptz,term_status text)
language sql stable security invoker set search_path='' as $$ select * from private.get_org_executive_directory($1); $$;
revoke all on function public.get_org_executive_directory(uuid) from public,anon;
grant execute on function public.get_org_executive_directory(uuid) to authenticated;
