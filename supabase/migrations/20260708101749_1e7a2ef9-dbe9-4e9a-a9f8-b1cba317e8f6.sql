
DROP POLICY IF EXISTS "system_insert_audit" ON public.audit_log;
CREATE POLICY "auth_insert_audit" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

REVOKE EXECUTE ON FUNCTION public.log_audit() FROM PUBLIC, anon, authenticated;
