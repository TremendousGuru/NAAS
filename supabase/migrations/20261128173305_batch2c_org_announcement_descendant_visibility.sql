drop policy if exists community_posts_read on public.community_posts;
create policy community_posts_read on public.community_posts for select to authenticated using (
 status='published'
 and exists(select 1 from public.org_memberships own_m where own_m.user_id=(select auth.uid()) and own_m.status='active')
 and (
  audience_org_id is null
  or exists(select 1 from public.org_memberships scoped_m where scoped_m.user_id=(select auth.uid()) and scoped_m.status='active'
    and private.is_org_descendant_or_self(community_posts.audience_org_id,scoped_m.org_id))
  or private.can_administer_org(audience_org_id)
 )
);
drop policy if exists community_media_read on storage.objects;
create policy community_media_read on storage.objects for select to authenticated using (
 bucket_id='community-media' and (
  (storage.foldername(name))[1]=(select auth.uid())::text
  or exists(select 1 from public.community_posts p where p.media_path=objects.name and p.status='published'
   and exists(select 1 from public.org_memberships own_m where own_m.user_id=(select auth.uid()) and own_m.status='active')
   and (p.audience_org_id is null
    or exists(select 1 from public.org_memberships scoped_m where scoped_m.user_id=(select auth.uid()) and scoped_m.status='active'
      and private.is_org_descendant_or_self(p.audience_org_id,scoped_m.org_id))
    or private.can_administer_org(p.audience_org_id))
  )
 )
);
