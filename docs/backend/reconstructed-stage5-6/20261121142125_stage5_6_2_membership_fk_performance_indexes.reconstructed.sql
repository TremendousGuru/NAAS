-- RECONSTRUCTED EVIDENCE ARTIFACT — NOT AN ORIGINAL APPLIED MIGRATION.
-- Reconstructed from repository documentation, later migration source, and live catalogue evidence.
-- Stored outside supabase/migrations/. DO NOT APPLY OR REPLAY.
-- Original applied SQL body/checksum was not recovered. NAASCONNECT V1.0 remains authoritative.

-- Reconstructed Stage 5.6.2 foreign-key performance indexes.
-- The six index definitions below are corroborated by the live pg_indexes catalogue.

create index membership_transfer_source_membership_idx
  on public.membership_transfer_requests (source_membership_id);
create index membership_transfer_source_reviewer_idx
  on public.membership_transfer_requests (source_reviewed_by);
create index membership_transfer_destination_reviewer_idx
  on public.membership_transfer_requests (destination_reviewed_by);
create index membership_transfer_result_membership_idx
  on public.membership_transfer_requests (resulting_membership_id);
create index membership_events_actor_user_idx
  on public.membership_events (actor_user_id);
create index membership_events_related_transfer_idx
  on public.membership_events (related_transfer_id);
