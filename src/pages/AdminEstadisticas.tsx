import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, Package, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import { fetchPatients, fetchProducts } from "@/lib/api";
import type { Patient, Product } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const PAY_COLORS: Record<string, string> = {
  Efectivo: "hsl(var(--primary))",
  Tarjeta: "hsl(142, 70%, 45%)",
  Transferencia: "hsl(217, 70%, 55%)",
  Otro: "hsl(38, 90%, 55%)",
};

const AdminEstadisticas = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [p, pr] = await Promise.all([fetchPatients(), fetchProducts()]);
        setPatients(p);
        setProducts(pr);
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allAppts = useMemo(
    () => patients.flatMap((p) => (p.citas ?? []).map((c) => ({ ...c, patient: p }))),
    [patients],
  );

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = (thisMonth - 1 + 12) % 12;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const inMonth = (d: Date, m: number, y: number) =>
      d.getMonth() === m && d.getFullYear() === y;

    const patThis = patients.filter((p) =>
      inMonth(new Date(p.fechaRegistro), thisMonth, thisYear),
    ).length;
    const patLast = patients.filter((p) =>
      inMonth(new Date(p.fechaRegistro), lastMonth, lastMonthYear),
    ).length;
    const growth = patLast === 0 ? (patThis > 0 ? 100 : 0) : Math.round(((patThis - patLast) / patLast) * 100);

    const prodSold = allAppts.reduce(
      (acc, a) => acc + (a.productos ?? []).reduce((s, p) => s + (p.cantidad ?? 0), 0),
      0,
    );
    const escaneos = patients.filter((p) => p.escaneoQuantico).length;

    return {
      totalPacientes: patients.length,
      growth,
      productosVendidos: prodSold,
      escaneos,
    };
  }, [patients, allAppts]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets: { mes: string; pacientes: number; productos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ mes: MESES[d.getMonth()], pacientes: 0, productos: 0 });
    }
    const idxOf = (date: Date) => {
      const diff =
        (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
      return 5 - diff;
    };
    for (const p of patients) {
      const i = idxOf(new Date(p.fechaRegistro));
      if (i >= 0 && i < 6) buckets[i].pacientes++;
    }
    for (const a of allAppts) {
      const i = idxOf(new Date(a.fecha));
      if (i >= 0 && i < 6) {
        buckets[i].productos += (a.productos ?? []).reduce((s, p) => s + (p.cantidad ?? 0), 0);
      }
    }
    return buckets;
  }, [patients, allAppts]);

  const paymentData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of patients) {
      const k = (p.tipoPago || "Otro").trim() || "Otro";
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
    return [...counts.entries()].map(([tipo, n]) => ({
      tipo,
      valor: Math.round((n / total) * 100),
      color: PAY_COLORS[tipo] ?? "hsl(280, 60%, 55%)",
    }));
  }, [patients]);

  const weeklyActivity = useMemo(() => {
    const buckets = DIAS.map((dia) => ({ dia, visitas: 0 }));
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    for (const a of allAppts) {
      const d = new Date(a.fecha);
      if (d >= start && d <= now) buckets[d.getDay()].visitas++;
    }
    // Rotate to start at Lun
    return [...buckets.slice(1), buckets[0]];
  }, [allAppts]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">Análisis y métricas del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Pacientes" value={String(stats.totalPacientes)} icon={Users} colorClass="bg-primary/10" subtitle={loading ? "Cargando..." : "Registrados"} />
          <StatCard title="Crecimiento" value={`${stats.growth >= 0 ? "+" : ""}${stats.growth}%`} icon={TrendingUp} colorClass="bg-emerald-100" subtitle="Este mes vs anterior" />
          <StatCard title="Productos Vendidos" value={String(stats.productosVendidos)} icon={Package} colorClass="bg-blue-100" subtitle="En citas" />
          <StatCard title="Escaneos Cuánticos" value={String(stats.escaneos)} icon={Activity} colorClass="bg-amber-100" subtitle="Pacientes activos" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Tendencia (últimos 6 meses)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Line type="monotone" dataKey="pacientes" stroke="hsl(var(--primary))" strokeWidth={2} name="Pacientes" />
                  <Line type="monotone" dataKey="productos" stroke="hsl(142, 70%, 45%)" strokeWidth={2} name="Productos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Distribución de Pagos</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {paymentData.length === 0 ? (
                <p className="text-muted-foreground py-12">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" labelLine={false}
                      label={({ tipo, valor }) => `${tipo}: ${valor}%`}
                      outerRadius={100} dataKey="valor">
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Actividad Semanal (citas)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">
          {products.length} productos en catálogo
        </p>
      </div>
    </DashboardLayout>
  );
};

export default AdminEstadisticas;
