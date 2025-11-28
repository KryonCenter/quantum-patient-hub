import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Calendar, Activity, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/pages/AdminDashboard";

const UserDashboardNew = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddPatient = (patient: Omit<Patient, "id">) => {
    console.log("New patient:", patient);
    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout
      userRole="user"
      userName="Dr. García"
      onNewPatient={() => setIsDialogOpen(true)}
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Hola, Dr. García</h1>
          <p className="text-muted-foreground">Aquí está tu resumen del día.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Pacientes" value="0" icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Hoy" value="0" icon={Calendar} colorClass="bg-amber-100" />
          <StatCard title="Escaneo Cuántico" value="0" icon={Activity} colorClass="bg-emerald-100" />
          <StatCard title="Productos" value="0" icon={Package} colorClass="bg-blue-100" />
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Ver Pacientes</CardTitle>
                  <CardDescription>Gestiona los registros</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setIsDialogOpen(true)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Package className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Registrar Paciente</CardTitle>
                  <CardDescription>Agregar nuevo registro</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">0</CardTitle>
                  <CardDescription>Esta semana</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos pacientes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground mb-4">No hay pacientes registrados</p>
              <Button onClick={() => setIsDialogOpen(true)}>Registrar primer paciente</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleAddPatient}
      />
    </DashboardLayout>
  );
};

export default UserDashboardNew;
