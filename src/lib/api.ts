import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  Branch,
  Doctor,
  Patient,
  Product,
  ProductKind,
} from "@/lib/types";

/* ---------- helpers ---------- */

let cachedDoctorId: string | null = null;

export async function getCurrentDoctorId(): Promise<string | null> {
  if (cachedDoctorId) return cachedDoctorId;
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("doctors")
    .select("id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error) return null;
  cachedDoctorId = data?.id ?? null;
  return cachedDoctorId;
}

export function clearDoctorCache() {
  cachedDoctorId = null;
}

function rowToAppointment(row: any, products: any[] = [], branch?: any): Appointment {
  return {
    id: row.id,
    fecha: row.fecha,
    hora: row.hora ? String(row.hora).slice(0, 5) : "",
    motivo: row.motivo ?? "",
    estado: row.estado,
    branchId: row.branch_id ?? null,
    branchName: branch?.name ?? null,
    branchAddress: branch?.address ?? null,
    productos: products.map((p) => ({
      id: p.id,
      productId: p.product_id,
      nombre: p.nombre,
      precio: Number(p.precio),
      cantidad: p.cantidad,
    })),
    consulta: {
      sintomas: row.sintomas ?? "",
      diagnostico: row.diagnostico ?? "",
      tratamiento: row.tratamiento ?? "",
      observaciones: row.observaciones ?? "",
    },
  };
}

function rowToPatient(row: any, appointments: Appointment[] = []): Patient {
  const firstName = row.first_name ?? "";
  const lastNamePaterno = row.last_name_paterno ?? "";
  const lastNameMaterno = row.last_name_materno ?? "";
  const computed = [firstName, lastNamePaterno, lastNameMaterno].filter(Boolean).join(" ").trim();
  return {
    id: row.id,
    nombre: computed || row.nombre || "",
    firstName,
    lastNamePaterno,
    lastNameMaterno,
    telefono: row.telefono ?? "",
    correo: row.correo ?? "",
    tipoPago: row.tipo_pago ?? "",
    observaciones: row.observaciones ?? "",
    fechaRegistro: row.fecha_registro,
    birthDate: row.birth_date ?? null,
    locality: row.locality ?? null,
    guardianPatientId: row.guardian_patient_id ?? null,
    guardianFirstName: row.guardian_first_name ?? null,
    guardianLastNamePaterno: row.guardian_last_name_paterno ?? null,
    guardianLastNameMaterno: row.guardian_last_name_materno ?? null,
    citas: appointments,
  };
}


/* ---------- doctor ---------- */

export async function fetchCurrentDoctor(): Promise<Doctor | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .eq("user_id", u.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    displayName: data.display_name,
    specialty: data.specialty,
    logoUrl: data.logo_url,
    brandColor: data.brand_color ?? "#10b981",
    whatsappPhone: data.whatsapp_phone,
    googleCalendarConnected: data.google_calendar_connected,
  };
}

export async function upsertDoctor(input: {
  displayName: string;
  specialty?: string;
  logoUrl?: string | null;
  brandColor?: string;
  whatsappPhone?: string;
}): Promise<Doctor> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("No autenticado");

  const existing = await fetchCurrentDoctor();
  if (existing) {
    const { data, error } = await supabase
      .from("doctors")
      .update({
        display_name: input.displayName,
        specialty: input.specialty ?? null,
        logo_url: input.logoUrl ?? null,
        brand_color: input.brandColor ?? "#10b981",
        whatsapp_phone: input.whatsappPhone ?? null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    clearDoctorCache();
    return (await fetchCurrentDoctor())!;
  }
  const { data, error } = await supabase
    .from("doctors")
    .insert({
      user_id: u.user.id,
      display_name: input.displayName,
      specialty: input.specialty ?? null,
      logo_url: input.logoUrl ?? null,
      brand_color: input.brandColor ?? "#10b981",
      whatsapp_phone: input.whatsappPhone ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  // also ensure role
  await supabase.from("user_roles").insert({ user_id: u.user.id, role: "doctor" as any });
  clearDoctorCache();
  return (await fetchCurrentDoctor())!;
}

export async function uploadDoctorLogo(file: File): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("No autenticado");
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  // Stable path so upsert truly replaces the previous logo
  const path = `${u.user.id}/logo.${ext}`;
  // Remove any previous logo files (different extensions) so we don't leave stale ones
  const { data: existing } = await supabase.storage
    .from("doctor-logos")
    .list(u.user.id);
  const toRemove = (existing ?? [])
    .filter((f) => f.name.startsWith("logo."))
    .map((f) => `${u.user!.id}/${f.name}`);
  if (toRemove.length > 0) {
    await supabase.storage.from("doctor-logos").remove(toRemove);
  }
  const { error } = await supabase.storage
    .from("doctor-logos")
    .upload(path, file, { upsert: true, cacheControl: "0", contentType: file.type });
  if (error) throw error;
  const { data } = await supabase.storage
    .from("doctor-logos")
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  // Cache-bust so the <img> reloads
  const url = data?.signedUrl ?? path;
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}


/* ---------- branches ---------- */

function rowToBranch(r: any): Branch {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    name: r.name,
    address: r.address,
    city: r.city,
    phone: r.phone,
    isPrimary: r.is_primary,
    roomCount: r.room_count ?? 1,
  };
}

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from("branches").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(rowToBranch);
}

