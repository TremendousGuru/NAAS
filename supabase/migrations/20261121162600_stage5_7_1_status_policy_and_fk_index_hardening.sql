-- Stage 5.7.1: consolidate status policies and index foreign keys.

drop policy if exists "Active members create personal statuses" on public.community_statuses;
drop policy if exists "Authorized organization admins create organization statuses" on public.community_statuses;
drop policy if exists "Authors delete their personal statuses" on public.community_statuses;
drop policy if exists "Scoped admins delete organization statuses" on public.community_statuses;

create policy "Members and scoped admins create statuses"
on public.community_statuses for insert to authenticated
with check (
  author_user_id = (select auth.uid())
  and (
    (author_org_id is null and exists (
      select 1 from public.org_memberships m
      where m.user_id = (select auth.uid()) and m.status = 'active'
    ))
    or
    (author_org_id is not null and (select private.can_administer_org(author_org_id)))
  )
);

create policy "Authors or scoped admins delete statuses"
on public.community_statuses for delete to authenticated
using (
  (author_org_id is null and author_user_id = (select auth.uid()))
  or
  (author_org_id is not null and (select private.can_administer_org(author_org_id)))
);

create index community_statuses_author_user_idx on public.community_statuses (author_user_id);
create index community_statuses_author_org_idx on public.community_statuses (author_org_id);
