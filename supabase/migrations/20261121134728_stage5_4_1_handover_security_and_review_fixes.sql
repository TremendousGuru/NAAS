-- Stage 5.4.1: expose requests to authorized president reviewers and prohibit self-approval.
drop policy if exists "Participants and approving leaders read handover requests" on public.leadership_handover_requests;
create policy "Participants and approving leaders read handover requests" on public.leadership_handover_requests for select to authenticated using (
 submitted_by=(select auth.uid()) or outgoing_user_id=(select auth.uid()) or incoming_user_id=(select auth.uid())
 or (approval_org_id is not null and (select private.can_administer_org(approval_org_id)))
 or (select private.can_administer_org(org_id))
 or (select private.can_approve_leadership_handover(org_id,approval_org_id,outgoing_user_id)));
-- Replace the review function to enforce submitter/reviewer separation and use the position row for the position key.
