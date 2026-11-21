-- NAASCONNECT Stage 5.2.2: ordinary members may request membership only in active campus or local-church organizations.
drop policy "Scoped administrators or users request membership" on public.org_memberships;
create policy "Scoped administrators or users request membership"
on public.org_memberships for insert to authenticated
with check (
  (
    status = 'pending'
    and (select private.can_administer_org(org_memberships.org_id))
  )
  or
  (
    user_id = (select auth.uid())
    and status = 'pending'
    and approved_by is null
    and approved_at is null
    and joined_at is null
    and role = case
      when exists (
        select 1 from public.org_units o
        where o.id = org_id and o.org_type = 'church'
      ) then 'church_member'
      else 'member'
    end
    and exists (
      select 1 from public.org_units o
      where o.id = org_id
        and o.status = 'active'
        and o.org_type in ('campus','church')
    )
  )
);