export async function createBranch(b: Omit<Branch, "id" | "doctorId">): Promise<Branch> {
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("Crea tu perfil de doctor primero");
  const { data, error } = await supabase
    .from("branches")
    .insert({
      doctor_id: doctorId,
      name: b.name,
      address: b.address,
      city: b.city,
      phone: b.phone,
      is_primary: b.isPrimary,
      room_count: b.roomCount ?? 1,
    } as any)
    .select("*")
    .single();
  if (error) throw error;
  return rowToBranch(data);
}

export async function updateBranch(b: Branch): Promise<void> {
  const { error } = await supabase
    .from("branches")
    .update({
      name: b.name,
      address: b.address,
      city: b.city,
      phone: b.phone,
      is_primary: b.isPrimary,
      room_count: b.roomCount ?? 1,
    } as any)
    .eq("id", b.id);
  if (error) throw error;
}

export async function deleteBranch(id: string): Promise<void> {
  const { error } = await supabase.from("branches").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- branch rooms (consultorios) ---------- */

export async function fetchBranchRooms(branchId?: string): Promise<import("@/lib/types").BranchRoom[]> {
  let q = supabase.from("branch_rooms" as any).select("*").order("name");
  if (branchId) q = q.eq("branch_id", branchId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    branchId: r.branch_id,
    doctorId: r.doctor_id,
    name: r.name,
    assignedDoctorId: r.assigned_doctor_id ?? null,
  }));
}

export async function createBranchRoom(input: { branchId: string; name: string; assignedDoctorId?: string | null }) {
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("Crea tu perfil de doctor primero");
  const { error } = await supabase.from("branch_rooms" as any).insert({
    branch_id: input.branchId,
    doctor_id: doctorId,
    name: input.name,
    assigned_doctor_id: input.assignedDoctorId ?? null,
  } as any);
  if (error) throw error;
}

export async function updateBranchRoom(id: string, input: { name?: string; assignedDoctorId?: string | null }) {
  const patch: any = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.assignedDoctorId !== undefined) patch.assigned_doctor_id = input.assignedDoctorId;
  const { error } = await supabase.from("branch_rooms" as any).update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteBranchRoom(id: string) {
  const { error } = await supabase.from("branch_rooms" as any).delete().eq("id", id);
  if (error) throw error;
}


/* ---------- patients ---------- */

export async function fetchPatients(): Promise<Patient[]> {
  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (patients ?? []).map((p) => p.id);
  if (ids.length === 0) return [];

  const [{ data: appts, error: aErr }, { data: branches }] = await Promise.all([
    supabase.from("appointments").select("*").in("patient_id", ids),
    supabase.from("branches").select("id, name, address"),
  ]);
  if (aErr) throw aErr;
  const branchMap = new Map((branches ?? []).map((b: any) => [b.id, b]));

  const apptIds = (appts ?? []).map((a) => a.id);
  let products: any[] = [];
  if (apptIds.length > 0) {
    const { data: prodRows, error: pErr } = await supabase
      .from("appointment_products")
      .select("*")
      .in("appointment_id", apptIds);
    if (pErr) throw pErr;
    products = prodRows ?? [];
  }

  const byAppt = new Map<string, any[]>();
  for (const p of products) {
    const arr = byAppt.get(p.appointment_id) ?? [];
    arr.push(p);
    byAppt.set(p.appointment_id, arr);
  }

  const apptsByPatient = new Map<string, Appointment[]>();
  for (const a of appts ?? []) {
    const list = apptsByPatient.get(a.patient_id) ?? [];
    list.push(rowToAppointment(a, byAppt.get(a.id) ?? [], branchMap.get(a.branch_id)));
    apptsByPatient.set(a.patient_id, list);
  }

  return (patients ?? []).map((p) =>
    rowToPatient(p, apptsByPatient.get(p.id) ?? []),
  );
}

