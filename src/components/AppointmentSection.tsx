import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Trash2, Clock, Package, Edit, FileText, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import type { Appointment } from "@/lib/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppointmentSectionProps {
  appointments: Appointment[];
  onAppointmentsChange: (appointments: Appointment[]) => void;
}

export function AppointmentSection({ appointments, onAppointmentsChange }: AppointmentSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = (appointment: Appointment | Omit<Appointment, "id">) => {
    if ("id" in appointment) {
      onAppointmentsChange(appointments.map((a) => a.id === appointment.id ? appointment : a));
    } else {
      onAppointmentsChange([...appointments, { ...appointment, id: Date.now().toString() }]);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      onAppointmentsChange(appointments.filter((a) => a.id !== deletingId));
      setDeletingId(null);
    }
  };

  const badge = (estado: Appointment["estado"]) => {
    const v: Record<string, "default" | "secondary" | "destructive"> = {
      pendiente: "default", completada: "secondary", cancelada: "destructive",
    };
    return <Badge variant={v[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Historial de Citas</h3>
        </div>
        <Button onClick={() => { setEditingAppointment(null); setIsDialogOpen(true); }} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />Nueva Cita
        </Button>
      </div>

      {appointments.length > 0 ? (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}><CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium">{apt.fecha}</span></div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{apt.hora}</span></div>
                  {badge(apt.estado)}
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="icon" onClick={() => { setEditingAppointment(apt); setIsDialogOpen(true); }}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setDeletingId(apt.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {apt.motivo && <p className="text-sm text-muted-foreground">{apt.motivo}</p>}
              {apt.branchName && (
                <div className="text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" />{apt.branchName} — {apt.branchAddress}</div>
              )}
              {apt.productos && apt.productos.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4 text-primary" />Productos/Servicios:</div>
                  <div className="ml-6 text-sm text-muted-foreground">
                    {apt.productos.map((p) => <div key={p.id}>• {p.nombre} x{p.cantidad} — ${(p.precio * p.cantidad).toLocaleString()}</div>)}
                  </div>
                </div>
              )}
              {apt.consulta && (apt.consulta.sintomas || apt.consulta.diagnostico) && (
                <div className="border-t pt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-primary" />Consulta:</div>
                  <div className="ml-6 text-sm text-muted-foreground">
                    {apt.consulta.sintomas && <div>• Síntomas: {apt.consulta.sintomas}</div>}
                    {apt.consulta.diagnostico && <div>• Diagnóstico: {apt.consulta.diagnostico}</div>}
                    {apt.consulta.tratamiento && <div>• Tratamiento: {apt.consulta.tratamiento}</div>}
                  </div>
                </div>
              )}
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <Card><CardContent className="p-6 text-center text-muted-foreground">No hay citas registradas.</CardContent></Card>
      )}

      <AppointmentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleSave} appointment={editingAppointment} />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
