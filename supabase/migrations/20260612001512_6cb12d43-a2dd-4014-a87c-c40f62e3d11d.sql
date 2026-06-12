
-- Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'recepcion';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'asistente';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'monitor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