export async function createPatient(
  data: Omit<Patient, "id">,
): Promise<Patient> {
  const { data: user } = await supabase.auth.getUser();
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("Crea tu perfil de doctor antes de agregar pacientes");

  const { data: row, error } = await supabase
    .from("patients")
    .insert({
      doctor_id: doctorId,
      nombre: data.nombre,
      first_name: data.firstName,
      last_name_paterno: data.lastNamePaterno,
      last_name_materno: data.lastNameMaterno,
      telefono: data.telefono,
      correo: data.correo,
      tipo_pago: data.tipoPago,
      observaciones: data.observaciones,
      fecha_registro: data.fechaRegistro,
      birth_date: data.birthDate ?? null,
      locality: data.locality ?? null,
      guardian_patient_id: data.guardianPatientId ?? null,
      guardian_first_name: data.guardianFirstName ?? null,
      guardian_last_name_paterno: data.guardianLastNamePaterno ?? null,
      guardian_last_name_materno: data.guardianLastNameMaterno ?? null,
      created_by: user.user?.id ?? null,
    } as any)
    .select("*")
    .single();
  if (error) throw error;

  if (data.citas && data.citas.length > 0) {
    for (const c of data.citas) {
      await upsertAppointment(row.id, c);
    }
  }
  const all = await fetchPatients();
  return all.find((p) => p.id === row.id) ?? rowToPatient(row);
}

export async function updatePatient(patient: Patient): Promise<Patient> {
  const { error } = await supabase
    .from("patients")
    .update({
      nombre: patient.nombre,
      first_name: patient.firstName,
      last_name_paterno: patient.lastNamePaterno,
      last_name_materno: patient.lastNameMaterno,
      telefono: patient.telefono,
      correo: patient.correo,
      tipo_pago: patient.tipoPago,
      observaciones: patient.observaciones,
      fecha_registro: patient.fechaRegistro,
      birth_date: patient.birthDate ?? null,
      locality: patient.locality ?? null,
      guardian_patient_id: patient.guardianPatientId ?? null,
      guardian_first_name: patient.guardianFirstName ?? null,
      guardian_last_name_paterno: patient.guardianLastNamePaterno ?? null,
      guardian_last_name_materno: patient.guardianLastNameMaterno ?? null,
    } as any)
    .eq("id", patient.id);
  if (error) throw error;


  const { data: existing } = await supabase
    .from("appointments")
    .select("id")
    .eq("patient_id", patient.id);
  const existingIds = new Set((existing ?? []).map((r) => r.id));
  const submittedIds = new Set(
    (patient.citas ?? []).filter((c) => existingIds.has(c.id)).map((c) => c.id),
  );
  const toDelete = [...existingIds].filter((id) => !submittedIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("appointments").delete().in("id", toDelete);
  }
  for (const c of patient.citas ?? []) {
    await upsertAppointment(patient.id, c);
  }

  const all = await fetchPatients();
  return all.find((p) => p.id === patient.id)!;
}

export async function deletePatient(id: string): Promise<void> {
  const { error } = await supabase.from("patients").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- appointments ---------- */

export async function upsertAppointment(
  patientId: string,
  appt: Appointment | Omit<Appointment, "id">,
): Promise<string> {
  const isUpdate =
    "id" in appt &&
    appt.id &&
    /^[0-9a-f-]{36}$/i.test(appt.id);

  const doctorId = await getCurrentDoctorId();

  const payload: any = {
    patient_id: patientId,
    fecha: appt.fecha,
    hora: appt.hora || null,
    motivo: appt.motivo,
    estado: appt.estado,
    branch_id: appt.branchId ?? null,
    sintomas: appt.consulta?.sintomas ?? "",
    diagnostico: appt.consulta?.diagnostico ?? "",
    tratamiento: appt.consulta?.tratamiento ?? "",
    observaciones: appt.consulta?.observaciones ?? "",
  };

  let apptId: string;
  if (isUpdate) {
    apptId = (appt as Appointment).id;
    const { error } = await supabase
      .from("appointments")
      .update(payload)
      .eq("id", apptId);
    if (error) throw error;
  } else {
    const { data: user } = await supabase.auth.getUser();
    const { data: row, error } = await supabase
      .from("appointments")
      .insert({ ...payload, doctor_id: doctorId, created_by: user.user?.id ?? null })
      .select("id")
      .single();
    if (error) throw error;
    apptId = row.id;
  }

  await supabase.from("appointment_products").delete().eq("appointment_id", apptId);
  if (appt.productos && appt.productos.length > 0) {
    const rows = appt.productos.map((p) => ({
      appointment_id: apptId,
      product_id: p.productId ?? null,
      nombre: p.nombre,
      precio: p.precio,
      cantidad: p.cantidad,
    }));
    const { error: pErr } = await supabase
      .from("appointment_products")
      .insert(rows);
    if (pErr) throw pErr;
  }
  return apptId;
}

export async function deleteAppointment(id: string): Promise<void> {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- products ---------- */

/* ---------- doctor schedules ---------- */

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  branchId: string | null;
  dayOfWeek: number; // 0=Sun..6=Sat
  startTime: string; // "HH:MM"
  endTime: string;
  slotMinutes: number;
  active: boolean;
}

function rowToSchedule(r: any): DoctorSchedule {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    branchId: r.branch_id ?? null,
    dayOfWeek: r.day_of_week,
    startTime: String(r.start_time).slice(0, 5),
    endTime: String(r.end_time).slice(0, 5),
    slotMinutes: r.slot_minutes ?? 30,
    active: !!r.active,
  };
}

