
-- =========================================================
-- DOCTORS
-- =========================================================
CREATE TABLE public.doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  specialty text,
  logo_url text,
  brand_color text DEFAULT '#10b981',
  whatsapp_phone text,
  google_calendar_connected boolean NOT NULL DEFAULT false,
  google_calendar_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctors TO authenticated;
GRANT ALL ON public.doctors TO service_role;

ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors_select_self_or_admin" ON public.doctors
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "doctors_insert_self" ON public.doctors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "doctors_update_self_or_admin" ON public.doctors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "doctors_delete_admin" ON public.doctors
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_doctors_updated_at
  BEFORE UPDATE ON public.doctors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper to resolve doctor_id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_doctor_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.doctors WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_doctor_owner(_doctor_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.doctors
    WHERE id = _doctor_id AND user_id = auth.uid()
  );
$$;

-- =========================================================
-- BRANCHES (max 5 per doctor)
-- =========================================================
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text NOT NULL,
  city text,
  phone text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "branches_doctor_full" ON public.branches
  FOR ALL TO authenticated
  USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.enforce_branch_limit()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.branches WHERE doctor_id = NEW.doctor_id) >= 5 THEN
    RAISE EXCEPTION 'Máximo 5 sucursales por doctor';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER branches_limit_trigger
  BEFORE INSERT ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.enforce_branch_limit();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- DOCTOR OAUTH (Google Calendar tokens)
-- =========================================================
CREATE TABLE public.doctor_oauth (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL UNIQUE REFERENCES public.doctors(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google',
  refresh_token text,
  access_token text,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NO grants to authenticated/anon (only edge functions via service_role)
GRANT ALL ON public.doctor_oauth TO service_role;
ALTER TABLE public.doctor_oauth ENABLE ROW LEVEL SECURITY;
-- No policies = locked for normal users

-- =========================================================
-- ALTER EXISTING TABLES
-- =========================================================
ALTER TABLE public.patients
  ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  DROP COLUMN IF EXISTS escaneo_quantico;

CREATE INDEX patients_doctor_id_idx ON public.patients(doctor_id);

ALTER TABLE public.products
  ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  ADD COLUMN kind text NOT NULL DEFAULT 'service' CHECK (kind IN ('service','physical'));

CREATE INDEX products_doctor_id_idx ON public.products(doctor_id);

ALTER TABLE public.appointments
  ADD COLUMN doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE,
  ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;

CREATE INDEX appointments_doctor_id_idx ON public.appointments(doctor_id);

-- =========================================================
-- RLS: rewrite policies for doctor-scoping
-- =========================================================

-- PATIENTS
DROP POLICY IF EXISTS "Authenticated users can view all patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can insert patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can update patients" ON public.patients;
DROP POLICY IF EXISTS "Authenticated users can delete patients" ON public.patients;

CREATE POLICY "patients_doctor_full" ON public.patients
  FOR ALL TO authenticated
  USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'));

-- PRODUCTS
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON public.products;

CREATE POLICY "products_doctor_full" ON public.products
  FOR ALL TO authenticated
  USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can delete appointments" ON public.appointments;

CREATE POLICY "appointments_doctor_full" ON public.appointments
  FOR ALL TO authenticated
  USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'));

-- Patients can SELECT their own appointments by matching profile email
CREATE POLICY "appointments_patient_view_own" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      JOIN public.profiles pr ON pr.email = p.correo
      WHERE p.id = appointments.patient_id AND pr.id = auth.uid()
    )
  );

-- APPOINTMENT PRODUCTS
DROP POLICY IF EXISTS "Authenticated users can view appointment_products" ON public.appointment_products;
DROP POLICY IF EXISTS "Authenticated users can insert appointment_products" ON public.appointment_products;
DROP POLICY IF EXISTS "Authenticated users can update appointment_products" ON public.appointment_products;
DROP POLICY IF EXISTS "Authenticated users can delete appointment_products" ON public.appointment_products;

CREATE POLICY "appointment_products_full" ON public.appointment_products
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_products.appointment_id
        AND (public.is_doctor_owner(a.doctor_id) OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = appointment_products.appointment_id
        AND (public.is_doctor_owner(a.doctor_id) OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- =========================================================
-- Update handle_new_user to optionally create doctor profile
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_doctor boolean := COALESCE((NEW.raw_user_meta_data->>'is_doctor')::boolean, false);
  display_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email);
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    display_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF is_doctor THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'doctor')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.doctors (user_id, display_name, specialty)
    VALUES (NEW.id, display_name, NEW.raw_user_meta_data->>'specialty')
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;
