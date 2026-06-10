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
  nombre: string;
  telefono: string;
  correo: string;
  tipoPago: string;
  observaciones: string;
  fechaRegistro: string;
  citas?: Appointment[];
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
