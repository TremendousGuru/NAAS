REVOKE EXECUTE ON FUNCTION private.submit_admin_appointment(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION private.review_admin_appointment(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.submit_admin_appointment(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.review_admin_appointment(uuid, text, text) TO authenticated;
