import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient, Appointment } from "@/pages/AdminDashboard";
import { useToast } from "@/hooks/use-toast";

const DashboardPacientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Filtrar pacientes basado en búsqueda
  const filteredPatients = patients.filter((patient) =>
    searchQuery === "" || 
    patient.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.correo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.telefono.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSavePatient = (patientData: Omit<Patient, "id">) => {
    if (editingPatient) {
      setPatients(patients.map(p => 
        p.id === editingPatient.id 
          ? { ...patientData, id: editingPatient.id }
          : p
      ));
      toast({
        title: "Paciente actualizado",
        description: "Los datos del paciente han sido actualizados exitosamente",
      });
      setEditingPatient(null);
    } else {
      const newPatient = {
        ...patientData,
        id: Date.now().toString(),
      };
      setPatients([...patients, newPatient]);
      toast({
        title: "Paciente agregado",
        description: "El paciente ha sido registrado exitosamente",
      });
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingPatient(null);
    }
  };

  return (
    <DashboardLayout
      userRole="user"
      userName="Usuario"
      onNewPatient={() => setIsDialogOpen(true)}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mis Pacientes</h1>
          <p className="text-muted-foreground">Administra tus registros de pacientes</p>
        </div>

        {/* Search */}
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

        {/* Patient List or Empty State */}
        {filteredPatients.length === 0 ? (
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
                            <span>
                              {patient.citas.filter(c => c.estado === "pendiente").length} cita(s) pendiente(s)
                            </span>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPatient(patient)}
                      >
                        <Pencil className="h-4 w-4" />
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
    </DashboardLayout>
  );
};

export default DashboardPacientes;
