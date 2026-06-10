import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Package, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientDialog } from "@/components/PatientDialog";
import type { Doctor, Patient } from "@/lib/types";
import { createPatient, fetchBranches, fetchCurrentDoctor, fetchPatients, upsertDoctor } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const DoctorDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [branches, setBranches] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const { fullName, user, refreshRole } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    try {
      const d = await fetchCurrentDoctor();
      setDoctor(d);
      if (d) {
        const [p, b] = await Promise.all([fetchPatients(), fetchBranches()]);
        setPatients(p);
        setBranches(b.length);
      }
    } catch {}
  };
  useEffect(() => { load(); }, []);

  const handleCreateProfile = async () => {
    setCreating(true);
    try {
      await upsertDoctor({ displayName: fullName || user?.email || "Doctor/a" });
      await refreshRole();
      await load();
      toast({ title: "Perfil creado", description: "Configura tu marca en Configuración" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

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
  const totalCitas = patients.reduce((s, p) => s + (p.citas?.length ?? 0), 0);
  const greeting = doctor?.displayName || fullName || user?.email?.split("@")[0] || "Doctor/a";

  if (!doctor) {
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Bienvenido/a</CardTitle>
              <CardDescription>Antes de gestionar pacientes, crea tu perfil profesional</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateProfile} disabled={creating} size="lg">
                {creating ? "Creando..." : "Crear mi perfil de doctor/a"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onNewPatient={() => setIsDialogOpen(true)}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Hola, {greeting}</h1>
          <p className="text-muted-foreground">{doctor.specialty || "Tu panel de control"}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Pacientes" value={patients.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Hoy" value={todayCount} icon={Calendar} colorClass="bg-amber-100" />
          <StatCard title="Sucursales" value={branches} icon={Building2} colorClass="bg-emerald-100" />
          <StatCard title="Citas" value={totalCitas} icon={Package} colorClass="bg-blue-100" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-lg" onClick={() => setIsDialogOpen(true)}>
            <CardHeader><CardTitle className="text-lg">Registrar Paciente</CardTitle><CardDescription>Agregar nuevo registro</CardDescription></CardHeader>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg" onClick={() => navigate("/doctor/citas")}>
            <CardHeader><CardTitle className="text-lg">Gestionar Citas</CardTitle><CardDescription>Ver y agregar citas</CardDescription></CardHeader>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg" onClick={() => navigate("/doctor/sucursales")}>
            <CardHeader><CardTitle className="text-lg">Sucursales</CardTitle><CardDescription>Administra tus ubicaciones</CardDescription></CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Pacientes Recientes</CardTitle></CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-4">No hay pacientes</p>
                <Button onClick={() => setIsDialogOpen(true)}>Registrar primer paciente</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {patients.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div><div className="font-medium">{p.nombre}</div><div className="text-sm text-muted-foreground">{p.correo}</div></div>
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

export default DoctorDashboard;
