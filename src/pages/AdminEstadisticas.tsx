import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, Package, Calendar } from "lucide-react";
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
        setPatients(p); setProducts(pr);
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      } finally { setLoading(false); }
    })();
  }, []);

  const allAppts = useMemo(() => patients.flatMap((p) => p.citas ?? []), [patients]);

  const stats = useMemo(() => {
    const now = new Date();
    const tm = now.getMonth(), ty = now.getFullYear();
    const lm = (tm - 1 + 12) % 12;
    const lmy = tm === 0 ? ty - 1 : ty;
    const inMonth = (d: Date, m: number, y: number) => d.getMonth() === m && d.getFullYear() === y;
    const pt = patients.filter((p) => inMonth(new Date(p.fechaRegistro), tm, ty)).length;
    const pl = patients.filter((p) => inMonth(new Date(p.fechaRegistro), lm, lmy)).length;
    const growth = pl === 0 ? (pt > 0 ? 100 : 0) : Math.round(((pt - pl) / pl) * 100);
    const prodSold = allAppts.reduce((a, ap) => a + (ap.productos ?? []).reduce((s, p) => s + p.cantidad, 0), 0);
    return { totalPacientes: patients.length, growth, productosVendidos: prodSold, totalCitas: allAppts.length };
  }, [patients, allAppts]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const buckets: { mes: string; pacientes: number; citas: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ mes: MESES[d.getMonth()], pacientes: 0, citas: 0 });
    }
    const idxOf = (d: Date) => 5 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()));
    for (const p of patients) {
      const i = idxOf(new Date(p.fechaRegistro));
      if (i >= 0 && i < 6) buckets[i].pacientes++;
    }
    for (const a of allAppts) {
      const i = idxOf(new Date(a.fecha));
      if (i >= 0 && i < 6) buckets[i].citas++;
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
    return [...counts.entries()].map(([tipo, n]) => ({ tipo, valor: Math.round((n / total) * 100), color: PAY_COLORS[tipo] ?? "hsl(280, 60%, 55%)" }));
  }, [patients]);

  const weeklyActivity = useMemo(() => {
    const buckets = DIAS.map((dia) => ({ dia, visitas: 0 }));
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    for (const a of allAppts) {
      const d = new Date(a.fecha);
      if (d >= start && d <= now) buckets[d.getDay()].visitas++;
    }
    return [...buckets.slice(1), buckets[0]];
  }, [allAppts]);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">Métricas del sistema</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Pacientes" value={String(stats.totalPacientes)} icon={Users} colorClass="bg-primary/10" subtitle={loading ? "Cargando..." : "Total"} />
          <StatCard title="Crecimiento" value={`${stats.growth >= 0 ? "+" : ""}${stats.growth}%`} icon={TrendingUp} colorClass="bg-emerald-100" subtitle="Mes vs anterior" />
          <StatCard title="Productos/Servicios vendidos" value={String(stats.productosVendidos)} icon={Package} colorClass="bg-blue-100" subtitle="En citas" />
          <StatCard title="Citas" value={String(stats.totalCitas)} icon={Calendar} colorClass="bg-amber-100" subtitle="Acumuladas" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Tendencia (6 meses)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" /><YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="pacientes" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="citas" stroke="hsl(142, 70%, 45%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Distribución de pagos</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {paymentData.length === 0 ? <p className="text-muted-foreground py-12">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={paymentData} cx="50%" cy="50%" label={({ tipo, valor }) => `${tipo}: ${valor}%`} outerRadius={100} dataKey="valor">
                      {paymentData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Actividad semanal</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" /><YAxis />
                  <Tooltip />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground">{products.length} productos/servicios en catálogo</p>
      </div>
    </DashboardLayout>
  );
};

export default AdminEstadisticas;
