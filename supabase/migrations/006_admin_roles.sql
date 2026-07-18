-- 006_admin_roles.sql - lock down role promotion.
-- promote_to_admin() is SECURITY DEFINER and was created without revoking the
-- default PUBLIC execute grant, which let any client promote any email via
-- PostgREST RPC. Admin-role changes now go through the admin panel's
-- service-role actions only.

REVOKE EXECUTE ON FUNCTION promote_to_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION promote_to_admin(text) TO service_role;
