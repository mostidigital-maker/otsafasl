DROP POLICY IF EXISTS "anyone can book" ON public.appointments;
CREATE POLICY "anyone can book" ON public.appointments
FOR INSERT TO anon, authenticated
WITH CHECK (
  slot_at > now()
  AND status = 'pending'::appointment_status
  AND created_by_admin = false
  AND length(child_name) BETWEEN 1 AND 100
  AND length(parent_name) BETWEEN 1 AND 100
  AND length(phone) BETWEEN 5 AND 30
  AND (email IS NULL OR length(email) BETWEEN 5 AND 255)
);