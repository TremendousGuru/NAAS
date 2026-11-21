-- Stage 5.7: platform-wide community status updates.
-- Statuses are visible to authenticated platform users for up to 24 hours.
-- Personal posts require an active membership; organization posts require scoped admin authority.

create table public.community_statuses (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_org_id uuid null references public.org_units(id) on delete cascade,
  content text not null,
  media_url text null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  constraint community_statuses_content_length check (char_length(btrim(content)) between 1 and 2000),
  constraint community_statuses_media_url_https check (media_url is null or (char_length(media_url) <= 2048 and media_url ~ '^https://')),
  constraint community_statuses_expiry_window check (expires_at > created_at and expires_at <= created_at + interval '24 hours')
);

create index community_statuses_feed_idx on public.community_statuses (expires_at, created_at desc);

alter table public.community_statuses enable row level security;

create policy "Authenticated users read unexpired community statuses"
on public.community_statuses for select to authenticated
using (expires_at > now());

create policy "Active members create personal statuses"
on public.community_statuses for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  and author_org_id is null
  and exists (
    select 1 from public.org_memberships m
    where m.user_id = (select auth.uid()) and m.status = 'active'
  )
);

create policy "Authorized organization admins create organization statuses"
on public.community_statuses for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  and author_org_id is not null
  and (select private.can_administer_org(author_org_id))
);

create policy "Authors delete their personal statuses"
on public.community_statuses for delete to authenticated
using (author_user_id = (select auth.uid()) and author_org_id is null);

create policy "Scoped admins delete organization statuses"
on public.community_statuses for delete to authenticated
using (author_org_id is not null and (select private.can_administer_org(author_org_id)));

revoke all on public.community_statuses from anon;
grant select, insert, delete on public.community_statuses to authenticated;
