
-- doctor_schedules
CREATE TABLE public.doctor_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  slot_minutes integer NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.doctor_schedules TO authenticated;
GRANT SELECT ON public.doctor_schedules TO anon;
GRANT ALL ON public.doctor_schedules TO service_role;

ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedules readable by anon for booking"
  ON public.doctor_schedules FOR SELECT
  USING (true);

CREATE POLICY "schedules manageable by doctor or staff"
  ON public.doctor_schedules FOR ALL
  TO authenticated
  USING (public.can_access_doctor(doctor_id))
  WITH CHECK (public.can_access_doctor(doctor_id));

CREATE TRIGGER trg_doctor_schedules_updated
BEFORE UPDATE ON public.doctor_schedules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- appointments extras
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.branch_rooms(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requested_by_patient boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirmation_status text NOT NULL DEFAULT 'confirmed';

-- patients pending validation
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS pending_validation boolean NOT NULL DEFAULT false;
