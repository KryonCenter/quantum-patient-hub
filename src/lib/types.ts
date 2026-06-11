// Shared domain types used across the UI.

export interface AppointmentProduct {
  id: string;
  productId?: string | null;
  nombre: string;
  precio: number;
  cantidad: number;
}

export interface ConsultationInfo {
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
}

export type AppointmentStatus = "pendiente" | "completada" | "cancelada";

export interface Appointment {
  id: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: AppointmentStatus;
  branchId?: string | null;
  branchName?: string | null;
  branchAddress?: string | null;
  productos: AppointmentProduct[];
  consulta: ConsultationInfo;
}

export interface Patient {
  id: string;
  nombre: string; // display (computed)
  firstName: string;
  lastNamePaterno: string;
  lastNameMaterno: string;
  telefono: string;
  correo: string;
  tipoPago: string;
  observaciones: string;
  fechaRegistro: string;
  birthDate?: string | null;
  locality?: string | null;
  guardianPatientId?: string | null;
  guardianFirstName?: string | null;
  guardianLastNamePaterno?: string | null;
  guardianLastNameMaterno?: string | null;
  citas?: Appointment[];
}

export interface BranchRoom {
  id: string;
  branchId: string;
  doctorId: string;
  name: string;
  assignedDoctorId?: string | null;
}

export function fullName(p: { firstName?: string; lastNamePaterno?: string; lastNameMaterno?: string; nombre?: string }): string {
  const parts = [p.firstName, p.lastNamePaterno, p.lastNameMaterno].filter(Boolean).join(" ").trim();
  return parts || p.nombre || "";
}

export function ageFromBirth(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export type ProductKind = "service" | "physical";

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  kind: ProductKind;
}

export interface Doctor {
  id: string;
  userId: string;
  displayName: string;
  specialty: string | null;
  logoUrl: string | null;
  brandColor: string;
  whatsappPhone: string | null;
  googleCalendarConnected: boolean;
}

export interface Branch {
  id: string;
  doctorId: string;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  isPrimary: boolean;
}
