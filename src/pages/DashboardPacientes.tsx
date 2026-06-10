import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, Clock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { createPatient, deletePatient, fetchPatients, updatePatient } from "@/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DashboardPacientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      setPatients(await fetchPatients());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const filteredPatients = patients.filter((p) =>
    searchQuery === "" ||
    p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.telefono.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSavePatient = async (patientData: Patient | Omit<Patient, "id">) => {
    try {
      if (editingPatient && "id" in patientData) {
        await updatePatient(patientData as Patient);
        toast({ title: "Paciente actualizado", description: "Datos guardados" });
      } else {
        await createPatient(patientData as Omit<Patient, "id">);
        toast({ title: "Paciente agregado", description: "Registro creado" });
      }
      setEditingPatient(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deletingPatientId) return;
    try {
      await deletePatient(deletingPatientId);
      toast({ title: "Paciente eliminado" });
      setDeletingPatientId(null);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout onNewPatient={() => setIsDialogOpen(true)}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Pacientes</h1>
          <p className="text-muted-foreground">Administra tus registros de pacientes</p>
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
                  {patients.length === 0 ? "Comienza agregando tu primer paciente" : "Intenta con otros términos"}
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
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
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
                      {patient.escaneoQuantico && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm mr-2">
                          Escaneo Cuántico
                        </span>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => { setEditingPatient(patient); setIsDialogOpen(true); }}>
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
        onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingPatient(null); }}
        onSave={handleSavePatient}
        patient={editingPatient}
      />

      <AlertDialog open={!!deletingPatientId} onOpenChange={(open) => !open && setDeletingPatientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardPacientes;