export async function fetchDoctorSchedules(doctorId?: string): Promise<DoctorSchedule[]> {
  const id = doctorId ?? (await getCurrentDoctorId());
  if (!id) return [];
  const { data, error } = await supabase
    .from("doctor_schedules" as any)
    .select("*")
    .eq("doctor_id", id)
    .order("day_of_week");
  if (error) throw error;
  return (data ?? []).map(rowToSchedule);
}

export async function fetchPublicDoctorSchedules(doctorId: string): Promise<DoctorSchedule[]> {
  const { data, error } = await supabase
    .from("doctor_schedules" as any)
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("active", true)
    .order("day_of_week");
  if (error) throw error;
  return (data ?? []).map(rowToSchedule);
}

export async function upsertDoctorSchedule(s: Omit<DoctorSchedule, "id" | "doctorId"> & { id?: string }): Promise<void> {
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("Crea tu perfil de doctor primero");
  const payload: any = {
    doctor_id: doctorId,
    branch_id: s.branchId ?? null,
    day_of_week: s.dayOfWeek,
    start_time: s.startTime,
    end_time: s.endTime,
    slot_minutes: s.slotMinutes,
    active: s.active,
  };
  if (s.id) {
    const { error } = await supabase.from("doctor_schedules" as any).update(payload).eq("id", s.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("doctor_schedules" as any).insert(payload);
    if (error) throw error;
  }
}

export async function deleteDoctorSchedule(id: string): Promise<void> {
  const { error } = await supabase.from("doctor_schedules" as any).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Compute available time slots for a doctor on a specific date.
 * Returns "HH:MM" strings.
 */
export async function fetchAvailableSlots(input: {
  doctorId: string;
  date: string; // YYYY-MM-DD
  branchId?: string | null;
}): Promise<string[]> {
  const d = new Date(input.date + "T00:00:00");
  const dow = d.getDay();
  const schedules = await fetchPublicDoctorSchedules(input.doctorId);
  const matching = schedules.filter(
    (s) => s.dayOfWeek === dow && (!input.branchId || !s.branchId || s.branchId === input.branchId),
  );
  if (matching.length === 0) return [];

  // Pull existing appointments to subtract taken slots
  const { data: taken } = await supabase
    .from("appointments")
    .select("hora, branch_id")
    .eq("doctor_id", input.doctorId)
    .eq("fecha", input.date)
    .neq("estado", "cancelada");
  const takenSet = new Set(
    (taken ?? [])
      .filter((t: any) => !input.branchId || !t.branch_id || t.branch_id === input.branchId)
      .map((t: any) => String(t.hora).slice(0, 5)),
  );

  const slots: string[] = [];
  for (const sch of matching) {
    const [sh, sm] = sch.startTime.split(":").map(Number);
    const [eh, em] = sch.endTime.split(":").map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + sch.slotMinutes <= end) {
      const hh = String(Math.floor(cur / 60)).padStart(2, "0");
      const mm = String(cur % 60).padStart(2, "0");
      const t = `${hh}:${mm}`;
      if (!takenSet.has(t)) slots.push(t);
      cur += sch.slotMinutes;
    }
  }
  return Array.from(new Set(slots)).sort();
}

export async function listPublicDoctors(): Promise<{ id: string; displayName: string; specialty: string | null; logoUrl: string | null; brandColor: string }[]> {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, display_name, specialty, logo_url, brand_color")
    .order("display_name");
  if (error) throw error;
  return (data ?? []).map((d: any) => ({
    id: d.id,
    displayName: d.display_name,
    specialty: d.specialty ?? null,
    logoUrl: d.logo_url ?? null,
    brandColor: d.brand_color ?? "#10b981",
  }));
}

export async function requestAppointmentByPatient(input: {
  doctorId: string;
  branchId?: string | null;
  fecha: string;
  hora: string;
  motivo: string;
  patientId?: string | null;
}): Promise<string> {
  const { data: u } = await supabase.auth.getUser();
  let patientId = input.patientId ?? null;
  if (!patientId && u.user) {
    // Try to find a patient record for this user
    const { data: existing } = await supabase
      .from("patients")
      .select("id")
      .eq("doctor_id", input.doctorId)
      .eq("correo", u.user.email ?? "")
      .maybeSingle();
    if (existing) patientId = (existing as any).id;
  }
  if (!patientId) throw new Error("No se encontró ficha de paciente; pídele al doctor que te registre o crea una solicitud.");

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      doctor_id: input.doctorId,
      patient_id: patientId,
      fecha: input.fecha,
      hora: input.hora,
      motivo: input.motivo,
      estado: "pendiente",
      branch_id: input.branchId ?? null,
      requested_by_patient: true,
      confirmation_status: "pending",
      created_by: u.user?.id ?? null,
    } as any)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function setAppointmentConfirmation(id: string, status: "confirmed" | "rejected"): Promise<void> {
  const { error } = await supabase
    .from("appointments")
    .update({ confirmation_status: status, estado: status === "rejected" ? "cancelada" : "pendiente" } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? "",
    precio: Number(r.precio),
    stock: r.stock,
    kind: (r.kind as ProductKind) ?? "service",
    minStock: r.min_stock ?? 0,
    trackInventory: !!r.track_inventory,
  }));
}

