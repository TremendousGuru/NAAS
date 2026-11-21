-- Stage 5.4.4: keep private SECURITY DEFINER implementations inaccessible to PUBLIC and anon.
revoke all on function private.can_approve_leadership_handover(uuid,uuid,uuid) from public,anon,authenticated;
revoke all on function private.submit_leadership_handover(uuid,text,text,uuid,text) from public,anon,authenticated;
revoke all on function private.review_leadership_handover(uuid,text,text) from public,anon,authenticated;
grant execute on function private.can_approve_leadership_handover(uuid,uuid,uuid) to authenticated;
grant execute on function private.submit_leadership_handover(uuid,text,text,uuid,text) to authenticated;
grant execute on function private.review_leadership_handover(uuid,text,text) to authenticated;