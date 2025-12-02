import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Appointment {
  id: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: "pendiente" | "completada" | "cancelada";
}

interface AppointmentSectionProps {
  appointments: Appointment[];
  onAppointmentsChange: (appointments: Appointment[]) => void;
}

export function AppointmentSection({ appointments, onAppointmentsChange }: AppointmentSectionProps) {
  const [newAppointment, setNewAppointment] = useState({
    fecha: "",
    hora: "",
    motivo: "",
  });

  const handleAddAppointment = () => {
    if (newAppointment.fecha && newAppointment.hora) {
      const appointment: Appointment = {
        id: Date.now().toString(),
        ...newAppointment,
        estado: "pendiente",
      };
      onAppointmentsChange([...appointments, appointment]);
      setNewAppointment({ fecha: "", hora: "", motivo: "" });
    }
  };

  const handleDeleteAppointment = (id: string) => {
    onAppointmentsChange(appointments.filter(apt => apt.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    onAppointmentsChange(
      appointments.map(apt =>
        apt.id === id
          ? { ...apt, estado: apt.estado === "pendiente" ? "completada" : "pendiente" }
          : apt
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Seguimiento de Citas</h3>
      </div>

      {/* Lista de citas existentes */}
      {appointments.length > 0 && (
        <div className="space-y-2 mb-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className={apt.estado === "completada" ? "opacity-60" : ""}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{apt.fecha}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{apt.hora}</span>
                    </div>
                    {apt.motivo && (
                      <span className="text-sm text-muted-foreground">- {apt.motivo}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(apt.id)}
                      className={apt.estado === "completada" ? "text-emerald-600" : ""}
                    >
                      {apt.estado === "completada" ? "Completada" : "Pendiente"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAppointment(apt.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulario para nueva cita */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={newAppointment.fecha}
                onChange={(e) => setNewAppointment({ ...newAppointment, fecha: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                value={newAppointment.hora}
                onChange={(e) => setNewAppointment({ ...newAppointment, hora: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Input
                id="motivo"
                placeholder="Revisión, control..."
                value={newAppointment.motivo}
                onChange={(e) => setNewAppointment({ ...newAppointment, motivo: e.target.value })}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleAddAppointment}
            disabled={!newAppointment.fecha || !newAppointment.hora}
            className="mt-4 w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Cita
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
