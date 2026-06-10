import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Calendar, Clock, MapPin, Stethoscope, Package } from "lucide-react";
import type { Appointment, Doctor, Patient } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Props {
  appointment: Appointment;
  patient: Patient;
  doctor: Doctor | null;
  onClose: () => void;
}

export function AppointmentConfirmationCard({ appointment, patient, doctor, onClose }: Props) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const productList = (appointment.productos || [])
    .map((p) => `${p.nombre} x${p.cantidad}`)
    .join(", ") || "—";

  const message = [
    `Hola ${patient.nombre},`,
    ``,
    `Tu cita está confirmada:`,
    `📅 Fecha: ${appointment.fecha}`,
    `🕐 Hora: ${appointment.hora}`,
    `📝 Motivo: ${appointment.motivo}`,
    `💊 Servicio/Producto: ${productList}`,
    appointment.branchName ? `🏥 Sucursal: ${appointment.branchName}` : "",
    appointment.branchAddress ? `📍 Dirección: ${appointment.branchAddress}` : "",
    doctor?.displayName ? `👨‍⚕️ Doctor/a: ${doctor.displayName}` : "",
    ``,
    `¡Te esperamos!`,
  ].filter(Boolean).join("\n");

  const sendWhatsApp = () => {
    if (!patient.telefono) {
      toast({ title: "Sin teléfono", description: "El paciente no tiene teléfono registrado", variant: "destructive" });
      return;
    }
    const phone = patient.telefono.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const sendEmail = async () => {
    if (!patient.correo) {
      toast({ title: "Sin correo", description: "El paciente no tiene correo", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.functions.invoke("send-appointment-email", {
      body: {
        to: patient.correo,
        patientName: patient.nombre,
        doctorName: doctor?.displayName ?? "Tu doctor",
        date: appointment.fecha,
        time: appointment.hora,
        reason: appointment.motivo,
        products: productList,
        branchName: appointment.branchName,
        branchAddress: appointment.branchAddress,
        brandColor: doctor?.brandColor ?? "#10b981",
        logoUrl: doctor?.logoUrl ?? null,
      },
    });
    setSending(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Correo enviado", description: `Cita enviada a ${patient.correo}` });
    }
  };

  return (
    <Card className="border-2" style={{ borderColor: doctor?.brandColor ?? "hsl(var(--primary))" }}>
      <CardHeader style={{ backgroundColor: (doctor?.brandColor ?? "#10b981") + "1A" }}>
        <CardTitle className="flex items-center gap-2">
          {doctor?.logoUrl && <img src={doctor.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />}
          Cita confirmada
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><b>Fecha:</b> {appointment.fecha}</div>
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /><b>Hora:</b> {appointment.hora}</div>
          <div><b>Paciente:</b> {patient.nombre}</div>
          <div><b>Motivo:</b> {appointment.motivo || "—"}</div>
          <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><b>Servicio/Producto:</b> {productList}</div>
          {doctor?.displayName && (
            <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /><b>Doctor/a:</b> {doctor.displayName}</div>
          )}
          {appointment.branchName && (
            <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div><b>{appointment.branchName}</b><br />{appointment.branchAddress}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button onClick={sendEmail} disabled={sending} className="bg-primary hover:bg-primary/90">
            <Mail className="mr-2 h-4 w-4" />
            {sending ? "Enviando..." : "Enviar por correo"}
          </Button>
          <Button onClick={sendWhatsApp} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
            <MessageCircle className="mr-2 h-4 w-4" />
            Enviar por WhatsApp
          </Button>
          <Button onClick={onClose} variant="ghost" className="ml-auto">Cerrar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
