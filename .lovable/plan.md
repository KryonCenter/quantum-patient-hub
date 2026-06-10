
# Plataforma multi-doctor

Voy a convertir la app en una plataforma multi-tenant donde cada doctor administra su propio espacio: pacientes, productos/servicios, sucursales, citas, branding y Google Calendar. Quitamos el escaneo cuántico del paciente.

## 1. Modelo de datos (migración)

Nuevas tablas y cambios:

- `doctors` — perfil profesional del doctor
  - `user_id` (FK auth.users, único), `display_name`, `specialty`, `logo_url`, `brand_color`, `whatsapp_phone`, `google_calendar_connected` (bool), `google_refresh_token` (cifrado / vault), `google_calendar_id`
- `branches` (sucursales) — 1 a 5 por doctor
  - `doctor_id`, `name`, `address`, `city`, `phone`, `is_primary`
  - límite: trigger que valida ≤5 por doctor
- `patients` — agregar `doctor_id` (FK), quitar campos de escaneo cuántico
- `products` — agregar `doctor_id` (FK), agregar `kind` (`service` | `physical`)
- `appointments` — agregar `doctor_id` (FK), `branch_id` (FK), `reason` (motivo)
  - `appointment_products` ya existe — sigue siendo el detalle de servicios/productos
- Nuevo rol `doctor` en enum `app_role` (además de `admin`, `user`)
- RLS: cada doctor solo ve filas donde `doctor_id = auth.uid()`; admin ve todo
- Storage bucket `doctor-logos` (público de lectura)

## 2. Autenticación y roles

- Mantener Email + Google para todos
- Al registrarse, el usuario elige "Soy doctor" → se crea fila en `doctors` y rol `doctor`
- Los pacientes pueden registrarse por correo (rol `user`) y verán solo sus propias citas

## 3. Páginas nuevas / refactor

- `/doctor/dashboard` — panel del doctor
- `/doctor/pacientes` — solo sus pacientes (CRUD, búsqueda)
- `/doctor/productos` — sus productos/servicios con campo "tipo: servicio | físico"
- `/doctor/sucursales` — agregar/editar hasta 5 sucursales
- `/doctor/citas` — citas con selector de paciente, sucursal y producto/servicio
- `/doctor/configuracion` — logo, color, WhatsApp, conectar Google Calendar
- `/admin/*` — sigue existiendo para super-admin (ve todo)
- Quitar widgets/campos de "escaneo cuántico" en `PatientDialog`, dashboards y estadísticas

## 4. Google Calendar

- OAuth per-user (cada doctor conecta su propia cuenta)
- Edge functions:
  - `google-calendar-connect` — inicia OAuth, guarda refresh token
  - `google-calendar-sync` — al crear/editar/eliminar una cita, crea/actualiza/borra el evento en su calendario
- Requiere que el doctor configure credenciales OAuth de Google (le pido `GOOGLE_OAUTH_CLIENT_ID` y `GOOGLE_OAUTH_CLIENT_SECRET` como secretos del proyecto)

## 5. Notificación de cita al paciente

Al crear una cita, mostrar al doctor una **tarjeta de confirmación** con:
- Nombre del paciente, doctor, fecha/hora
- Motivo + producto/servicio
- Sucursal: nombre + dirección
- Logo del doctor

Acciones en la tarjeta:
- **Enviar por email** — edge function `send-appointment-email` (usa Lovable Emails, plantilla React Email con branding del doctor)
- **Enviar por WhatsApp** — botón que abre `https://wa.me/<tel>?text=<mensaje>` con el resumen pre-formateado (no requiere API, es click-to-chat)

## 6. Detalles técnicos

```text
auth.users ──┬─< doctors ──┬─< branches (≤5)
             │             ├─< patients
             │             ├─< products (kind: service|physical)
             │             └─< appointments ──< appointment_products
             └─< user_roles (admin|doctor|user)
```

- Helper SQL `is_doctor_owner(row_doctor_id)` para policies
- Edge functions: `google-calendar-connect`, `google-calendar-sync`, `send-appointment-email`
- Plantilla email: `supabase/functions/_shared/transactional-email-templates/appointment-confirmation.tsx`

## 7. Lo que requiere acción del usuario

1. Confirmar el plan
2. Si quieres Google Calendar real ahora: necesito que crees credenciales OAuth en Google Cloud Console (client ID + secret) y te las pediré con el formulario seguro. Si prefieres, lo dejo como botón "próximamente" y lo conectamos después.
3. Para emails con tu propio dominio (opcional): puedo configurar el dominio de envío; si no, usamos el remitente por defecto de Lovable.

## 8. Lo que se elimina

- Toda referencia a "escaneo cuántico" en pacientes, dashboard y estadísticas
- El campo y métricas asociadas

¿Confirmas el plan y me dices si seguimos con Google Calendar ahora (necesito las credenciales) o lo dejamos como "próximamente"?
