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
  };
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
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

