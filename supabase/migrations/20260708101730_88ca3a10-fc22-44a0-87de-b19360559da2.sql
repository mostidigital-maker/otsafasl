
-- ============= ENUMS =============
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'therapist';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'secretary';

DO $$ BEGIN
  CREATE TYPE public.appointment_status_ext AS ENUM ('scheduled','confirmed','arrived','completed','cancelled','no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.gender AS ENUM ('male','female','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_type AS ENUM ('private','insurance','mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.insurance_provider AS ENUM ('clalit_mushlam','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.insurance_status AS ENUM ('not_sent','waiting','approved','paid','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.priority_level AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reminder_status AS ENUM ('pending','scheduled','completed','dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.patient_file_category AS ENUM ('medical_report','assessment','insurance','referral','signed_form','treatment_plan','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============= THERAPISTS =============
CREATE TABLE IF NOT EXISTS public.therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.therapists TO authenticated;
GRANT ALL ON public.therapists TO service_role;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_therapists" ON public.therapists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_therapists_updated BEFORE UPDATE ON public.therapists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= PATIENTS =============
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  national_id TEXT UNIQUE,
  date_of_birth DATE,
  gender public.gender,
  parent_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON public.patients(national_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(full_name) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patients TO authenticated;
GRANT ALL ON public.patients TO service_role;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_patients" ON public.patients FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_patients_updated BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= APPOINTMENTS extension =============
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS arrived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- extend status enum
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'arrived';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'no_show';

CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_slot ON public.appointments(slot_at) WHERE deleted_at IS NULL;

-- ============= TREATMENTS =============
CREATE TABLE IF NOT EXISTS public.treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  therapist_id UUID REFERENCES public.therapists(id) ON DELETE SET NULL,
  treatment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  assessment TEXT,
  goals TEXT,
  activities TEXT,
  patient_response TEXT,
  progress TEXT,
  recommendations TEXT,
  home_exercises TEXT,
  next_plan TEXT,
  additional_notes TEXT,
  requires_follow_up BOOLEAN NOT NULL DEFAULT false,
  follow_up_date DATE,
  follow_up_priority public.priority_level,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_treatments_patient ON public.treatments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treatments_date ON public.treatments(treatment_date) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_treatments" ON public.treatments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_treatments_updated BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= PAYMENTS =============
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_type public.payment_type NOT NULL DEFAULT 'private',
  insurance_provider public.insurance_provider,
  treatment_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  patient_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  insurance_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  needs_insurance_submission BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_patient ON public.payments(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_payments" ON public.payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= INSURANCE CLAIMS =============
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  provider public.insurance_provider NOT NULL DEFAULT 'clalit_mushlam',
  status public.insurance_status NOT NULL DEFAULT 'not_sent',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  submitted_at DATE,
  approved_at DATE,
  paid_at DATE,
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_claims_status ON public.insurance_claims(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_claims_patient ON public.insurance_claims(patient_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_claims TO authenticated;
GRANT ALL ON public.insurance_claims TO service_role;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_claims" ON public.insurance_claims FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_claims_updated BEFORE UPDATE ON public.insurance_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= FOLLOW UP REMINDERS =============
CREATE TABLE IF NOT EXISTS public.follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  suggested_date DATE NOT NULL,
  priority public.priority_level NOT NULL DEFAULT 'medium',
  status public.reminder_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON public.follow_up_reminders(status, suggested_date) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_up_reminders TO authenticated;
GRANT ALL ON public.follow_up_reminders TO service_role;
ALTER TABLE public.follow_up_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_reminders" ON public.follow_up_reminders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_reminders_updated BEFORE UPDATE ON public.follow_up_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= PATIENT FILES =============
CREATE TABLE IF NOT EXISTS public.patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  category public.patient_file_category NOT NULL DEFAULT 'other',
  description TEXT,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_files_patient ON public.patient_files(patient_id) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_files TO authenticated;
GRANT ALL ON public.patient_files TO service_role;
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_files" ON public.patient_files FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= INTERNAL NOTES =============
CREATE TABLE IF NOT EXISTS public.internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notes_patient ON public.internal_notes(patient_id, created_at DESC) WHERE deleted_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.internal_notes TO authenticated;
GRANT ALL ON public.internal_notes TO service_role;
ALTER TABLE public.internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_notes" ON public.internal_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============= AUDIT LOG =============
CREATE TABLE IF NOT EXISTS public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table ON public.audit_log(table_name, record_id);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.audit_log_id_seq TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_audit" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "system_insert_audit" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.log_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old JSONB;
  v_new JSONB;
  v_id TEXT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD); v_new := NULL; v_id := OLD.id::text;
  ELSIF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD); v_new := to_jsonb(NEW); v_id := NEW.id::text;
  ELSE
    v_old := NULL; v_new := to_jsonb(NEW); v_id := NEW.id::text;
  END IF;
  INSERT INTO public.audit_log(user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, v_id, v_old, v_new);
  RETURN COALESCE(NEW, OLD);
END; $$;

CREATE TRIGGER audit_patients AFTER INSERT OR UPDATE OR DELETE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_treatments AFTER INSERT OR UPDATE OR DELETE ON public.treatments FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_claims AFTER INSERT OR UPDATE OR DELETE ON public.insurance_claims FOR EACH ROW EXECUTE FUNCTION public.log_audit();
CREATE TRIGGER audit_appointments AFTER UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.log_audit();
