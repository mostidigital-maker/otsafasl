-- ============================================================
-- 1) SECRETARY ACCESS: appointments only (view, create, edit, approve)
--    No access to patients / treatments / payments / insurance /
--    patient_files / internal_notes — those remain admin-only.
--    Hard deletion of appointments also stays admin-only;
--    secretaries cancel via status update instead.
-- ============================================================

CREATE POLICY "secretary_read_appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "secretary_update_appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'secretary') OR public.has_role(auth.uid(), 'admin'));

-- Note: "anyone can book" (INSERT) already applies to anon + authenticated,
-- so secretaries can already create manual appointments through the same path.
-- Existing "admin read all appointments" / "admin update appointments" /
-- "admin delete appointments" policies are untouched — Postgres RLS OR-combines
-- multiple permissive policies for the same command, so admins keep full access.

-- ============================================================
-- 2) EMAIL TEMPLATES — editable by the clinic admin from Settings.
--    template_key: 'appointment_new' | 'appointment_confirmed' | 'appointment_reminder'
--    One row per (template_key, language). {{placeholders}} are filled at send time.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  language public.app_language NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_key, language)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_email_templates" ON public.email_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_email_templates_updated BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Track reminder sends so the daily job never emails the same appointment twice.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

-- Seed default wording per language x kind. Admin can edit freely afterwards
-- from Settings -> Email templates; nothing here is hardcoded in the functions.
INSERT INTO public.email_templates (template_key, language, subject, body_html, is_enabled) VALUES
('appointment_new', 'ar', 'تم استلام طلب حجز موعدك',
  '<p>مرحباً {{parent_name}},</p><p>تم استلام طلب حجز موعد لـ {{child_name}} بتاريخ {{date}} الساعة {{time}} في {{location}}. سنتواصل معكم قريباً للتأكيد.</p>', true),
('appointment_new', 'he', 'בקשתך לתור התקבלה',
  '<p>שלום {{parent_name}},</p><p>בקשתך לתור עבור {{child_name}} בתאריך {{date}} בשעה {{time}} ב{{location}} התקבלה. ניצור איתך קשר בקרוב לאישור.</p>', true),
('appointment_new', 'en', 'Your appointment request was received',
  '<p>Hi {{parent_name}},</p><p>We received your appointment request for {{child_name}} on {{date}} at {{time}} at {{location}}. We will contact you shortly to confirm.</p>', true),

('appointment_confirmed', 'ar', 'تم تأكيد موعدك',
  '<p>مرحباً {{parent_name}},</p><p>تم تأكيد موعد {{child_name}} بتاريخ {{date}} الساعة {{time}} في {{location}}.</p>', true),
('appointment_confirmed', 'he', 'התור שלך אושר',
  '<p>שלום {{parent_name}},</p><p>התור עבור {{child_name}} בתאריך {{date}} בשעה {{time}} ב{{location}} אושר.</p>', true),
('appointment_confirmed', 'en', 'Your appointment is confirmed',
  '<p>Hi {{parent_name}},</p><p>The appointment for {{child_name}} on {{date}} at {{time}} at {{location}} is confirmed.</p>', true),

('appointment_reminder', 'ar', 'تذكير: موعدك غداً',
  '<p>مرحباً {{parent_name}},</p><p>تذكير بموعد {{child_name}} غداً {{date}} الساعة {{time}} في {{location}}.</p>', true),
('appointment_reminder', 'he', 'תזכורת: תור מחר',
  '<p>שלום {{parent_name}},</p><p>תזכורת לתור עבור {{child_name}} מחר {{date}} בשעה {{time}} ב{{location}}.</p>', true),
('appointment_reminder', 'en', 'Reminder: appointment tomorrow',
  '<p>Hi {{parent_name}},</p><p>Reminder: {{child_name}}''s appointment is tomorrow, {{date}} at {{time}} at {{location}}.</p>', true)
ON CONFLICT (template_key, language) DO NOTHING;