export async function createProduct(p: Omit<Product, "id">): Promise<Product> {
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("Crea tu perfil de doctor antes de agregar productos");
  const { data, error } = await supabase
    .from("products")
    .insert({
      doctor_id: doctorId,
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
      kind: p.kind,
      min_stock: p.minStock ?? 0,
      track_inventory: p.trackInventory ?? false,
    } as any)
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion ?? "",
    precio: Number(data.precio),
    stock: data.stock,
    kind: ((data as any).kind as ProductKind) ?? "service",
    minStock: (data as any).min_stock ?? 0,
    trackInventory: !!(data as any).track_inventory,
  };
}

export async function updateProduct(id: string, p: Partial<Product>): Promise<void> {
  const row: any = {};
  if (p.nombre !== undefined) row.nombre = p.nombre;
  if (p.descripcion !== undefined) row.descripcion = p.descripcion;
  if (p.precio !== undefined) row.precio = p.precio;
  if (p.stock !== undefined) row.stock = p.stock;
  if (p.kind !== undefined) row.kind = p.kind;
  if (p.minStock !== undefined) row.min_stock = p.minStock;
  if (p.trackInventory !== undefined) row.track_inventory = p.trackInventory;
  const { error } = await supabase.from("products").update(row).eq("id", id);
  if (error) throw error;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

/* ---------- POS: sales ---------- */

import type { Sale, SaleItem, SalePayment, InventoryMovement } from "@/lib/types";

export async function createSaleFromAppointment(appointmentId: string): Promise<string> {
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("No doctor");

  // Already exists?
  const { data: existing } = await supabase
    .from("sales" as any)
    .select("id")
    .eq("appointment_id", appointmentId)
    .maybeSingle();
  if (existing) return (existing as any).id;

  const { data: appt, error: aErr } = await supabase
    .from("appointments")
    .select("id, patient_id, branch_id, doctor_id")
    .eq("id", appointmentId)
    .single();
  if (aErr) throw aErr;

  const { data: prods } = await supabase
    .from("appointment_products")
    .select("*")
    .eq("appointment_id", appointmentId);

  const items = (prods ?? []) as any[];
  const total = items.reduce((s, p) => s + Number(p.precio) * Number(p.cantidad), 0);

  const { data: user } = await supabase.auth.getUser();
  const { data: sale, error: sErr } = await supabase
    .from("sales" as any)
    .insert({
      doctor_id: doctorId,
      branch_id: appt.branch_id ?? null,
      patient_id: appt.patient_id ?? null,
      appointment_id: appointmentId,
      total,
      status: "open",
      created_by: user.user?.id ?? null,
    } as any)
    .select("id")
    .single();
  if (sErr) throw sErr;
  const saleId = (sale as any).id;

  if (items.length > 0) {
    const rows = items.map((p) => ({
      sale_id: saleId,
      product_id: p.product_id ?? null,
      name: p.nombre,
      unit_price: Number(p.precio),
      quantity: Number(p.cantidad),
      subtotal: Number(p.precio) * Number(p.cantidad),
      is_service: false,
    }));
    await supabase.from("sale_items" as any).insert(rows as any);
  }
  return saleId;
}

function mapSale(row: any, items: any[], payments: any[]): Sale {
  return {
    id: row.id,
    doctorId: row.doctor_id,
    branchId: row.branch_id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    total: Number(row.total),
    paid: Number(row.paid),
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      name: i.name,
      unitPrice: Number(i.unit_price),
      quantity: Number(i.quantity),
      subtotal: Number(i.subtotal),
      isService: !!i.is_service,
    })),
    payments: payments.map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount),
      reference: p.reference,
    })),
  };
}

