-- NAASCONNECT Stage 5.2: profiles, organization applications, and member self-enrollment.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 2 and 120),
  phone text, avatar_url text, institution_name text, course_of_study text, level_of_study text, state_of_origin text,
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
grant select, insert, update on public.profiles to authenticated;
revoke all on public.profiles from anon;
create policy "Users read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create trigger profiles_touch_updated_at before update on public.profiles for each row execute function private.touch_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare candidate_name text;
begin
  candidate_name := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'),''),nullif(btrim(new.raw_user_meta_data ->> 'name'),''),split_part(coalesce(new.email,'New member'),'@',1));
  insert into public.profiles (id,display_name) values (new.id,left(candidate_name,120)) on conflict (id) do nothing;
  return new;
end;
$function$;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function private.handle_new_auth_user();

create table public.org_applications (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references auth.users(id) on delete cascade,
 requested_org_type text not null check (requested_org_type in ('union','zone','campus','church')),
 parent_org_id uuid not null references public.org_units(id) on delete restrict,
 organization_name text not null check (char_length(btrim(organization_name)) between 2 and 180),
 state_name text, conference_name text, institution_name text, contact_email text not null,
 whatsapp_url text, website_url text, justification text,
 status text not null default 'pending' check (status in ('pending','under_review','approved','rejected','withdrawn')),
 reviewed_by uuid references auth.users(id) on delete set null, reviewed_at timestamptz, reviewer_notes text,
 created_org_id uuid references public.org_units(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint org_applications_review_state_check check (
  (status in ('pending','under_review','withdrawn') and reviewed_at is null)
  or (status in ('approved','rejected') and reviewed_at is not null)
 )
);
create index org_applications_applicant_idx on public.org_applications(applicant_id,created_at desc);
create index org_applications_parent_status_idx on public.org_applications(parent_org_id,status,created_at desc);
alter table public.org_applications enable row level security;
grant select, insert, update on public.org_applications to authenticated;
revoke all on public.org_applications from anon;
create policy "Applicants create their own organization applications" on public.org_applications for insert to authenticated
with check (
 applicant_id=(select auth.uid()) and status='pending' and reviewed_by is null and reviewed_at is null and created_org_id is null
 and exists (select 1 from public.org_units p where p.id=parent_org_id and p.status='active' and (
  (requested_org_type='union' and p.org_type='national') or (requested_org_type='zone' and p.org_type='union')
  or (requested_org_type in ('campus','church') and p.org_type='zone')
 ))
);
create policy "Applicants and jurisdiction admins read applications" on public.org_applications for select to authenticated
using (applicant_id=(select auth.uid()) or (select private.can_administer_org(parent_org_id)));
create policy "Jurisdiction admins review applications" on public.org_applications for update to authenticated
using ((select private.can_administer_org(parent_org_id)))
with check ((select private.can_administer_org(parent_org_id)) and status in ('pending','under_review','approved','rejected'));
create trigger org_applications_touch_updated_at before update on public.org_applications for each row execute function private.touch_updated_at();
create policy "Users request basic organization membership" on public.org_memberships for insert to authenticated
with check (
 user_id=(select auth.uid()) and status='pending' and approved_by is null and approved_at is null and joined_at is null
 and role=case when exists(select 1 from public.org_units o where o.id=org_id and o.org_type='church') then 'church_member' else 'member' end
 and exists(select 1 from public.org_units o where o.id=org_id and o.status='active')
);
