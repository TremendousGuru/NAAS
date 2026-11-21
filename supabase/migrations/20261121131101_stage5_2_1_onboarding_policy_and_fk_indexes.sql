-- NAASCONNECT Stage 5.2.1: consolidate membership INSERT authorization and index application foreign keys.
drop policy "Scoped administrators add memberships" on public.org_memberships;
drop policy "Users request basic organization membership" on public.org_memberships;
create policy "Scoped administrators or users request membership" on public.org_memberships for insert to authenticated
with check (
 (status='pending' and (select private.can_administer_org(org_memberships.org_id)))
 or (user_id=(select auth.uid()) and status='pending' and approved_by is null and approved_at is null and joined_at is null
 and role=case when exists(select 1 from public.org_units o where o.id=org_id and o.org_type='church') then 'church_member' else 'member' end
 and exists(select 1 from public.org_units o where o.id=org_id and o.status='active'))
);
create index org_applications_reviewed_by_idx on public.org_applications(reviewed_by);
create index org_applications_created_org_id_idx on public.org_applications(created_org_id);