export async function fetchSale(saleId: string): Promise<Sale | null> {
  const { data: row, error } = await supabase.from("sales" as any).select("*").eq("id", saleId).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("sale_items" as any).select("*").eq("sale_id", saleId),
    supabase.from("sale_payments" as any).select("*").eq("sale_id", saleId),
  ]);
  return mapSale(row, (items ?? []) as any[], (payments ?? []) as any[]);
}

export async function fetchSales(filters?: { status?: string; from?: string; to?: string }): Promise<Sale[]> {
  let q = supabase.from("sales" as any).select("*").order("created_at", { ascending: false });
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.from) q = q.gte("created_at", filters.from);
  if (filters?.to) q = q.lte("created_at", filters.to);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const [{ data: items }, { data: payments }] = await Promise.all([
    supabase.from("sale_items" as any).select("*").in("sale_id", ids),
    supabase.from("sale_payments" as any).select("*").in("sale_id", ids),
  ]);
  const itemsBy = new Map<string, any[]>();
  for (const i of (items ?? []) as any[]) {
    const arr = itemsBy.get(i.sale_id) ?? []; arr.push(i); itemsBy.set(i.sale_id, arr);
  }
  const paysBy = new Map<string, any[]>();
  for (const p of (payments ?? []) as any[]) {
    const arr = paysBy.get(p.sale_id) ?? []; arr.push(p); paysBy.set(p.sale_id, arr);
  }
  return rows.map((r) => mapSale(r, itemsBy.get(r.id) ?? [], paysBy.get(r.id) ?? []));
}

export async function updateSaleItems(saleId: string, items: SaleItem[]): Promise<void> {
  await supabase.from("sale_items" as any).delete().eq("sale_id", saleId);
  if (items.length > 0) {
    const rows = items.map((i) => ({
      sale_id: saleId,
      product_id: i.productId ?? null,
      name: i.name,
      unit_price: i.unitPrice,
      quantity: i.quantity,
      subtotal: i.unitPrice * i.quantity,
      is_service: i.isService,
    }));
    const { error } = await supabase.from("sale_items" as any).insert(rows as any);
    if (error) throw error;
  }
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  await supabase.from("sales" as any).update({ total } as any).eq("id", saleId);
}

export async function closeSale(saleId: string, payments: SalePayment[]): Promise<void> {
  await supabase.from("sale_payments" as any).delete().eq("sale_id", saleId);
  if (payments.length > 0) {
    const rows = payments.map((p) => ({
      sale_id: saleId,
      method: p.method,
      amount: p.amount,
      reference: p.reference ?? null,
    }));
    const { error } = await supabase.from("sale_payments" as any).insert(rows as any);
    if (error) throw error;
  }
  const paid = payments.reduce((s, p) => s + p.amount, 0);

  // Discount stock for tracked physical products
  const { data: items } = await supabase.from("sale_items" as any).select("*").eq("sale_id", saleId);
  const doctorId = await getCurrentDoctorId();
  for (const it of (items ?? []) as any[]) {
    if (!it.product_id) continue;
    const { data: prod } = await supabase
      .from("products")
      .select("id, kind, stock, track_inventory")
      .eq("id", it.product_id)
      .maybeSingle();
    if (!prod) continue;
    if ((prod as any).kind === "physical" && (prod as any).track_inventory) {
      const newStock = Number((prod as any).stock) - Number(it.quantity);
      await supabase.from("products").update({ stock: newStock } as any).eq("id", it.product_id);
      if (doctorId) {
        await supabase.from("inventory_movements" as any).insert({
          doctor_id: doctorId,
          product_id: it.product_id,
          qty: Number(it.quantity),
          type: "salida",
          reason: "Venta",
          sale_id: saleId,
        } as any);
      }
    }
  }

  await supabase.from("sales" as any).update({ paid, status: "paid" } as any).eq("id", saleId);
}

export async function cancelSale(saleId: string): Promise<void> {
  await supabase.from("sales" as any).update({ status: "cancelled" } as any).eq("id", saleId);
}

/* ---------- Inventory ---------- */

export async function fetchInventoryMovements(productId?: string): Promise<InventoryMovement[]> {
  let q = supabase.from("inventory_movements" as any).select("*").order("created_at", { ascending: false }).limit(200);
  if (productId) q = q.eq("product_id", productId);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];
  const productIds = [...new Set(rows.map((r) => r.product_id))];
  const { data: prods } = await supabase.from("products").select("id, nombre").in("id", productIds);
  const pm = new Map((prods ?? []).map((p: any) => [p.id, p.nombre]));
  return rows.map((r) => ({
    id: r.id,
    doctorId: r.doctor_id,
    productId: r.product_id,
    productName: pm.get(r.product_id),
    qty: Number(r.qty),
    type: r.type,
    reason: r.reason,
    saleId: r.sale_id,
    createdAt: r.created_at,
  }));
}

