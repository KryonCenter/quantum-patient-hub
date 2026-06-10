// Shared domain types used across the UI.
// Names are kept in Spanish to match existing components.

export interface AppointmentProduct {
  id: string; // local id in the form (uuid of appointment_products row or local temp id)
  productId?: string | null; // reference to products.id (nullable for free-form items)
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
  fecha: string;          // yyyy-MM-dd
  hora: string;           // HH:mm
  motivo: string;
  estado: AppointmentStatus;
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
  fechaRegistro: string;  // yyyy-MM-dd
  escaneoQuantico: boolean;
  citas?: Appointment[];
}

export interface Product {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
}
