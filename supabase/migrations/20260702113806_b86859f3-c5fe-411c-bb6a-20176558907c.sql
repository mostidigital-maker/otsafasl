ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS child_national_id TEXT;
ALTER TABLE public.appointments ALTER COLUMN email DROP NOT NULL;