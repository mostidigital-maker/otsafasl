
-- Auto-link appointments to patients by national_id (creates patient if needed)
CREATE OR REPLACE FUNCTION public.link_appointment_to_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid;
  v_nid text;
BEGIN
  IF NEW.patient_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  v_nid := NULLIF(TRIM(NEW.child_national_id), '');

  IF v_nid IS NOT NULL THEN
    SELECT id INTO v_patient_id
    FROM public.patients
    WHERE national_id = v_nid AND deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (full_name, national_id, phone, parent_name, email)
    VALUES (NEW.child_name, v_nid, NEW.phone, NEW.parent_name, NEW.email)
    RETURNING id INTO v_patient_id;
  END IF;

  NEW.patient_id := v_patient_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_appointment_to_patient ON public.appointments;
CREATE TRIGGER trg_link_appointment_to_patient
BEFORE INSERT ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.link_appointment_to_patient();

-- Backfill: link existing appointments and create patients for the ones missing
DO $$
DECLARE
  r record;
  v_patient_id uuid;
  v_nid text;
BEGIN
  FOR r IN SELECT * FROM public.appointments WHERE patient_id IS NULL LOOP
    v_nid := NULLIF(TRIM(r.child_national_id), '');
    v_patient_id := NULL;

    IF v_nid IS NOT NULL THEN
      SELECT id INTO v_patient_id FROM public.patients
      WHERE national_id = v_nid AND deleted_at IS NULL LIMIT 1;
    END IF;

    IF v_patient_id IS NULL THEN
      INSERT INTO public.patients (full_name, national_id, phone, parent_name, email)
      VALUES (r.child_name, v_nid, r.phone, r.parent_name, r.email)
      RETURNING id INTO v_patient_id;
    END IF;

    UPDATE public.appointments SET patient_id = v_patient_id WHERE id = r.id;
  END LOOP;
END $$;

-- RLS on storage.objects for patient-files bucket (admins only)
DROP POLICY IF EXISTS "Admins manage patient files" ON storage.objects;
CREATE POLICY "Admins manage patient files"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'patient-files' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'patient-files' AND public.has_role(auth.uid(), 'admin'));
