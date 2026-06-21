
-- 1. Recreate view with security_invoker (run as caller)
DROP VIEW IF EXISTS public.taken_slots;
CREATE VIEW public.taken_slots WITH (security_invoker = on) AS
  SELECT location_id, slot_at, duration_minutes FROM public.appointments WHERE status <> 'cancelled';
GRANT SELECT ON public.taken_slots TO anon, authenticated;

-- 2. Tighten public insert policy: require future slot and minimal field constraints
DROP POLICY "anyone can book" ON public.appointments;
CREATE POLICY "anyone can book" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    slot_at > now()
    AND status = 'pending'
    AND created_by_admin = false
    AND length(child_name) BETWEEN 1 AND 100
    AND length(parent_name) BETWEEN 1 AND 100
    AND length(phone) BETWEEN 5 AND 30
    AND length(email) BETWEEN 5 AND 255
  );

-- 3. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
-- keep authenticated EXECUTE so RLS policies that call has_role work
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
