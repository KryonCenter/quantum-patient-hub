import { supabase } from "@/integrations/supabase/client";
import type {
  Appointment,
  AppointmentProduct,
  Patient,
  Product,
} from "@/lib/types";

/* ---------- helpers ---------- */

const emptyConsulta = () => ({
  sintomas: "",
  diagnostico: "",
  tratamiento: "",
  observaciones: "",
});

function rowToAppointment(row: any, products: any[] = []): Appointment {
  return {
    id: row.id,
    fecha: row.fecha,
    hora: row.hora ? String(row.hora).slice(0, 5) : "",
    motivo: row.motivo ?? "",
    estado: row.estado,
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
  return {
    id: row.id,
    nombre: row.nombre,
    telefono: row.telefono ?? "",
    correo: row.correo ?? "",
    tipoPago: row.tipo_pago ?? "",
    observaciones: row.observaciones ?? "",
    fechaRegistro: row.fecha_registro,
    escaneoQuantico: row.escaneo_quantico,
    citas: appointments,
  };
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

  const { data: appts, error: aErr } = await supabase
    .from("appointments")
    .select("*")
    .in("patient_id", ids);
  if (aErr) throw aErr;

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
    list.push(rowToAppointment(a, byAppt.get(a.id) ?? []));
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
  const { data: row, error } = await supabase
    .from("patients")
    .insert({
      nombre: data.nombre,
      telefono: data.telefono,
      correo: data.correo,
      tipo_pago: data.tipoPago,
      observaciones: data.observaciones,
      escaneo_quantico: data.escaneoQuantico,
      fecha_registro: data.fechaRegistro,
      created_by: user.user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;

  // Sync appointments if provided
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
      telefono: patient.telefono,
      correo: patient.correo,
      tipo_pago: patient.tipoPago,
      observaciones: patient.observaciones,
      escaneo_quantico: patient.escaneoQuantico,
      fecha_registro: patient.fechaRegistro,
    })
    .eq("id", patient.id);
  if (error) throw error;

  // Sync citas: fetch existing, delete removed, upsert provided
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

  const payload = {
    patient_id: patientId,
    fecha: appt.fecha,
    hora: appt.hora || null,
    motivo: appt.motivo,
    estado: appt.estado,
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
      .insert({ ...payload, created_by: user.user?.id ?? null })
      .select("id")
      .single();
    if (error) throw error;
    apptId = row.id;
  }

  // Reset products for this appointment
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
  return (data ?? []).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    descripcion: r.descripcion ?? "",
    precio: Number(r.precio),
    stock: r.stock,
  }));
}

export async function createProduct(p: Omit<Product, "id">): Promise<Product> {
  const { data, error } = await supabase
    .from("products")
    .insert({
      nombre: p.nombre,
      descripcion: p.descripcion,
      precio: p.precio,
      stock: p.stock,
    })
    .select("*")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion ?? "",
    precio: Number(data.precio),
    stock: data.stock,
  };
}
