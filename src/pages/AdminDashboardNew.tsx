import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, Package, TrendingUp, Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Patient } from "@/lib/types";
import { fetchPatients, fetchProducts } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboardNew = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [doctorCount, setDoctorCount] = useState(0);

  useEffect(() => {
    fetchPatients().then(setPatients).catch(() => {});
    fetchProducts().then((p) => setProductCount(p.length)).catch(() => {});
    supabase.from("doctors").select("id", { count: "exact", head: true }).then(({ count }) => setDoctorCount(count ?? 0));
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = patients.filter((p) => p.fechaRegistro === todayStr).length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthCount = patients.filter((p) => p.fechaRegistro.startsWith(currentMonth)).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Vista global del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Doctores</p><h3 className="text-3xl font-bold text-primary">{doctorCount}</h3></div>
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center"><Stethoscope className="h-6 w-6 text-primary" /></div>
          </CardContent></Card>
          <Card><CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Pacientes</p><h3 className="text-3xl font-bold">{patients.length}</h3></div>
            <Users className="h-12 w-12 text-primary/40" />
          </CardContent></Card>
          <Card><CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Productos/Servicios</p><h3 className="text-3xl font-bold text-blue-700">{productCount}</h3></div>
            <Package className="h-12 w-12 text-blue-400" />
          </CardContent></Card>
          <Card><CardContent className="p-6 flex items-center justify-between">
            <div><p className="text-sm text-muted-foreground">Este mes</p><h3 className="text-3xl font-bold">{monthCount}</h3>
              <p className="text-xs text-muted-foreground mt-1">{todayCount} hoy</p></div>
            <TrendingUp className="h-12 w-12 text-primary/40" />
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Pacientes Recientes</CardTitle><CardDescription>Últimos registros</CardDescription></CardHeader>
          <CardContent>
            {patients.length === 0 ? <p className="text-muted-foreground text-center py-8">No hay pacientes</p> : (
              <div className="space-y-2">
                {patients.slice(0, 8).map((p) => (
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
    </DashboardLayout>
  );
};

export default AdminDashboardNew;
