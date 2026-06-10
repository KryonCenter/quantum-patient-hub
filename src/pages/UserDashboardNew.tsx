import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Activity, Package, Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientDialog } from "@/components/PatientDialog";
import type { Patient } from "@/lib/types";
import { createPatient, fetchPatients } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const UserDashboardNew = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { fullName, user } = useAuth();

  const load = async () => {
    try { setPatients(await fetchPatients()); } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async (data: Omit<Patient, "id"> | Patient) => {
    try {
      await createPatient(data as Omit<Patient, "id">);
      toast({ title: "Paciente agregado" });
      setIsDialogOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = patients.filter((p) => p.fechaRegistro === todayStr).length;
  const cuanticoCount = patients.filter((p) => p.escaneoQuantico).length;
  const totalCitas = patients.reduce((sum, p) => sum + (p.citas?.length ?? 0), 0);
  const greeting = fullName || user?.email?.split("@")[0] || "Usuario";

  return (
    <DashboardLayout onNewPatient={() => setIsDialogOpen(true)}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hola, {greeting}</h1>
          <p className="text-muted-foreground">Aquí está tu resumen del día.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Pacientes" value={patients.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Hoy" value={todayCount} icon={Calendar} colorClass="bg-amber-100" />
          <StatCard title="Escaneo Cuántico" value={cuanticoCount} icon={Activity} colorClass="bg-emerald-100" />
          <StatCard title="Citas" value={totalCitas} icon={Package} colorClass="bg-blue-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pacientes Recientes</CardTitle>
            <CardDescription>Últimos pacientes registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No hay pacientes registrados</p>
                <Button onClick={() => setIsDialogOpen(true)}>Registrar primer paciente</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {patients.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{p.nombre}</div>
                      <div className="text-sm text-muted-foreground">{p.correo}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{p.fechaRegistro}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PatientDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSave={handleAdd} />
    </DashboardLayout>
  );
};

export default UserDashboardNew;
