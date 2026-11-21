
create index if not exists profiles_display_name_prefix_idx
  on public.profiles (lower(display_name) text_pattern_ops);
create index if not exists profiles_institution_prefix_idx
  on public.profiles (lower(institution_name) text_pattern_ops);
create index if not exists profiles_course_prefix_idx
  on public.profiles (lower(course_of_study) text_pattern_ops);
create index if not exists org_memberships_org_status_idx
  on public.org_memberships (org_id, status);

create or replace function private.get_scoped_membership_directory(
  p_org_id uuid,
  p_search text default null,
  p_membership_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_search text := nullif(btrim(p_search),'');
  v_items jsonb;
  v_total bigint;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_org_id is null then
    raise exception 'An organization scope is required' using errcode = '22023';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Page size must be between 1 and 100' using errcode = '22023';
  end if;
  if p_offset is null or p_offset < 0 or p_offset > 100000 then
    raise exception 'Offset must be between 0 and 100000' using errcode = '22023';
  end if;
  if v_search is not null and char_length(v_search) > 100 then
    raise exception 'Search text cannot exceed 100 characters' using errcode = '22023';
  end if;
  if p_membership_status is not null
     and p_membership_status not in ('pending','active','suspended','ended') then
    raise exception 'Unsupported membership status filter' using errcode = '22023';
  end if;

  if not private.can_administer_org(p_org_id) then
    raise exception 'You are not authorized to view this organization directory' using errcode = '42501';
  end if;

  with recursive scoped_orgs(id,path) as (
    select o.id, array[o.id]::uuid[]
    from public.org_units o
    where o.id = p_org_id
    union all
    select child.id, parent.path || child.id
    from public.org_units child
    join scoped_orgs parent on child.parent_id = parent.id
    where not child.id = any(parent.path)
  ),
  filtered as (
    select
      m.id as membership_id,
      m.user_id,
      coalesce(nullif(btrim(p.display_name),''),'Member') as display_name,
      p.institution_name,
      p.course_of_study,
      p.level_of_study,
      m.role,
      m.status,
      m.joined_at,
      o.id as org_id,
      o.name as org_name,
      o.org_type
    from scoped_orgs s
    join public.org_units o on o.id = s.id
    join public.org_memberships m on m.org_id = o.id
    left join public.profiles p on p.id = m.user_id
    where (p_membership_status is null or m.status = p_membership_status)
      and (
        v_search is null
        or lower(coalesce(p.display_name,'')) like lower(v_search) || '%'
        or lower(coalesce(p.institution_name,'')) like lower(v_search) || '%'
        or lower(coalesce(p.course_of_study,'')) like lower(v_search) || '%'
      )
  )
  select count(*) into v_total from filtered;

  with recursive scoped_orgs(id,path) as (
    select o.id, array[o.id]::uuid[]
    from public.org_units o
    where o.id = p_org_id
    union all
    select child.id, parent.path || child.id
    from public.org_units child
    join scoped_orgs parent on child.parent_id = parent.id
    where not child.id = any(parent.path)
  ),
  filtered as (
    select
      m.id as membership_id,
      coalesce(nullif(btrim(p.display_name),''),'Member') as display_name,
      p.institution_name,
      p.course_of_study,
      p.level_of_study,
      m.role,
      m.status,
      m.joined_at,
      o.id as org_id,
      o.name as org_name,
      o.org_type
    from scoped_orgs s
    join public.org_units o on o.id = s.id
    join public.org_memberships m on m.org_id = o.id
    left join public.profiles p on p.id = m.user_id
    where (p_membership_status is null or m.status = p_membership_status)
      and (
        v_search is null
        or lower(coalesce(p.display_name,'')) like lower(v_search) || '%'
        or lower(coalesce(p.institution_name,'')) like lower(v_search) || '%'
        or lower(coalesce(p.course_of_study,'')) like lower(v_search) || '%'
      )
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'membership_id',membership_id,
        'display_name',display_name,
        'institution_name',institution_name,
        'course_of_study',course_of_study,
        'level_of_study',level_of_study,
        'role',role,
        'status',status,
        'joined_at',joined_at,
        'organization',jsonb_build_object('id',org_id,'name',org_name,'type',org_type)
      ) order by lower(display_name), org_name, membership_id
    ), '[]'::jsonb
  )
  into v_items
  from (
    select * from filtered
    order by lower(display_name), org_name, membership_id
    limit p_limit offset p_offset
  ) page;

  return jsonb_build_object(
    'organization_id',p_org_id,
    'total_count',v_total,
    'limit',p_limit,
    'offset',p_offset,
    'items',v_items
  );
