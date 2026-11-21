
-- Stage 5.5: executive portfolio catalogue, responsibilities, and safe scoped directory.
create table if not exists public.org_executive_portfolios (
 id uuid primary key default gen_random_uuid(),
 org_id uuid not null references public.org_units(id) on delete restrict,
 portfolio_key text not null check (portfolio_key ~ '^[a-z][a-z0-9_]{1,49}$'),
 title text not null check (char_length(btrim(title)) between 2 and 100),
 description text,
 responsibilities text[] not null default '{}',
 display_order integer not null default 100 check(display_order between 0 and 10000),
 is_required boolean not null default false,
 term_duration_months integer check(term_duration_months between 1 and 60),
 status text not null default 'active' check(status in ('active','inactive')),
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(org_id,portfolio_key),
 unique(org_id,id)
);
create index if not exists org_executive_portfolios_org_order_idx
 on public.org_executive_portfolios(org_id,status,display_order);
alter table public.org_executive_portfolios enable row level security;
drop policy if exists "Active organization members read executive portfolios" on public.org_executive_portfolios;
create policy "Active organization members read executive portfolios"
 on public.org_executive_portfolios for select to authenticated
 using (exists(select 1 from public.org_memberships m where m.org_id=org_executive_portfolios.org_id and m.user_id=(select auth.uid()) and m.status='active')
 or (select private.can_administer_org(org_id)));
alter table public.org_leadership_positions
 add column if not exists portfolio_id uuid,
 add column if not exists appointment_notes text;
do $$ begin
 if not exists(select 1 from pg_constraint where conname='org_leadership_positions_portfolio_org_fk') then
  alter table public.org_leadership_positions add constraint org_leadership_positions_portfolio_org_fk
  foreign key(org_id,portfolio_id) references public.org_executive_portfolios(org_id,id) on delete restrict;
 end if;
end $$;
create index if not exists org_leadership_positions_portfolio_idx on public.org_leadership_positions(portfolio_id);
-- Keep portfolio metadata and position assignment in sync by matching the stable portfolio key.
create or replace function private.sync_executive_portfolio_position()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 update public.org_leadership_positions p set portfolio_id=new.id,updated_at=now()
 where p.org_id=new.org_id and p.position_key=new.portfolio_key;
 return new;
end; $$;
drop trigger if exists sync_executive_portfolio_position on public.org_executive_portfolios;
create trigger sync_executive_portfolio_position after insert or update of title,description,responsibilities,display_order,is_required,term_duration_months,status
 on public.org_executive_portfolios for each row execute function private.sync_executive_portfolio_position();
create or replace function private.save_executive_portfolio(
 p_org_id uuid,p_portfolio_key text,p_title text,p_description text,p_responsibilities text[],
 p_display_order integer default 100,p_is_required boolean default false,p_term_duration_months integer default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not private.can_administer_org(p_org_id) then raise exception 'You cannot manage executives outside your administrative jurisdiction'; end if;
 if p_portfolio_key !~ '^[a-z][a-z0-9_]{1,49}$' then raise exception 'Invalid portfolio key'; end if;
 if char_length(btrim(coalesce(p_title,''))) not between 2 and 100 then raise exception 'A valid portfolio title is required'; end if;
 if p_display_order not between 0 and 10000 then raise exception 'Display order is outside the allowed range'; end if;
 if p_term_duration_months is not null and p_term_duration_months not between 1 and 60 then raise exception 'Term duration must be between 1 and 60 months'; end if;
 if exists(select 1 from unnest(coalesce(p_responsibilities,'{}'::text[])) x where char_length(btrim(x)) not between 3 and 300) then raise exception 'Each responsibility must contain 3 to 300 characters'; end if;
 insert into public.org_executive_portfolios(org_id,portfolio_key,title,description,responsibilities,display_order,is_required,term_duration_months,created_by,updated_at)
 values(p_org_id,p_portfolio_key,btrim(p_title),nullif(btrim(p_description),''),coalesce(p_responsibilities,'{}'),p_display_order,coalesce(p_is_required,false),p_term_duration_months,auth.uid(),now())
 on conflict(org_id,portfolio_key) do update set title=excluded.title,description=excluded.description,responsibilities=excluded.responsibilities,
 display_order=excluded.display_order,is_required=excluded.is_required,term_duration_months=excluded.term_duration_months,updated_at=now()
 returning id into v_id;
 return v_id;
end; $$;
create or replace function public.save_executive_portfolio(
 p_org_id uuid,p_portfolio_key text,p_title text,p_description text,p_responsibilities text[],
 p_display_order integer default 100,p_is_required boolean default false,p_term_duration_months integer default null
) returns uuid language sql security invoker set search_path='' as $$
 select private.save_executive_portfolio($1,$2,$3,$4,$5,$6,$7,$8);
$$;
revoke all on function private.save_executive_portfolio(uuid,text,text,text,text[],integer,boolean,integer) from public,anon,authenticated;
grant execute on function private.save_executive_portfolio(uuid,text,text,text,text[],integer,boolean,integer) to authenticated;
revoke all on function public.save_executive_portfolio(uuid,text,text,text,text[],integer,boolean,integer) from public,anon;
grant execute on function public.save_executive_portfolio(uuid,text,text,text,text[],integer,boolean,integer) to authenticated;
-- Safe member-visible directory: only public profile fields are returned, and only for organizations
-- in which the caller has an active membership or administrative jurisdiction.
create or replace function public.get_org_executive_directory(p_org_id uuid)
returns table(position_id uuid,position_key text,position_title text,portfolio_description text,responsibilities text[],
 display_order integer,is_required boolean,leader_user_id uuid,leader_name text,leader_avatar_url text,
 term_started_at timestamptz,term_ends_at timestamptz,term_status text)
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.org_memberships m where m.org_id=p_org_id and m.user_id=auth.uid() and m.status='active')
 and not private.can_administer_org(p_org_id) then raise exception 'You are not a member of this organization'; end if;
 return query
 select p.id,p.position_key,p.position_title,coalesce(ep.description,''),coalesce(ep.responsibilities,'{}'::text[]),
 coalesce(ep.display_order,100),coalesce(ep.is_required,false),p.current_user_id,pr.display_name,pr.avatar_url,
 p.term_started_at,p.term_ends_at,
 case when p.status<>'active' then 'vacant' when p.term_ends_at is null then 'active_no_end_date'
 when p.term_ends_at<now() then 'term_expired' when p.term_ends_at<=now()+interval '60 days' then 'term_ending_soon' else 'active' end
 from public.org_leadership_positions p
 left join public.org_executive_portfolios ep on ep.id=p.portfolio_id
 left join public.profiles pr on pr.id=p.current_user_id
 where p.org_id=p_org_id
 order by coalesce(ep.display_order,100),p.position_title;
end; $$;
revoke all on function public.get_org_executive_directory(uuid) from public,anon;
grant execute on function public.get_org_executive_directory(uuid) to authenticated;
create index if not exists org_leadership_positions_term_end_idx
 on public.org_leadership_positions(term_ends_at) where status='active' and term_ends_at is not null;
