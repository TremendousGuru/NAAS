-- Stage 5.4.3: index foreign keys for leadership and appointment workflows.
create index if not exists admin_appointment_invited_user_idx on public.admin_appointment_requests(invited_user_id);
create index if not exists admin_appointment_reviewed_by_idx on public.admin_appointment_requests(reviewed_by);
create index if not exists leadership_handover_incoming_user_idx on public.leadership_handover_requests(incoming_user_id);
create index if not exists leadership_handover_outgoing_user_idx on public.leadership_handover_requests(outgoing_user_id);
create index if not exists leadership_handover_reviewed_by_idx on public.leadership_handover_requests(reviewed_by);
create index if not exists leadership_handover_submitted_by_idx on public.leadership_handover_requests(submitted_by);
create index if not exists leadership_history_approved_by_idx on public.leadership_history(approved_by);
create index if not exists leadership_history_incoming_user_idx on public.leadership_history(incoming_user_id);
create index if not exists leadership_history_position_id_idx on public.leadership_history(position_id);
create index if not exists leadership_notifications_handover_request_idx on public.leadership_notification_events(handover_request_id);
create index if not exists leadership_notifications_org_id_idx on public.leadership_notification_events(org_id);