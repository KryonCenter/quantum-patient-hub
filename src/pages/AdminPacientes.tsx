import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Activity, Package, Calendar, Search, Pencil, Trash2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createPatient, deletePatient, fetchPatients, updatePatient } from "@/lib/api";

const AdminPacientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      setPatients(await fetchPatients());
    } catch (e: any) {
      toast({ title: "Error al cargar pacientes", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      searchQuery === "" ||
      patient.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.telefono.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (filterType === "cuantico") matchesFilter = patient.escaneoQuantico;
    return matchesSearch && matchesFilter;
  });

  const handleSavePatient = async (patientData: Patient | Omit<Patient, "id">) => {
    try {
      if (editingPatient && "id" in patientData) {
        await updatePatient(patientData as Patient);
        toast({ title: "Paciente actualizado", description: "Datos guardados correctamente" });
      } else {
        await createPatient(patientData as Omit<Patient, "id">);
        toast({ title: "Paciente agregado", description: "Registro creado correctamente" });
      }
      setEditingPatient(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDeletePatient = async () => {
    if (!deletingPatientId) return;
    try {
      await deletePatient(deletingPatientId);
      toast({ title: "Paciente eliminado", description: "Registro eliminado" });
      setDeletingPatientId(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) setEditingPatient(null);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = patients.filter((p) => p.fechaRegistro === todayStr).length;

  return (
    <DashboardLayout onNewPatient={() => setIsDialogOpen(true)}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
          <p className="text-muted-foreground">Administra los registros de tus pacientes</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total" value={patients.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Cuántico" value={patients.filter(p => p.escaneoQuantico).length} icon={Activity} colorClass="bg-emerald-100" />
          <StatCard title="Hoy" value={todayCount} icon={Calendar} colorClass="bg-amber-100" />
          <StatCard title="Total" value={patients.length} icon={Calendar} colorClass="bg-primary/10" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, correo o teléfono..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los pacientes</SelectItem>
                  <SelectItem value="cuantico">Con escaneo cuántico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground">Cargando...</CardContent></Card>
        ) : filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {patients.length === 0 ? "No hay pacientes registrados" : "No se encontraron pacientes"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {patients.length === 0 ? "Comienza agregando tu primer paciente" : "Intenta con otros términos de búsqueda"}
                </p>
                {patients.length === 0 && (
                  <Button onClick={() => setIsDialogOpen(true)}>Registrar primer paciente</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <Card key={patient.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{patient.nombre}</h3>
                        <p className="text-sm text-muted-foreground">{patient.correo}</p>
                        {patient.citas && patient.citas.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{patient.citas.filter(c => c.estado === "pendiente").length} cita(s) pendiente(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-2 mr-4">
                        {patient.escaneoQuantico && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                            Escaneo Cuántico
                          </span>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEditPatient(patient)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingPatientId(patient.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PatientDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        onSave={handleSavePatient}
        patient={editingPatient}
      />

      <AlertDialog open={!!deletingPatientId} onOpenChange={(open) => !open && setDeletingPatientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el registro del paciente y todas sus citas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default AdminPacientes;
