import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/pages/AdminDashboard";
import { useToast } from "@/hooks/use-toast";

const DashboardPacientes = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { toast } = useToast();

  const handleAddPatient = (patient: Omit<Patient, "id">) => {
    const newPatient = {
      ...patient,
      id: Date.now().toString(),
    };
    setPatients([...patients, newPatient]);
    toast({
      title: "Paciente agregado",
      description: "El paciente ha sido registrado exitosamente",
    });
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
                <Input placeholder="Buscar por nombre, correo o teléfono..." className="pl-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patient List or Empty State */}
        {patients.length === 0 ? (
          <Card>
            <CardContent className="p-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay pacientes registrados</h3>
                <p className="text-muted-foreground mb-6">Comienza agregando tu primer paciente</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {patients.map((patient) => (
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
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {patient.escaneoQuantico && (
                        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">
                          Escaneo Cuántico
                        </span>
                      )}
                      {patient.producto && (
                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                          Producto
                        </span>
                      )}
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
        onOpenChange={setIsDialogOpen}
        onSave={handleAddPatient}
      />
    </DashboardLayout>
  );
};

export default DashboardPacientes;
