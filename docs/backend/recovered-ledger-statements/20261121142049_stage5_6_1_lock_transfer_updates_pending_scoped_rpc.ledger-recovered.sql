
drop policy if exists "Scoped administrators review transfers" on public.membership_transfer_requests;
revoke update on public.membership_transfer_requests from authenticated;