export async function createInventoryMovement(input: {
  productId: string;
  qty: number;
  type: "entrada" | "salida" | "ajuste";
  reason?: string;
}): Promise<void> {
  const doctorId = await getCurrentDoctorId();
  if (!doctorId) throw new Error("No doctor");
  const { data: user } = await supabase.auth.getUser();
  const { data: prod } = await supabase
    .from("products")
    .select("stock")
    .eq("id", input.productId)
    .single();
  let newStock = Number(prod?.stock ?? 0);
  if (input.type === "entrada") newStock += input.qty;
  else if (input.type === "salida") newStock -= input.qty;
  else if (input.type === "ajuste") newStock = input.qty;

  const { error: mErr } = await supabase.from("inventory_movements" as any).insert({
    doctor_id: doctorId,
    product_id: input.productId,
    qty: input.qty,
    type: input.type,
    reason: input.reason ?? null,
    created_by: user.user?.id ?? null,
  } as any);
  if (mErr) throw mErr;
  const { error: uErr } = await supabase.from("products").update({ stock: newStock } as any).eq("id", input.productId);
  if (uErr) throw uErr;
}


/* ---------- doctor modules ---------- */

export type DoctorModuleKey =
  | "citas"
  | "pos"
  | "inventario"
  | "monitor"
  | "recordatorios"
  | "reportes"
  | "google_calendar";

export interface DoctorModules {
  doctorId: string;
  citas: boolean;
  pos: boolean;
  inventario: boolean;
  monitor: boolean;
  recordatorios: boolean;
  reportes: boolean;
  googleCalendar: boolean;
}

function rowToModules(r: any): DoctorModules {
  return {
    doctorId: r.doctor_id,
    citas: !!r.citas,
    pos: !!r.pos,
    inventario: !!r.inventario,
    monitor: !!r.monitor,
    recordatorios: !!r.recordatorios,
    reportes: !!r.reportes,
    googleCalendar: !!r.google_calendar,
  };
}

export async function fetchDoctorModules(doctorId: string): Promise<DoctorModules | null> {
  const { data, error } = await supabase
    .from("doctor_modules" as any)
    .select("*")
    .eq("doctor_id", doctorId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToModules(data) : null;
}

export async function fetchCurrentDoctorModules(): Promise<DoctorModules | null> {
  const doctorId = await getCurrentDoctorId();
  if (doctorId) return fetchDoctorModules(doctorId);
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data: staff } = await supabase
    .from("doctor_staff" as any)
    .select("doctor_id")
    .eq("user_id", u.user.id)
    .maybeSingle();
  const sid = (staff as any)?.doctor_id;
  if (!sid) return null;
  return fetchDoctorModules(sid);
}

export async function updateDoctorModules(
  doctorId: string,
  patch: Partial<Omit<DoctorModules, "doctorId">>,
): Promise<void> {
  const row: any = {};
  if (patch.citas !== undefined) row.citas = patch.citas;
  if (patch.pos !== undefined) row.pos = patch.pos;
  if (patch.inventario !== undefined) row.inventario = patch.inventario;
  if (patch.monitor !== undefined) row.monitor = patch.monitor;
  if (patch.recordatorios !== undefined) row.recordatorios = patch.recordatorios;
  if (patch.reportes !== undefined) row.reportes = patch.reportes;
  if (patch.googleCalendar !== undefined) row.google_calendar = patch.googleCalendar;
  const { error } = await supabase
    .from("doctor_modules" as any)
    .update(row)
    .eq("doctor_id", doctorId);
  if (error) throw error;
}

/* ---------- doctor staff ---------- */

export type StaffRole = "recepcion" | "asistente" | "monitor";

export interface DoctorStaff {
  id: string;
  doctorId: string;
  userId: string;
  role: StaffRole;
  fullName?: string;
  email?: string;
}

export async function fetchDoctorStaff(doctorId?: string): Promise<DoctorStaff[]> {
  let q = supabase.from("doctor_staff" as any).select("*");
  if (doctorId) q = q.eq("doctor_id", doctorId);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as any[];
  if (rows.length === 0) return [];
  const userIds = rows.map((r) => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);
  const pm = new Map((profiles ?? []).map((p) => [p.id, p]));
  return rows.map((r) => ({
    id: r.id,
    doctorId: r.doctor_id,
    userId: r.user_id,
    role: r.role,
    fullName: pm.get(r.user_id)?.full_name ?? "",
    email: pm.get(r.user_id)?.email ?? "",
  }));
}

