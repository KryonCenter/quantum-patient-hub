
-- Bloque 1: Datos extendidos de pacientes (nombres separados, fecha nac., localidad, tutor)
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name_paterno text,
  ADD COLUMN IF NOT EXISTS last_name_materno text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS locality text,
  ADD COLUMN IF NOT EXISTS guardian_patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS guardian_first_name text,
  ADD COLUMN IF NOT EXISTS guardian_last_name_paterno text,
  ADD COLUMN IF NOT EXISTS guardian_last_name_materno text;

CREATE INDEX IF NOT EXISTS idx_patients_guardian ON public.patients(guardian_patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_telefono ON public.patients(telefono);

-- Bloque 9: Consultorios por sucursal + capacidad
ALTER TABLE public.branches
  ADD COLUMN IF NOT EXISTS room_count integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS public.branch_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  name text NOT NULL,
  assigned_doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_rooms TO authenticated;
GRANT ALL ON public.branch_rooms TO service_role;

ALTER TABLE public.branch_rooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "branch_rooms_doctor_full" ON public.branch_rooms;
CREATE POLICY "branch_rooms_doctor_full" ON public.branch_rooms
  FOR ALL TO authenticated
  USING (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.is_doctor_owner(doctor_id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS branch_rooms_updated_at ON public.branch_rooms;
CREATE TRIGGER branch_rooms_updated_at BEFORE UPDATE ON public.branch_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_branch_rooms_branch ON public.branch_rooms(branch_id);
