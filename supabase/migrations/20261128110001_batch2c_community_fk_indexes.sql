-- Cover Batch 2C foreign keys flagged by Supabase performance advisor.
create index if not exists community_posts_author_org_idx on public.community_posts(author_org_id) where author_org_id is not null;
create index if not exists community_post_reports_reporter_idx on public.community_post_reports(reporter_user_id);
create index if not exists community_post_reports_reviewer_idx on public.community_post_reports(reviewer_user_id) where reviewer_user_id is not null;