export async function addDoctorStaff(input: { doctorId: string; userId: string; role: StaffRole }): Promise<void> {
  const { error } = await supabase
    .from("doctor_staff" as any)
    .insert({ doctor_id: input.doctorId, user_id: input.userId, role: input.role } as any);
  if (error) throw error;
  await supabase
    .from("user_roles")
    .insert({ user_id: input.userId, role: input.role as any })
    .then(() => {}, () => {});
}

export async function removeDoctorStaff(id: string, userId: string, role: StaffRole): Promise<void> {
  const { error } = await supabase.from("doctor_staff" as any).delete().eq("id", id);
  if (error) throw error;
  await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
}

export async function listAllDoctors(): Promise<{ id: string; displayName: string }[]> {
  const { data, error } = await supabase
    .from("doctors")
    .select("id, display_name")
    .order("display_name");
  if (error) throw error;
  return (data ?? []).map((d: any) => ({ id: d.id, displayName: d.display_name }));
}


/* ---------- Reminders & Notifications (Bloque 7) ---------- */

export interface ReminderSettings {
  doctorId: string;
  enabled: boolean;
  sendDayBefore: boolean;
  sendSameDay: boolean;
  sendHoursBefore: boolean;
  hoursBefore: number;
  sendTime: string;
  whatsappTemplate: string;
}

export interface AppNotification {
  id: string;
  doctorId: string;
  type: string;
  title: string;
  body: string | null;
  payload: any;
  readAt: string | null;
  createdAt: string;
}

const DEFAULT_TEMPLATE = `Hola {paciente}, le escribo con el motivo para confirmar su cita programada para el {fecha} a las {hora} 🗓️

Es importante No presentar tos, gripa y/o fiebre para su atención dental 🤧

🙌 Quedo atenta a su respuesta ✅

En caso de cancelación 🚫 favor de notificarnos 🙏 para reagendar su cita 👩‍💻

{doctor} — {sucursal}`;

export async function fetchReminderSettings(): Promise<ReminderSettings | null> {
  const did = await getCurrentDoctorId();
  if (!did) return null;
  const { data, error } = await supabase
    .from("reminder_settings" as any)
    .select("*")
    .eq("doctor_id", did)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      doctorId: did, enabled: true, sendDayBefore: true, sendSameDay: true,
      sendHoursBefore: true, hoursBefore: 2, sendTime: "08:00",
      whatsappTemplate: DEFAULT_TEMPLATE,
    };
  }
  const r: any = data;
  return {
    doctorId: r.doctor_id,
    enabled: r.enabled,
    sendDayBefore: r.send_day_before,
    sendSameDay: r.send_same_day,
    sendHoursBefore: r.send_hours_before,
    hoursBefore: r.hours_before,
    sendTime: String(r.send_time).slice(0, 5),
    whatsappTemplate: r.whatsapp_template,
  };
}

export async function saveReminderSettings(s: ReminderSettings): Promise<void> {
  const { error } = await supabase.from("reminder_settings" as any).upsert({
    doctor_id: s.doctorId,
    enabled: s.enabled,
    send_day_before: s.sendDayBefore,
    send_same_day: s.sendSameDay,
    send_hours_before: s.sendHoursBefore,
    hours_before: s.hoursBefore,
    send_time: s.sendTime,
    whatsapp_template: s.whatsappTemplate,
  } as any);
  if (error) throw error;
}

export function renderWhatsappTemplate(
  tpl: string,
  vars: { paciente: string; fecha: string; hora: string; doctor: string; sucursal: string }
): string {
  return tpl
    .split("{paciente}", vars.paciente)
    .split("{fecha}", vars.fecha)
    .split("{hora}", vars.hora)
    .split("{doctor}", vars.doctor)
    .split("{sucursal}", vars.sucursal);
}

export function buildWhatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

export async function fetchNotifications(limit = 30): Promise<AppNotification[]> {
  const did = await getCurrentDoctorId();
  if (!did) return [];
  const { data, error } = await supabase
    .from("notifications" as any)
    .select("*")
    .eq("doctor_id", did)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    id: r.id, doctorId: r.doctor_id, type: r.type, title: r.title,
    body: r.body, payload: r.payload, readAt: r.read_at, createdAt: r.created_at,
  }));
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() } as any).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const did = await getCurrentDoctorId();
  if (!did) return;
  await supabase.from("notifications" as any).update({ read_at: new Date().toISOString() } as any).eq("doctor_id", did).is("read_at", null);
}

export async function createNotification(input: { doctorId: string; type: string; title: string; body?: string; payload?: any }): Promise<void> {
  await supabase.from("notifications" as any).insert({
    doctor_id: input.doctorId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    payload: input.payload ?? {},
  } as any);
}
