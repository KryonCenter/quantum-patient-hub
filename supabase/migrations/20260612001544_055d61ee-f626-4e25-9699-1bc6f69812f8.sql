
-- doctor_modules
CREATE TABLE IF NOT EXISTS public.doctor_modules (
  doctor_id uuid PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
  citas boolean NOT NULL DEFAULT true,
  pos boolean NOT NULL DEFAULT true,
  inventario boolean NOT NULL DEFAULT true,
  monitor boolean NOT NULL DEFAULT true,
  recordatorios boolean NOT NULL DEFAULT true,
  reportes boolean NOT NULL DEFAULT true,
  google_calendar boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_modules TO authenticated;
GRANT ALL ON public.doctor_modules TO service_role;
ALTER TABLE public.doctor_modules ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_doctor_modules_updated_at
BEFORE UPDATE ON public.doctor_modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- doctor_staff
CREATE TABLE IF NOT EXISTS public.doctor_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (doctor_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_staff TO authenticated;
GRANT ALL ON public.doctor_staff TO service_role;
ALTER TABLE public.doctor_staff ENABLE ROW LEVEL SECURITY;

-- helper: which doctor_id does the current user belong to as staff?
CREATE OR REPLACE FUNCTION public.current_staff_doctor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT doctor_id FROM public.doctor_staff WHERE user_id = auth.uid() LIMIT 1;
$$;

-- helper: can current user act on this doctor (owner, staff, or admin)?
CREATE OR REPLACE FUNCTION public.can_access_doctor(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT
    public.is_doctor_owner(_doctor_id)
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.doctor_staff
      WHERE doctor_id = _doctor_id AND user_id = auth.uid()
    );
$$;

-- Policies: doctor_modules
CREATE POLICY "modules_select"
ON public.doctor_modules FOR SELECT
USING (public.can_access_doctor(doctor_id));

CREATE POLICY "modules_modify"
ON public.doctor_modules FOR ALL
USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Policies: doctor_staff (only doctor owner / admin manages; staff can read its own row)
CREATE POLICY "staff_select"
ON public.doctor_staff FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_doctor_owner(doctor_id)
  OR public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'super_admin')
);

CREATE POLICY "staff_modify"
ON public.doctor_staff FOR ALL
USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Auto-create modules when a new doctor is inserted
CREATE OR REPLACE FUNCTION public.create_default_doctor_modules()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.doctor_modules (doctor_id) VALUES (NEW.id)
  ON CONFLICT (doctor_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_default_modules ON public.doctors;
CREATE TRIGGER trg_doctor_default_modules
AFTER INSERT ON public.doctors
FOR EACH ROW EXECUTE FUNCTION public.create_default_doctor_modules();

-- Backfill modules for existing doctors
INSERT INTO public.doctor_modules (doctor_id)
SELECT id FROM public.doctors
ON CONFLICT (doctor_id) DO NOTHING;
