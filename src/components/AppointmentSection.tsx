import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Trash2, Clock, Package, Edit, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import type { Appointment } from "@/pages/AdminDashboard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AppointmentSectionProps {
  appointments: Appointment[];
  onAppointmentsChange: (appointments: Appointment[]) => void;
}

export function AppointmentSection({ appointments, onAppointmentsChange }: AppointmentSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null);

  const handleSaveAppointment = (appointment: Appointment | Omit<Appointment, "id">) => {
    if ("id" in appointment) {
      onAppointmentsChange(appointments.map((apt) => (apt.id === appointment.id ? appointment : apt)));
    } else {
      const newAppointment: Appointment = {
        ...appointment,
        id: Date.now().toString(),
      };
      onAppointmentsChange([...appointments, newAppointment]);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleDeleteAppointment = () => {
    if (deletingAppointmentId) {
      onAppointmentsChange(appointments.filter((apt) => apt.id !== deletingAppointmentId));
      setDeletingAppointmentId(null);
    }
  };

  const openAddDialog = () => {
    setEditingAppointment(null);
    setIsDialogOpen(true);
  };

  const getStatusBadge = (estado: Appointment["estado"]) => {
    const variants = {
      pendiente: "default",
      completada: "secondary",
      cancelada: "destructive",
    };
    return <Badge variant={variants[estado] as any}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-lg">Historial de Citas</h3>
        </div>
        <Button onClick={openAddDialog} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      {/* Lista de citas existentes */}
      {appointments.length > 0 ? (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{apt.fecha}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{apt.hora}</span>
                      </div>
                      {getStatusBadge(apt.estado)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAppointment(apt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingAppointmentId(apt.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {apt.motivo && (
                    <p className="text-sm text-muted-foreground">{apt.motivo}</p>
                  )}

                  {apt.productos && apt.productos.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-primary" />
                        Productos/Servicios:
                      </div>
                      <div className="ml-6 space-y-1">
                        {apt.productos.map((prod) => (
                          <div key={prod.id} className="text-sm text-muted-foreground">
                            • {prod.nombre} x{prod.cantidad} - ${(prod.precio * prod.cantidad).toLocaleString()}
                          </div>
                        ))}
                        <div className="text-sm font-semibold pt-1">
                          Total: ${apt.productos.reduce((sum, p) => sum + p.precio * p.cantidad, 0).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {apt.consulta && (apt.consulta.sintomas || apt.consulta.diagnostico || apt.consulta.tratamiento) && (
                    <div className="space-y-1 border-t pt-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <FileText className="h-4 w-4 text-primary" />
                        Información de Consulta:
                      </div>
                      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                        {apt.consulta.sintomas && <div>• Síntomas: {apt.consulta.sintomas}</div>}
                        {apt.consulta.diagnostico && <div>• Diagnóstico: {apt.consulta.diagnostico}</div>}
                        {apt.consulta.tratamiento && <div>• Tratamiento: {apt.consulta.tratamiento}</div>}
                        {apt.consulta.observaciones && <div>• Observaciones: {apt.consulta.observaciones}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No hay citas registradas. Haz clic en "Nueva Cita" para agregar una.
          </CardContent>
        </Card>
      )}

      <AppointmentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveAppointment}
        appointment={editingAppointment}
      />

      <AlertDialog open={!!deletingAppointmentId} onOpenChange={(open) => !open && setDeletingAppointmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta cita del historial del paciente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
