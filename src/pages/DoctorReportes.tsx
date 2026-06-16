import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchSales, fetchBranches } from "@/lib/api";
import type { Sale, Branch, PaymentMethod } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, CreditCard } from "lucide-react";

type Preset = "week" | "fortnight" | "month" | "custom";

const METHOD_COLORS: Record<PaymentMethod, string> = {
  efectivo: "hsl(142, 70%, 45%)",
  transferencia: "hsl(217, 70%, 55%)",
  tarjeta: "hsl(280, 60%, 55%)",
};

const METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

function isoDate(d: Date) { return d.toISOString().slice(0, 10); }

function rangeForPreset(preset: Preset): { from: string; to: string } {
  const now = new Date();
  const to = isoDate(now);
  const start = new Date(now);
  if (preset === "week") start.setDate(now.getDate() - 6);
  else if (preset === "fortnight") start.setDate(now.getDate() - 14);
  else start.setDate(now.getDate() - 29);
  return { from: isoDate(start), to };
}

const DoctorReportes = () => {
  const { toast } = useToast();
  const [preset, setPreset] = useState<Preset>("week");
  const initial = rangeForPreset("week");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [branchId, setBranchId] = useState<string>("all");
  const [method, setMethod] = useState<string>("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches().then(setBranches).catch(() => setBranches([]));
  }, []);

  const load = async (f = from, t = to) => {
    setLoading(true);
    try {
      const data = await fetchSales({
        status: "paid",
        from: `${f}T00:00:00`,
        to: `${t}T23:59:59`,
      });
      setSales(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const onPreset = (p: Preset) => {
    setPreset(p);
    if (p !== "custom") {
      const r = rangeForPreset(p);
      setFrom(r.from); setTo(r.to);
      load(r.from, r.to);
    }
  };

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (branchId !== "all" && s.branchId !== branchId) return false;
      if (method !== "all" && !s.payments.some((p) => p.method === method)) return false;
      return true;
    });
  }, [sales, branchId, method]);

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, s) => sum + s.total, 0);
    const count = filtered.length;
    const avg = count > 0 ? total / count : 0;
    const byMethod: Record<string, number> = { efectivo: 0, transferencia: 0, tarjeta: 0 };
    for (const s of filtered) {
      for (const p of s.payments) byMethod[p.method] = (byMethod[p.method] ?? 0) + p.amount;
    }
    return { total, count, avg, byMethod };
  }, [filtered]);

  const dailyData = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of filtered) {
      const d = (s.createdAt ?? "").slice(0, 10);
      map.set(d, (map.get(d) ?? 0) + s.total);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([fecha, total]) => ({ fecha, total }));
  }, [filtered]);

  const pieData = useMemo(
    () => (["efectivo", "transferencia", "tarjeta"] as PaymentMethod[])
      .map((m) => ({ name: METHOD_LABEL[m], value: Math.round(stats.byMethod[m] ?? 0), color: METHOD_COLORS[m] }))
      .filter((d) => d.value > 0),
    [stats]
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reportes de ventas</h1>
          <p className="text-muted-foreground">Ingresos por periodo, sucursal y método de pago</p>
        </div>

        <Card>
          <CardContent className="pt-6 grid gap-4 md:grid-cols-5">
            <div>
              <Label>Periodo</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {(["week", "fortnight", "month", "custom"] as Preset[]).map((p) => (
                  <Button key={p} size="sm" variant={preset === p ? "default" : "outline"} onClick={() => onPreset(p)}>
                    {p === "week" ? "Semana" : p === "fortnight" ? "Quincena" : p === "month" ? "Mes" : "Personalizado"}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Desde</Label>
              <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} />
            </div>
            <div>
              <Label>Sucursal</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Método</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-5">
              <Button onClick={() => load()} disabled={loading}>{loading ? "Cargando..." : "Aplicar"}</Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
              <div><p className="text-xs text-muted-foreground">Ingresos</p><p className="text-2xl font-bold">${stats.total.toFixed(2)}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-emerald-700" /></div>
              <div><p className="text-xs text-muted-foreground">Ventas</p><p className="text-2xl font-bold">{stats.count}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-blue-700" /></div>
              <div><p className="text-xs text-muted-foreground">Ticket promedio</p><p className="text-2xl font-bold">${stats.avg.toFixed(2)}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center"><CreditCard className="h-5 w-5 text-amber-700" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Por método</p>
                <p className="text-xs">Ef ${stats.byMethod.efectivo?.toFixed(0) ?? 0} · Tr ${stats.byMethod.transferencia?.toFixed(0) ?? 0} · Tj ${stats.byMethod.tarjeta?.toFixed(0) ?? 0}</p>
              </div>
            </div>
          </CardContent></Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Ingresos por día</CardTitle></CardHeader>
            <CardContent>
              {dailyData.length === 0 ? <p className="text-muted-foreground py-12 text-center">Sin ventas en el periodo</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="fecha" /><YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Distribución por método de pago</CardTitle></CardHeader>
            <CardContent className="flex items-center justify-center">
              {pieData.length === 0 ? <p className="text-muted-foreground py-12">Sin datos</p> : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: $${value}`}>
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Ventas ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Ítems</TableHead>
                  <TableHead>Métodos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Sin ventas</TableCell></TableRow>
                ) : filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{(s.createdAt ?? "").slice(0, 16).replace("T", " ")}</TableCell>
                    <TableCell>{branches.find((b) => b.id === s.branchId)?.name ?? "—"}</TableCell>
                    <TableCell>{s.items.length}</TableCell>
                    <TableCell className="text-xs">{s.payments.map((p) => `${METHOD_LABEL[p.method]} $${p.amount}`).join(" + ") || "—"}</TableCell>
                    <TableCell className="text-right font-medium">${s.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorReportes;
