import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Clock, Plus, User, Edit, Trash2, Package, FileText, Building2 } from "lucide-react";
import { AppointmentDialog } from "@/components/AppointmentDialog";
import { AppointmentConfirmationCard } from "@/components/AppointmentConfirmationCard";
import type { Appointment, Doctor, Patient } from "@/lib/types";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { deleteAppointment, fetchCurrentDoctor, fetchPatients, upsertAppointment } from "@/lib/api";

interface AppointmentWithPatient extends Appointment {
  patientId: string;
  patientName: string;
}

export function CitasView({ title }: { title: string }) {
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [editingPatientId, setEditingPatientId] = useState("");
  const [deleting, setDeleting] = useState<{ id: string; patientId: string } | null>(null);
  const [confirmation, setConfirmation] = useState<{ apt: Appointment; patient: Patient } | null>(null);

  const load = async () => {
    try {
      const [p, d] = await Promise.all([fetchPatients(), fetchCurrentDoctor()]);
      setPatients(p);
      setDoctor(d);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  useEffect(() => { load(); }, []);

  const getAll = (): AppointmentWithPatient[] => {
    const all: AppointmentWithPatient[] = [];
    patients.forEach((p) => (p.citas ?? []).forEach((a) => all.push({ ...a, patientId: p.id, patientName: p.nombre })));
    return all.sort((a, b) =>
      new Date(`${a.fecha}T${a.hora || "00:00"}`).getTime() -
      new Date(`${b.fecha}T${b.hora || "00:00"}`).getTime()
    );
  };

  const forDate = (d: Date | undefined) => {
    if (!d) return [];
    const s = format(d, "yyyy-MM-dd");
    return getAll().filter((a) => a.fecha === s);
  };

  const datesWith = () => Array.from(new Set(patients.flatMap((p) => (p.citas ?? []).map((a) => a.fecha))))
    .map((d) => new Date(d + "T00:00:00"));

  const handleSave = async (appointment: Appointment | Omit<Appointment, "id">) => {
    const patientId = editingPatientId || selectedPatientId;
    if (!patientId) {
      toast({ title: "Error", description: "Selecciona un paciente", variant: "destructive" });
      return;
    }
    try {
      const id = await upsertAppointment(patientId, appointment);
      const patient = patients.find((p) => p.id === patientId);
      const isNew = !("id" in appointment);
      toast({ title: isNew ? "Cita agendada" : "Cita actualizada" });
      setSelectedPatientId("");
      setEditingPatientId("");
      await load();
      if (isNew && patient) {
        setConfirmation({ apt: { ...(appointment as Appointment), id }, patient });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleEdit = (apt: AppointmentWithPatient) => {
    setEditingAppointment(apt);
    setEditingPatientId(apt.patientId);
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteAppointment(deleting.id);
      toast({ title: "Cita eliminada" });
      setDeleting(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const badge = (estado: Appointment["estado"]) => {
    const v: Record<string, "default" | "secondary" | "destructive"> = {
      pendiente: "default", completada: "secondary", cancelada: "destructive",
    };
    return <Badge variant={v[estado]}>{estado.charAt(0).toUpperCase() + estado.slice(1)}</Badge>;
  };

  const todayCount = forDate(new Date()).length;
  const all = getAll();
  const upcoming = all.filter((a) => new Date(`${a.fecha}T${a.hora || "00:00"}`) >= new Date() && a.estado === "pendiente");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground">Gestiona las citas de tus pacientes</p>
        </div>
        <Button onClick={() => { setEditingAppointment(null); setEditingPatientId(""); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nueva Cita
        </Button>
      </div>

      {confirmation && (
        <AppointmentConfirmationCard
          appointment={confirmation.apt}
          patient={confirmation.patient}
          doctor={doctor}
          onClose={() => setConfirmation(null)}
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Total</p><h3 className="text-2xl font-bold">{all.length}</h3></div>
          <CalendarIcon className="h-8 w-8 text-primary/50" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Pendientes</p><h3 className="text-2xl font-bold">{upcoming.length}</h3></div>
          <Clock className="h-8 w-8 text-primary/50" />
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between">
          <div><p className="text-sm text-muted-foreground">Hoy</p><h3 className="text-2xl font-bold">{todayCount}</h3></div>
          <User className="h-8 w-8 text-primary/50" />
        </CardContent></Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Calendario</CardTitle>
            <CardDescription>Selecciona una fecha</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={es}
              className="rounded-md border pointer-events-auto"
              modifiers={{ has: datesWith() }}
              modifiersStyles={{ has: { fontWeight: "bold", backgroundColor: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" } }} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Citas del {selectedDate ? format(selectedDate, "d 'de' MMMM, yyyy", { locale: es }) : ""}</CardTitle>
            <CardDescription>{forDate(selectedDate).length} cita(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {forDate(selectedDate).length > 0 ? forDate(selectedDate).map((apt) => (
              <Card key={apt.id} className="bg-muted/30"><CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /><span className="font-medium">{apt.hora}</span></div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4" /><span className="font-medium">{apt.patientName}</span></div>
                    {badge(apt.estado)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(apt)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting({ id: apt.id, patientId: apt.patientId })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {apt.motivo && <p className="text-sm text-muted-foreground">{apt.motivo}</p>}
                {apt.branchName && (
                  <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-primary" />{apt.branchName} — {apt.branchAddress}</div>
                )}
                {apt.productos && apt.productos.length > 0 && (
                  <div className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-primary" />
                    {apt.productos.map((p) => `${p.nombre} x${p.cantidad}`).join(", ")}
                  </div>
                )}
                <Button size="sm" variant="outline" onClick={() => {
                  const patient = patients.find((p) => p.id === apt.patientId);
                  if (patient) setConfirmation({ apt, patient });
                }}>
                  Enviar confirmación
                </Button>
              </CardContent></Card>
            )) : <div className="text-center py-8 text-muted-foreground">No hay citas</div>}
          </CardContent>
        </Card>
      </div>

      {isDialogOpen && !editingAppointment && !editingPatientId && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Seleccionar Paciente</CardTitle>
              <CardDescription>Elige el paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un paciente" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setSelectedPatientId(""); }}>Cancelar</Button>
                <Button disabled={!selectedPatientId} onClick={() => { if (selectedPatientId) setEditingPatientId(selectedPatientId); }}>Continuar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AppointmentDialog
        open={isDialogOpen && (!!editingAppointment || !!editingPatientId)}
        onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); setEditingAppointment(null); setEditingPatientId(""); setSelectedPatientId(""); } }}
        onSave={handleSave}
        appointment={editingAppointment}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
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
