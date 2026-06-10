import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Calendar, Search, Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createPatient, deletePatient, fetchPatients, updatePatient } from "@/lib/api";

const AdminPacientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try { setPatients(await fetchPatients()); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const filtered = patients.filter((p) =>
    searchQuery === "" ||
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.telefono.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (data: Patient | Omit<Patient, "id">) => {
    try {
      if (editing && "id" in data) {
        await updatePatient(data as Patient);
        toast({ title: "Actualizado" });
      } else {
        await createPatient(data as Omit<Patient, "id">);
        toast({ title: "Agregado" });
      }
      setEditing(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deletePatient(deletingId);
      toast({ title: "Eliminado" });
      setDeletingId(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = patients.filter((p) => p.fechaRegistro === todayStr).length;

  return (
    <DashboardLayout onNewPatient={() => setIsDialogOpen(true)}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Pacientes</h1>
          <p className="text-muted-foreground">Administra tus pacientes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total" value={patients.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Hoy" value={todayCount} icon={Calendar} colorClass="bg-amber-100" />
          <StatCard title="Con citas pendientes" value={patients.filter((p) => (p.citas ?? []).some((c) => c.estado === "pendiente")).length} icon={Clock} colorClass="bg-emerald-100" />
        </div>

        <Card><CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, correo o teléfono..." className="pl-10"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardContent></Card>

        {loading ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Cargando...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-12 flex flex-col items-center text-center">
            <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">{patients.length === 0 ? "Sin pacientes" : "Sin resultados"}</h3>
            {patients.length === 0 && <Button onClick={() => setIsDialogOpen(true)}>Registrar primer paciente</Button>}
          </CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <Card key={p.id}><CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-6 w-6 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold">{p.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{p.correo} • {p.telefono}</p>
                    {p.citas && p.citas.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {p.citas.filter((c) => c.estado === "pendiente").length} cita(s) pendiente(s)
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(p); setIsDialogOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingId(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>

      <PatientDialog open={isDialogOpen}
        onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditing(null); }}
        onSave={handleSave} patient={editing} />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>Acción irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminPacientes;
