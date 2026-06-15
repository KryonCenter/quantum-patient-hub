# Plan de expansión de la plataforma

Esto es grande. Lo divido en bloques para implementarse en orden. Cada bloque deja la app utilizable.

## Bloque 1 — Datos de pacientes y tutores

- Separar `name` en `first_name`, `last_name_paterno`, `last_name_materno`.
- Agregar `birth_date`, `locality` (localidad), eliminar selección de tipo de pago del alta.
- Si edad < 18 → obligar tutor: nombres, apellidos, y buscador del tutor entre pacientes/usuarios; si no existe, alta rápida y vinculación (`guardian_patient_id`).
- En el diálogo de cita: barra de búsqueda (nombre o teléfono) además del dropdown de paciente.

## Bloque 2 — Módulos y roles configurables ✅ (entregado)

Nuevos roles: `recepcion`, `asistente`, `monitor`, `super_admin` (además de `admin`, `doctor`, `user`).

- Tabla `doctor_modules` con interruptores por doctor (citas, pos, inventario, monitor, recordatorios, reportes, google_calendar) gestionable desde Admin → Usuarios.
- Tabla `doctor_staff` que vincula usuarios a un doctor con rol `recepcion`/`asistente`/`monitor`.
- Página "Gestión de Usuarios" amplia: cambiar rol primario de cualquier cuenta vía dropdown, panel por doctor con módulos + personal.
- Sidebar oculta items según módulos deshabilitados.
- Pendiente: rutas dedicadas para recepción/asistente/monitor (se hará en bloques siguientes).


## Bloque 3 — Punto de venta (POS) ✅ (entregado)

- Tabla `sales` (doctor_id, branch_id, patient_id, appointment_id, total, status, created_by) + `sale_items` (product_id o servicio libre, qty, unit_price editable, subtotal) + `sale_payments` (method: `efectivo` | `transferencia` | `tarjeta`, amount, reference para transferencia/tarjeta).
- Pantalla "Cobro" precarga los productos/servicios de la cita; el doctor puede:
  - Editar precio (descuento), quitar ítems, agregar productos/servicios.
  - Dividir pago en hasta 3 métodos simultáneos con sus referencias.
- Si el producto es `physical` y hay inventario → descuenta stock.
- Cierre de cita marca la venta como `paid` y dispara evento al monitor.

## Bloque 4 — Reportes

- Página "Reportes" (admin de doctor, super admin): ventas por semana / quincena / mes / rango personalizado. Filtros por sucursal, método de pago, doctor (super admin).
- Tarjetas: ingresos totales, número de ventas, ticket promedio, desglose por método.

## Bloque 5 — Agenda inteligente

- Tabla `doctor_schedules` (doctor_id, branch_id, weekday, start_time, end_time, slot_minutes).
- Tabla `branch_rooms` (sucursal → consultorios) y `room_doctor_assignments` (qué doctor atiende en qué consultorio).
- En el dashboard del doctor: configuración de días/horarios laborales por sucursal y duración de slot.
- Calendario de paciente: muestra solo huecos disponibles considerando citas existentes.
- Modo "solicitud abierta": el paciente puede pedir cita sin fecha/hora; queda `status='requested'` para que el doctor confirme fecha.

## Bloque 6 — Flujo paciente mejorado

- Al ser paciente: la cita toma sus datos automáticamente.
- Selector "para mí / para un menor que tutelo" (si tiene menores vinculados).
- Si el menor no existe: alta rápida y la cita queda `pending_validation` hasta que el doctor apruebe.
- Selección de doctor primero (todos los doctores visibles), luego sucursal y productos/servicios filtrados a ese doctor.

## Bloque 7 — Recordatorios y notificaciones

- Tabla `reminder_settings` por doctor: horas configurables (ej. 08:00) y días (1 día antes, mismo día, 2 horas antes/check-in).
- Plantilla de WhatsApp configurable por doctor (`whatsapp_template`) con tokens: `{paciente}`, `{hora}`, `{doctor}`, `{sucursal}`.
- Edge function `send-reminders` + cron (pg_cron, cada 15 min) que evalúa qué citas requieren recordatorio según settings.
- Tabla `notifications` (doctor_id, type, payload, read_at). Botón de campana en el header del doctor con badge.
- Al confirmar el paciente en la app → notificación al doctor.
- Arreglar `send-appointment-email` (revisar dominio/sender) para que el correo llegue. Si no hay dominio verificado → guiar setup.

## Bloque 8 — Pantalla Monitor (Smart TV)

- Ruta pública con login: `/monitor`. Sin sidebar, layout full-screen.
- Encabezado: nombre de sucursal (selección al iniciar sesión).
- Columna izquierda: lista de pacientes del día en orden.
- Columna derecha: por consultorio, paciente actual y siguiente.
- Estados manejables desde la cuenta del asistente/doctor: `en_espera`, `en_consultorio`, `terminado`. Se refleja en tiempo real (Supabase realtime).
- Al cerrar la cita / cobrar → automáticamente pasa al siguiente.

## Bloque 9 — Sucursales y consultorios

- Extender `branches` con `room_count`.
- Tabla `branch_rooms` con `name` ("Consultorio 1") y asignación de doctor responsable.

## Bloque 10 — Inventario

- Extender `products` con `stock`, `min_stock`, `track_inventory` (bool).
- Tabla `inventory_movements` (product_id, qty, type: `entrada`|`salida`|`ajuste`, reason, sale_id?).
- Página "Inventario" para alta de movimientos y visualización de stock.

## Bloque 11 — Google Calendar real

- Botón "Conectar Google Calendar" en config del doctor.
- Edge functions `google-oauth-init` y `google-oauth-callback` con credenciales OAuth (requiere CLIENT_ID / CLIENT_SECRET del usuario en Google Cloud Console).
- Tras conectar, sincronizar cada cita creada/modificada/cancelada.

## Bloque 12 — Bugs y pulido

- Logo del doctor no se reemplaza: usar `upsert: true` y `cacheControl: '0'` en el `storage.upload`; añadir `?v={timestamp}` a la URL.

---

## Cómo te propongo entregarlo

Por tamaño, no puedo (ni te conviene) hacer todo en una sola pasada. Propongo este orden de entregas, cada una probable y desplegable:

1. **Bloques 1, 9, 12** — datos pacientes/tutores + consultorios + fix logo.
2. **Bloque 2** — módulos y roles + página super admin.
3. **Bloques 5 y 6** — agenda inteligente + flujo paciente.
4. **Bloques 3 y 10** — POS + inventario.
5. **Bloque 4** — reportes.
6. **Bloque 7** — recordatorios + plantilla WhatsApp + notificaciones (incluye fix del correo).
7. **Bloque 8** — monitor TV.
8. **Bloque 11** — Google Calendar real (necesitaré tus credenciales OAuth).

## Preguntas para arrancar

1. ¿Confirmamos este orden, o prefieres priorizar algo distinto (p. ej. POS antes que agenda)?
2. Para el usuario "super admin" que habilita módulos: ¿usamos tu cuenta actual de admin o creas una nueva dedicada?
3. ¿El monitor TV debe ser por sucursal o por consultorio (uno por TV)?
4. Para el correo que no llegó: ¿quieres configurar dominio propio (recomendado) o usamos el remitente por defecto? Si no hay dominio, los correos pueden caer a spam o ser bloqueados.

Una vez confirmes, empiezo con el Bloque 1.
