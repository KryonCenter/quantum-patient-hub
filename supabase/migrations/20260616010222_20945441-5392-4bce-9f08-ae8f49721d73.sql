
-- Reminder settings per doctor
CREATE TABLE public.reminder_settings (
  doctor_id UUID PRIMARY KEY REFERENCES public.doctors(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  send_day_before BOOLEAN NOT NULL DEFAULT true,
  send_same_day BOOLEAN NOT NULL DEFAULT true,
  send_hours_before BOOLEAN NOT NULL DEFAULT true,
  hours_before INTEGER NOT NULL DEFAULT 2,
  send_time TIME NOT NULL DEFAULT '08:00',
  whatsapp_template TEXT NOT NULL DEFAULT 'Hola {paciente}, le escribo con el motivo para confirmar su cita programada para el {fecha} a las {hora} 🗓️

Es importante No presentar tos, gripa y/o fiebre para su atención dental 🤧

🙌 Quedo atenta a su respuesta ✅

En caso de cancelación 🚫 favor de notificarnos 🙏 para reagendar su cita 👩‍💻

{doctor} — {sucursal}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_settings TO authenticated;
GRANT ALL ON public.reminder_settings TO service_role;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor or staff manages reminder settings" ON public.reminder_settings
FOR ALL TO authenticated
USING (public.can_access_doctor(doctor_id))
WITH CHECK (public.can_access_doctor(doctor_id));

CREATE TRIGGER update_reminder_settings_updated_at
BEFORE UPDATE ON public.reminder_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notifications (in-app bell)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctor or staff sees notifications" ON public.notifications
FOR SELECT TO authenticated
USING (public.can_access_doctor(doctor_id));

CREATE POLICY "Doctor or staff updates notifications" ON public.notifications
FOR UPDATE TO authenticated
USING (public.can_access_doctor(doctor_id))
WITH CHECK (public.can_access_doctor(doctor_id));

CREATE POLICY "System and staff insert notifications" ON public.notifications
FOR INSERT TO authenticated
WITH CHECK (public.can_access_doctor(doctor_id));

CREATE INDEX idx_notifications_doctor_unread ON public.notifications(doctor_id, read_at);

-- Default reminder settings for existing doctors
INSERT INTO public.reminder_settings (doctor_id)
SELECT id FROM public.doctors
ON CONFLICT DO NOTHING;
