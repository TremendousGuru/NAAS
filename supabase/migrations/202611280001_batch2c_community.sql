-- Batch 2C: persistent community content, reporting and moderation.
-- Additive only: does not alter membership, profile, organization or Global Status tables.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_org_id uuid references public.org_units(id) on delete set null,
  post_type text not null default 'post' check (post_type in ('post','announcement')),
  audience text not null default 'community' check (audience in ('community','organization')),
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  constraint community_posts_audience_org_check check (
    (audience = 'community' and author_org_id is null)
    or (audience = 'organization' and author_org_id is not null)
  ),
  constraint community_posts_announcement_org_check check (
    post_type <> 'announcement' or author_org_id is not null
  )
);
create index if not exists community_posts_feed_idx on public.community_posts (created_at desc) where deleted_at is null;
create index if not exists community_posts_org_feed_idx on public.community_posts (author_org_id, created_at desc) where deleted_at is null;

create table if not exists public.community_post_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  media_type text not null check (media_type in ('image','video')),
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 52428800),
  created_at timestamptz not null default now()
);
create index if not exists community_post_attachments_post_idx on public.community_post_attachments(post_id);

create table if not exists public.community_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','inappropriate','misinformation','other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(post_id, reporter_user_id)
);
create index if not exists community_post_reports_queue_idx on public.community_post_reports(status, created_at desc);

create table if not exists public.community_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts(id) on delete set null,
  report_id uuid references public.community_post_reports(id) on delete set null,
  moderator_user_id uuid not null references auth.users(id) on delete restrict,
  org_id uuid references public.org_units(id) on delete set null,
  action text not null check (action in ('hide_post','restore_post','pin_post','unpin_post','resolve_report','dismiss_report')),
  reason text check (reason is null or char_length(reason) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists community_moderation_actions_post_idx on public.community_moderation_actions(post_id, created_at desc);

create or replace function private.is_active_naas_member()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.org_memberships m
    where m.user_id = (select auth.uid()) and m.status = 'active'
  );
$$;

alter table public.community_posts enable row level security;
alter table public.community_post_attachments enable row level security;
alter table public.community_post_reports enable row level security;
alter table public.community_moderation_actions enable row level security;

drop policy if exists community_posts_read_member on public.community_posts;
create policy community_posts_read_member on public.community_posts for select to authenticated
using (
  private.is_active_naas_member() and deleted_at is null and (
    audience = 'community'
    or exists (select 1 from public.org_memberships m where m.user_id = (select auth.uid()) and m.org_id = community_posts.author_org_id and m.status = 'active')
    or private.can_administer_org(author_org_id)
  )
);
drop policy if exists community_posts_insert_member on public.community_posts;
create policy community_posts_insert_member on public.community_posts for insert to authenticated
with check (
  author_user_id = (select auth.uid()) and private.is_active_naas_member() and (
    (post_type = 'post' and audience = 'community' and author_org_id is null)
    or (post_type in ('post','announcement') and audience = 'organization' and author_org_id is not null and private.can_administer_org(author_org_id))
  )
);
drop policy if exists community_posts_update_author_or_admin on public.community_posts;
create policy community_posts_update_author_or_admin on public.community_posts for update to authenticated
using (private.is_active_naas_member() and (author_user_id = (select auth.uid()) or private.can_administer_org(author_org_id)))
with check (private.is_active_naas_member() and (author_user_id = (select auth.uid()) or private.can_administer_org(author_org_id)));
drop policy if exists community_posts_delete_author_or_admin on public.community_posts;
create policy community_posts_delete_author_or_admin on public.community_posts for delete to authenticated
using (private.is_active_naas_member() and (author_user_id = (select auth.uid()) or private.can_administer_org(author_org_id)));

drop policy if exists community_attachments_read_visible_post on public.community_post_attachments;
create policy community_attachments_read_visible_post on public.community_post_attachments for select to authenticated
using (exists (select 1 from public.community_posts p where p.id = post_id));
drop policy if exists community_attachments_insert_own on public.community_post_attachments;
create policy community_attachments_insert_own on public.community_post_attachments for insert to authenticated
with check (uploaded_by = (select auth.uid()) and exists (select 1 from public.community_posts p where p.id = post_id and p.author_user_id = (select auth.uid())));
drop policy if exists community_attachments_delete_own on public.community_post_attachments;
create policy community_attachments_delete_own on public.community_post_attachments for delete to authenticated
using (uploaded_by = (select auth.uid()));

drop policy if exists community_reports_insert_member on public.community_post_reports;
create policy community_reports_insert_member on public.community_post_reports for insert to authenticated
with check (reporter_user_id = (select auth.uid()) and private.is_active_naas_member() and exists (select 1 from public.community_posts p where p.id = post_id and p.author_user_id <> (select auth.uid())));
drop policy if exists community_reports_read_reporter_or_org_admin on public.community_post_reports;
create policy community_reports_read_reporter_or_org_admin on public.community_post_reports for select to authenticated
using (reporter_user_id = (select auth.uid()) or exists (select 1 from public.community_posts p where p.id = post_id and private.can_administer_org(p.author_org_id)));
drop policy if exists community_reports_update_org_admin on public.community_post_reports;
create policy community_reports_update_org_admin on public.community_post_reports for update to authenticated
using (exists (select 1 from public.community_posts p where p.id = post_id and private.can_administer_org(p.author_org_id)))
with check (exists (select 1 from public.community_posts p where p.id = post_id and private.can_administer_org(p.author_org_id)));

drop policy if exists community_moderation_read_scoped_admin on public.community_moderation_actions;
create policy community_moderation_read_scoped_admin on public.community_moderation_actions for select to authenticated
using (org_id is not null and private.can_administer_org(org_id));
drop policy if exists community_moderation_insert_scoped_admin on public.community_moderation_actions;
create policy community_moderation_insert_scoped_admin on public.community_moderation_actions for insert to authenticated
with check (moderator_user_id = (select auth.uid()) and org_id is not null and private.can_administer_org(org_id));

grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, delete on public.community_post_attachments to authenticated;
grant select, insert, update on public.community_post_reports to authenticated;
grant select, insert on public.community_moderation_actions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('naas-community-media', 'naas-community-media', false, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do nothing;

drop policy if exists naas_community_media_upload_own on storage.objects;
create policy naas_community_media_upload_own on storage.objects for insert to authenticated
with check (bucket_id = 'naas-community-media' and (storage.foldername(name))[1] = (select auth.uid())::text and private.is_active_naas_member());
drop policy if exists naas_community_media_read_member on storage.objects;
create policy naas_community_media_read_member on storage.objects for select to authenticated
using (
  bucket_id = 'naas-community-media'
  and exists (
    select 1 from public.community_post_attachments a
    join public.community_posts p on p.id = a.post_id
    where a.object_path = storage.objects.name
  )
);
drop policy if exists naas_community_media_delete_own on storage.objects;
create policy naas_community_media_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'naas-community-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
