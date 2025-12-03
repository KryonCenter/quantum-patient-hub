import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Plus, User, Edit, Trash2, Package, FileText } from "lucide-react";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import type { Patient, Appointment } from "@/pages/AdminDashboard";
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
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AppointmentWithPatient extends Appointment {
  patientId: string;
  patientName: string;
}

const AdminCitas = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string>("");
  const [deletingAppointment, setDeletingAppointment] = useState<{ id: string; patientId: string } | null>(null);

  // Load patients from localStorage
  useEffect(() => {
    const savedPatients = localStorage.getItem("patients");
    if (savedPatients) {
      setPatients(JSON.parse(savedPatients));
    }
  }, []);

  // Get all appointments with patient info
  const getAllAppointments = (): AppointmentWithPatient[] => {
    const allAppointments: AppointmentWithPatient[] = [];
    patients.forEach((patient) => {
      if (patient.citas) {
        patient.citas.forEach((apt) => {
          allAppointments.push({
            ...apt,
            patientId: patient.id,
            patientName: patient.nombre,
          });
        });
      }
    });
    return allAppointments.sort((a, b) => {
      const dateA = new Date(`${a.fecha}T${a.hora}`);
      const dateB = new Date(`${b.fecha}T${b.hora}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  // Get appointments for selected date
  const getAppointmentsForDate = (date: Date | undefined): AppointmentWithPatient[] => {
    if (!date) return [];
    const dateStr = format(date, "yyyy-MM-dd");
    return getAllAppointments().filter((apt) => apt.fecha === dateStr);
  };

  // Get dates with appointments for calendar highlighting
  const getDatesWithAppointments = (): Date[] => {
    const dates = new Set<string>();
    patients.forEach((patient) => {
      if (patient.citas) {
        patient.citas.forEach((apt) => {
          dates.add(apt.fecha);
        });
      }
    });
    return Array.from(dates).map((d) => new Date(d + "T00:00:00"));
  };

  const handleSaveAppointment = (appointment: Appointment | Omit<Appointment, "id">) => {
    const patientId = editingPatientId || selectedPatientId;
    if (!patientId) {
      toast({
        title: "Error",
        description: "Selecciona un paciente primero",
        variant: "destructive",
      });
      return;
    }

    const updatedPatients = patients.map((patient) => {
      if (patient.id === patientId) {
        const currentAppointments = patient.citas || [];
        if ("id" in appointment) {
          // Editing existing appointment
          return {
            ...patient,
            citas: currentAppointments.map((apt) =>
              apt.id === appointment.id ? appointment : apt
            ),
          };
        } else {
          // Adding new appointment
          const newAppointment: Appointment = {
            ...appointment,
            id: Date.now().toString(),
          };
          return {
            ...patient,
            citas: [...currentAppointments, newAppointment],
          };
        }
      }
      return patient;
    });

    setPatients(updatedPatients);
    localStorage.setItem("patients", JSON.stringify(updatedPatients));

    toast({
      title: "id" in appointment ? "Cita actualizada" : "Cita agendada",
      description: "id" in appointment
        ? "La cita ha sido actualizada exitosamente"
        : "La cita ha sido agendada exitosamente",
    });

    setSelectedPatientId("");
    setEditingPatientId("");
  };

  const handleEditAppointment = (apt: AppointmentWithPatient) => {
    setEditingAppointment(apt);
    setEditingPatientId(apt.patientId);
    setIsDialogOpen(true);
  };

  const handleDeleteAppointment = () => {
    if (!deletingAppointment) return;

    const updatedPatients = patients.map((patient) => {
      if (patient.id === deletingAppointment.patientId) {
        return {
          ...patient,
          citas: (patient.citas || []).filter((apt) => apt.id !== deletingAppointment.id),
        };
      }
      return patient;
    });

    setPatients(updatedPatients);
    localStorage.setItem("patients", JSON.stringify(updatedPatients));

    toast({
      title: "Cita eliminada",
      description: "La cita ha sido eliminada exitosamente",
    });

    setDeletingAppointment(null);
  };

  const openAddDialog = () => {
    setEditingAppointment(null);
    setEditingPatientId("");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (estado: Appointment["estado"]) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pendiente: "default",
      completada: "secondary",
      cancelada: "destructive",
    };
    return <Badge variant={variants[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>;
  };

  const appointmentsForSelectedDate = getAppointmentsForDate(selectedDate);
  const allAppointments = getAllAppointments();
  const upcomingAppointments = allAppointments.filter(
    (apt) => new Date(`${apt.fecha}T${apt.hora}`) >= new Date() && apt.estado === "pendiente"
  );

  return (
    <DashboardLayout userRole="admin" userName="Administrador">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Calendario de Citas</h1>
            <p className="text-muted-foreground">Gestiona las citas de tus pacientes</p>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cita
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Citas</p>
                  <h3 className="text-2xl font-bold">{allAppointments.length}</h3>
                </div>
                <CalendarIcon className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                  <h3 className="text-2xl font-bold">{upcomingAppointments.length}</h3>
                </div>
                <Clock className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Hoy</p>
                  <h3 className="text-2xl font-bold">
                    {getAppointmentsForDate(new Date()).length}
                  </h3>
                </div>
                <User className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Calendar */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Calendario
              </CardTitle>
              <CardDescription>Selecciona una fecha para ver las citas</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasAppointment: getDatesWithAppointments(),
                }}
                modifiersStyles={{
                  hasAppointment: {
                    fontWeight: "bold",
                    backgroundColor: "hsl(var(--primary) / 0.1)",
                    color: "hsl(var(--primary))",
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Appointments for selected date */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                Citas del {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : "día"}
              </CardTitle>
              <CardDescription>
                {appointmentsForSelectedDate.length} cita(s) programada(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {appointmentsForSelectedDate.length > 0 ? (
                appointmentsForSelectedDate.map((apt) => (
                  <Card key={apt.id} className="bg-muted/30">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{apt.hora}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{apt.patientName}</span>
                            </div>
                            {getStatusBadge(apt.estado)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditAppointment(apt)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeletingAppointment({ id: apt.id, patientId: apt.patientId })}
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
                              Productos:
                            </div>
                            <div className="ml-6 text-sm text-muted-foreground">
                              {apt.productos.map((prod) => (
                                <span key={prod.id} className="mr-2">
                                  {prod.nombre} x{prod.cantidad}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {apt.consulta && (apt.consulta.sintomas || apt.consulta.diagnostico) && (
                          <div className="space-y-1 border-t pt-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <FileText className="h-4 w-4 text-primary" />
                              Consulta:
                            </div>
                            <div className="ml-6 text-sm text-muted-foreground">
                              {apt.consulta.sintomas && <div>Síntomas: {apt.consulta.sintomas}</div>}
                              {apt.consulta.diagnostico && <div>Diagnóstico: {apt.consulta.diagnostico}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay citas programadas para esta fecha
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Citas</CardTitle>
            <CardDescription>Citas pendientes ordenadas por fecha</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 10).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <div className="text-sm font-bold text-primary">
                          {format(new Date(apt.fecha + "T00:00:00"), "dd", { locale: es })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(apt.fecha + "T00:00:00"), "MMM", { locale: es })}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{apt.patientName}</div>
                        <div className="text-sm text-muted-foreground">
                          {apt.hora} - {apt.motivo || "Sin motivo especificado"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(apt.estado)}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAppointment(apt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay citas pendientes
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Appointment Dialog with Patient Selection */}
      {isDialogOpen && !editingAppointment && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Seleccionar Paciente</CardTitle>
              <CardDescription>Elige el paciente para la nueva cita</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!selectedPatientId}
                  onClick={() => {
                    if (selectedPatientId) {
                      setEditingPatientId(selectedPatientId);
                    }
                  }}
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appointment Dialog for editing or after patient selection */}
      <AppointmentDialog
        open={isDialogOpen && (!!editingAppointment || !!editingPatientId)}
        onOpenChange={(open) => {
          if (!open) {
            setIsDialogOpen(false);
            setEditingAppointment(null);
            setEditingPatientId("");
            setSelectedPatientId("");
          }
        }}
        onSave={handleSaveAppointment}
        appointment={editingAppointment}
      />

      <AlertDialog open={!!deletingAppointment} onOpenChange={(open) => !open && setDeletingAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente esta cita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminCitas;
