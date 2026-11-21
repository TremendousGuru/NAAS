-- Stage 5.7.2: explicitly restrict authenticated table privileges.
-- RLS policies remain the row-level boundary; table grants remove UPDATE/TRUNCATE/etc.
revoke all on public.community_statuses from authenticated;
grant select, insert, delete on public.community_statuses to authenticated;
