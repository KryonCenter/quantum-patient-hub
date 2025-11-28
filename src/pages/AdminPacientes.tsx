import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Activity, Package, Calendar, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/pages/AdminDashboard";
import { useToast } from "@/hooks/use-toast";

const AdminPacientes = () => {
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
      userRole="admin"
      userName="Administrador"
      onNewPatient={() => setIsDialogOpen(true)}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pacientes</h1>
          <p className="text-muted-foreground">Administra los registros de tus pacientes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-5">
          <StatCard title="Total" value={patients.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard
            title="Cuántico"
            value={patients.filter(p => p.escaneoQuantico).length}
            icon={Activity}
            colorClass="bg-emerald-100"
          />
          <StatCard
            title="Productos"
            value={patients.filter(p => p.producto).length}
            icon={Package}
            colorClass="bg-blue-100"
          />
          <StatCard title="Hoy" value="0" icon={Calendar} colorClass="bg-amber-100" />
          <StatCard title="Este Mes" value={patients.length} icon={Calendar} colorClass="bg-primary/10" />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nombre, correo o teléfono..." className="pl-10" />
              </div>
              <Select defaultValue="todos">
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los pacientes</SelectItem>
                  <SelectItem value="cuantico">Con escaneo cuántico</SelectItem>
                  <SelectItem value="productos">Con productos</SelectItem>
                </SelectContent>
              </Select>
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

export default AdminPacientes;