end;
$function$;

create or replace function public.get_scoped_membership_directory(
  p_org_id uuid,
  p_search text default null,
  p_membership_status text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.get_scoped_membership_directory(
    p_org_id,p_search,p_membership_status,p_limit,p_offset
  );
$function$;

revoke all on function private.get_scoped_membership_directory(uuid,text,text,integer,integer) from public, anon;
grant execute on function private.get_scoped_membership_directory(uuid,text,text,integer,integer) to authenticated;
revoke all on function public.get_scoped_membership_directory(uuid,text,text,integer,integer) from public, anon;
grant execute on function public.get_scoped_membership_directory(uuid,text,text,integer,integer) to authenticated;

create or replace function private.get_scoped_membership_statistics(p_org_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := auth.uid();
  v_total bigint;
  v_status_counts jsonb;
  v_org_breakdown jsonb;
begin
  if v_actor is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  if p_org_id is null then
    raise exception 'An organization scope is required' using errcode = '22023';
  end if;
  if not private.can_administer_org(p_org_id) then
    raise exception 'You are not authorized to view membership statistics for this organization' using errcode = '42501';
  end if;

  with recursive scoped_orgs(id,path) as (
    select o.id, array[o.id]::uuid[]
    from public.org_units o where o.id=p_org_id
    union all
    select child.id,parent.path || child.id
    from public.org_units child
    join scoped_orgs parent on child.parent_id=parent.id
    where not child.id=any(parent.path)
  )
  select count(*) into v_total
  from public.org_memberships m
  join scoped_orgs s on s.id=m.org_id;

  with recursive scoped_orgs(id,path) as (
    select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
    union all
    select child.id,parent.path || child.id
    from public.org_units child
    join scoped_orgs parent on child.parent_id=parent.id
    where not child.id=any(parent.path)
  ),
  counts as (
    select m.status,count(*)::bigint as total
    from public.org_memberships m
    join scoped_orgs s on s.id=m.org_id
    group by m.status
  )
  select jsonb_build_object(
    'pending',coalesce((select total from counts where status='pending'),0),
    'active',coalesce((select total from counts where status='active'),0),
    'suspended',coalesce((select total from counts where status='suspended'),0),
    'ended',coalesce((select total from counts where status='ended'),0)
  ) into v_status_counts;

  with recursive scoped_orgs(id,path) as (
    select o.id,array[o.id]::uuid[] from public.org_units o where o.id=p_org_id
    union all
    select child.id,parent.path || child.id
    from public.org_units child
    join scoped_orgs parent on child.parent_id=parent.id
    where not child.id=any(parent.path)
  ),
  org_counts as (
    select
      o.id,o.name,o.org_type,
      count(m.id)::bigint as total,
      count(m.id) filter (where m.status='pending')::bigint as pending,
      count(m.id) filter (where m.status='active')::bigint as active,
      count(m.id) filter (where m.status='suspended')::bigint as suspended,
      count(m.id) filter (where m.status='ended')::bigint as ended
    from scoped_orgs s
    join public.org_units o on o.id=s.id
    left join public.org_memberships m on m.org_id=o.id
    group by o.id,o.name,o.org_type
  )
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'organization_id',id,'organization_name',name,'organization_type',org_type,
      'total',total,'pending',pending,'active',active,'suspended',suspended,'ended',ended
    ) order by org_type,name), '[]'::jsonb
  ) into v_org_breakdown
  from org_counts;

  return jsonb_build_object(
    'organization_id',p_org_id,
    'total_memberships',v_total,
    'by_status',v_status_counts,
    'organizations',v_org_breakdown
  );
end;
$function$;

create or replace function public.get_scoped_membership_statistics(p_org_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.get_scoped_membership_statistics(p_org_id);
$function$;

revoke all on function private.get_scoped_membership_statistics(uuid) from public, anon;
grant execute on function private.get_scoped_membership_statistics(uuid) to authenticated;
revoke all on function public.get_scoped_membership_statistics(uuid) from public, anon;
grant execute on function public.get_scoped_membership_statistics(uuid) to authenticated;
