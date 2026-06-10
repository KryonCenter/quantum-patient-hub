import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Users, Activity, Package, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Patient } from "@/lib/types";
import { fetchPatients, fetchProducts } from "@/lib/api";

const AdminDashboardNew = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    fetchPatients().then(setPatients).catch(() => {});
    fetchProducts().then((p) => setProductCount(p.length)).catch(() => {});
  }, []);

  const cuanticoCount = patients.filter((p) => p.escaneoQuantico).length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = patients.filter((p) => p.fechaRegistro === todayStr).length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthCount = patients.filter((p) => p.fechaRegistro.startsWith(currentMonth)).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Resumen de tu clínica.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Pacientes</p>
                  <h3 className="text-3xl font-bold text-primary">{patients.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Escaneo Cuántico</p>
                  <h3 className="text-3xl font-bold text-emerald-700">{cuanticoCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-200 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Productos</p>
                  <h3 className="text-3xl font-bold text-blue-700">{productCount}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-200 flex items-center justify-center">
                  <Package className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Este Mes</p>
                  <h3 className="text-3xl font-bold text-primary">{monthCount}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{todayCount} hoy</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pacientes Recientes</CardTitle>
            <CardDescription>Últimos registros</CardDescription>
          </CardHeader>
          <CardContent>
            {patients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay pacientes registrados</p>
            ) : (
              <div className="space-y-2">
                {patients.slice(0, 8).map((p) => (
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
    </DashboardLayout>
  );
};

export default AdminDashboardNew;
