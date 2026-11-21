
create table if not exists public.admin_appointment_requests (
  id uuid primary key default gen_random_uuid(),
  seat_id uuid not null references public.org_admin_seats(id) on delete restrict,
  nominee_name text not null check (char_length(btrim(nominee_name)) between 2 and 120),
  nominee_email text not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','approved','rejected','invited','accepted','cancelled')),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  reviewer_notes text,
  invited_user_id uuid references auth.users(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_appointment_email_lowercase check (nominee_email = lower(nominee_email))
);
create unique index if not exists admin_appointment_one_open_per_seat
  on public.admin_appointment_requests(seat_id)
  where status in ('pending','approved','invited');
create index if not exists admin_appointment_requested_by_idx
  on public.admin_appointment_requests(requested_by);
create index if not exists admin_appointment_status_created_idx
  on public.admin_appointment_requests(status, created_at desc);
alter table public.admin_appointment_requests enable row level security;
revoke all on public.admin_appointment_requests from anon;
grant select on public.admin_appointment_requests to authenticated;
drop policy if exists "Nominees and jurisdiction admins read appointment requests" on public.admin_appointment_requests;
create policy "Nominees and jurisdiction admins read appointment requests"
on public.admin_appointment_requests for select to authenticated
using (
  requested_by = (select auth.uid())
  or exists (
    select 1 from public.org_admin_seats s
    where s.id = admin_appointment_requests.seat_id
      and private.can_administer_org(s.approval_org_id)
  )
);

create or replace function public.submit_admin_appointment(
  p_seat_id uuid,
  p_nominee_name text,
  p_nominee_email text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_seat public.org_admin_seats%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if char_length(btrim(coalesce(p_nominee_name,''))) not between 2 and 120 then
    raise exception 'A valid nominee name is required';
  end if;
  if lower(btrim(coalesce(p_nominee_email,''))) !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid nominee email is required';
  end if;
  select * into v_seat from public.org_admin_seats where id=p_seat_id for update;
  if not found or v_seat.status not in ('reserved','retired') then
    raise exception 'This administrator seat is not available for appointment';
  end if;
  if not private.can_administer_org(v_seat.approval_org_id) then
    raise exception 'You are not authorized to submit an appointment for this seat';
  end if;
  insert into public.admin_appointment_requests(seat_id,nominee_name,nominee_email,requested_by)
  values (p_seat_id,btrim(p_nominee_name),lower(btrim(p_nominee_email)),auth.uid())
  returning id into v_id;
  update public.org_admin_seats set status='pending_approval', updated_at=now() where id=p_seat_id;
  return v_id;
end;
$$;
revoke all on function public.submit_admin_appointment(uuid,text,text) from public, anon;
grant execute on function public.submit_admin_appointment(uuid,text,text) to authenticated;

create or replace function public.review_admin_appointment(
  p_request_id uuid,
  p_decision text,
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.admin_appointment_requests%rowtype;
  v_seat public.org_admin_seats%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
  select * into v_req from public.admin_appointment_requests where id=p_request_id for update;
  if not found or v_req.status <> 'pending' then raise exception 'Appointment request is not pending'; end if;
  select * into v_seat from public.org_admin_seats where id=v_req.seat_id for update;
  if not private.can_administer_org(v_seat.approval_org_id) then
    raise exception 'You are not authorized to review this appointment';
  end if;
  update public.admin_appointment_requests
    set status=p_decision, reviewed_by=auth.uid(), reviewed_at=now(),
        reviewer_notes=nullif(btrim(p_notes),''), updated_at=now()
    where id=p_request_id;
  if p_decision='approved' then
    update public.org_admin_seats set status='awaiting_appointee', updated_at=now() where id=v_seat.id;
  else
    update public.org_admin_seats set status='reserved', updated_at=now() where id=v_seat.id;
  end if;
  return jsonb_build_object('request_id',p_request_id,'status',p_decision,'seat_id',v_seat.id);
end;
$$;
revoke all on function public.review_admin_appointment(uuid,text,text) from public, anon;
grant execute on function public.review_admin_appointment(uuid,text,text) to authenticated;

create trigger set_admin_appointment_updated_at
before update on public.admin_appointment_requests
for each row execute function private.touch_updated_at();
