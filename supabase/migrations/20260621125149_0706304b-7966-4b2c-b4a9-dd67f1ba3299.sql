
-- Enum types
CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');
CREATE TYPE public.app_language AS ENUM ('ar', 'he', 'en');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users see own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins see all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- locations
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  address_ar TEXT,
  address_he TEXT,
  address_en TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read locations" ON public.locations FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "admin manage locations" ON public.locations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- working_hours: weekday 0=Sunday..6=Saturday
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at TIME NOT NULL,
  closes_at TIME NOT NULL,
  slot_minutes INT NOT NULL DEFAULT 45,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (opens_at < closes_at)
);
CREATE INDEX ON public.working_hours (location_id, weekday);
GRANT SELECT ON public.working_hours TO anon, authenticated;
GRANT ALL ON public.working_hours TO service_role;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read working hours" ON public.working_hours FOR SELECT TO anon, authenticated USING (is_active);
CREATE POLICY "admin manage working hours" ON public.working_hours FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- blocked_slots
CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (start_at < end_at)
);
CREATE INDEX ON public.blocked_slots (location_id, start_at);
GRANT SELECT ON public.blocked_slots TO anon, authenticated;
GRANT ALL ON public.blocked_slots TO service_role;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read blocked slots" ON public.blocked_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage blocked slots" ON public.blocked_slots FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES public.locations,
  slot_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  child_name TEXT NOT NULL,
  child_age TEXT,
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  language app_language NOT NULL DEFAULT 'ar',
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (location_id, slot_at)
);
CREATE INDEX ON public.appointments (location_id, slot_at);
CREATE INDEX ON public.appointments (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT ON public.appointments TO anon;
GRANT SELECT ON public.appointments TO anon;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Anyone can create an appointment (booking form). Trust server-side slot validation via unique constraint.
CREATE POLICY "anyone can book" ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Public can read only minimal taken-slot info for availability calc. We restrict columns via a view below.
-- For simplicity expose only slot_at via SELECT policy; the booking UI will read from a view.
CREATE POLICY "admin read all appointments" ON public.appointments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update appointments" ON public.appointments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete appointments" ON public.appointments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public view: taken slots only (no PII)
CREATE OR REPLACE VIEW public.taken_slots AS
  SELECT location_id, slot_at, duration_minutes FROM public.appointments WHERE status <> 'cancelled';

GRANT SELECT ON public.taken_slots TO anon, authenticated;

-- Seed locations
INSERT INTO public.locations (slug, name_ar, name_he, name_en, address_ar, address_he, address_en, sort_order) VALUES
  ('beer-sheva', 'بئر السبع', 'באר שבע', 'Beer Sheva', 'بئر السبع', 'באר שבע', 'Beer Sheva', 1),
  ('miilya', 'معليا', 'מעיליא', 'Mi''ilya', 'معليا', 'מעיליא', 'Mi''ilya', 2);

-- Default working hours: Sun-Thu 09:00-17:00 for both locations, 45-min slots
INSERT INTO public.working_hours (location_id, weekday, opens_at, closes_at, slot_minutes)
SELECT l.id, wd, '09:00'::time, '17:00'::time, 45
FROM public.locations l
CROSS JOIN generate_series(0, 4) wd;
