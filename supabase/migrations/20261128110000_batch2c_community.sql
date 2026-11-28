-- Batch 2C: persistent community posts, official announcements and moderation.
-- Additive only. Does not alter community_statuses or historical migrations.
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references auth.users(id) on delete cascade,
  author_org_id uuid null references public.org_units(id) on delete restrict,
  audience_org_id uuid null references public.org_units(id) on delete restrict,
  post_type text not null default 'member_post' check (post_type in ('member_post','announcement')),
  title text null check (title is null or char_length(btrim(title)) between 3 and 160),
  content text not null check (char_length(btrim(content)) between 1 and 5000),
  media_path text null check (media_path is null or char_length(media_path) <= 500),
  status text not null default 'published' check (status in ('published','hidden','removed')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_announcement_org_check check (
    (post_type = 'member_post' and author_org_id is null and audience_org_id is null and title is null)
    or
    (post_type = 'announcement' and author_org_id is not null and audience_org_id = author_org_id and title is not null)
  ),
  constraint community_posts_media_owner_path check (
    media_path is null or split_part(media_path,'/',1) = author_user_id::text
  )
);
create index if not exists community_posts_feed_idx on public.community_posts(status,published_at desc,id desc);
create index if not exists community_posts_author_idx on public.community_posts(author_user_id,created_at desc);
create index if not exists community_posts_audience_idx on public.community_posts(audience_org_id,published_at desc) where audience_org_id is not null;

create table if not exists public.community_post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam','harassment','hate_or_abuse','misinformation','inappropriate','other')),
  details text null check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewer_user_id uuid null references auth.users(id) on delete set null,
  review_note text null check (review_note is null or char_length(review_note) between 10 and 1000),
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  unique(post_id,reporter_user_id)
);
create index if not exists community_post_reports_queue_idx on public.community_post_reports(status,created_at desc);

create or replace function private.touch_community_post_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists community_posts_touch_updated_at on public.community_posts;
create trigger community_posts_touch_updated_at before update on public.community_posts
for each row execute function private.touch_community_post_updated_at();

alter table public.community_posts enable row level security;
alter table public.community_post_reports enable row level security;
revoke all on public.community_posts, public.community_post_reports from anon;
grant select, insert, update, delete on public.community_posts to authenticated;
grant select, insert, update on public.community_post_reports to authenticated;

drop policy if exists community_posts_read on public.community_posts;
create policy community_posts_read on public.community_posts for select to authenticated using (
  status = 'published'
  and exists (select 1 from public.org_memberships m where m.user_id = (select auth.uid()) and m.status = 'active')
  and (
    audience_org_id is null
    or exists (select 1 from public.org_memberships m where m.user_id = (select auth.uid()) and m.org_id = audience_org_id and m.status = 'active')
    or private.can_administer_org(audience_org_id)
  )
);
drop policy if exists community_posts_insert on public.community_posts;
create policy community_posts_insert on public.community_posts for insert to authenticated with check (
  author_user_id = (select auth.uid())
  and status = 'published'
  and (
    (post_type = 'member_post' and author_org_id is null and audience_org_id is null
      and exists (select 1 from public.org_memberships m where m.user_id = (select auth.uid()) and m.status = 'active'))
    or
    (post_type = 'announcement' and author_org_id is not null and audience_org_id = author_org_id
      and exists (select 1 from public.org_units o where o.id = author_org_id and o.status = 'active')
      and private.can_administer_org(author_org_id))
  )
);
drop policy if exists community_posts_update on public.community_posts;
create policy community_posts_update on public.community_posts for update to authenticated using (
  (author_user_id = (select auth.uid()) and post_type = 'member_post')
  or (author_org_id is not null and private.can_administer_org(author_org_id))
) with check (
  (author_user_id = (select auth.uid()) and post_type = 'member_post' and author_org_id is null and audience_org_id is null)
  or (author_org_id is not null and private.can_administer_org(author_org_id) and audience_org_id = author_org_id)
);
drop policy if exists community_posts_delete on public.community_posts;
create policy community_posts_delete on public.community_posts for delete to authenticated using (
  (author_user_id = (select auth.uid()) and post_type = 'member_post')
  or (author_org_id is not null and private.can_administer_org(author_org_id))
);

drop policy if exists community_reports_insert on public.community_post_reports;
create policy community_reports_insert on public.community_post_reports for insert to authenticated with check (
  reporter_user_id = (select auth.uid())
  and exists (select 1 from public.community_posts p where p.id = post_id and p.status = 'published')
);
drop policy if exists community_reports_read on public.community_post_reports;
create policy community_reports_read on public.community_post_reports for select to authenticated using (
  reporter_user_id = (select auth.uid())
  or exists (select 1 from public.community_posts p where p.id = post_id and p.author_org_id is not null and private.can_administer_org(p.author_org_id))
);
drop policy if exists community_reports_review on public.community_post_reports;
create policy community_reports_review on public.community_post_reports for update to authenticated using (
  exists (select 1 from public.community_posts p where p.id = post_id and p.author_org_id is not null and private.can_administer_org(p.author_org_id))
) with check (
  exists (select 1 from public.community_posts p where p.id = post_id and p.author_org_id is not null and private.can_administer_org(p.author_org_id))
  and reviewer_user_id = (select auth.uid())
  and reviewed_at is not null
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('community-media','community-media',false,10485760,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict (id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists community_media_owner_upload on storage.objects;
create policy community_media_owner_upload on storage.objects for insert to authenticated with check (
  bucket_id='community-media' and (storage.foldername(name))[1]=(select auth.uid())::text
);
drop policy if exists community_media_read on storage.objects;
create policy community_media_read on storage.objects for select to authenticated using (
  bucket_id='community-media'
  and (
    (storage.foldername(name))[1]=(select auth.uid())::text
    or exists (
      select 1 from public.community_posts p
      where p.media_path = name and p.status='published'
      and exists (select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.status='active')
      and (p.audience_org_id is null or exists (
        select 1 from public.org_memberships m where m.user_id=(select auth.uid()) and m.org_id=p.audience_org_id and m.status='active'
      ) or private.can_administer_org(p.audience_org_id))
    )
  )
);
drop policy if exists community_media_owner_delete on storage.objects;
create policy community_media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id='community-media' and (storage.foldername(name))[1]=(select auth.uid())::text
);
