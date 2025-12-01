import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, TrendingUp, Package, Activity, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const AdminEstadisticas = () => {
  const monthlyData = [
    { mes: "Ene", pacientes: 45, productos: 23 },
    { mes: "Feb", pacientes: 52, productos: 31 },
    { mes: "Mar", pacientes: 61, productos: 28 },
    { mes: "Abr", pacientes: 58, productos: 35 },
    { mes: "May", pacientes: 70, productos: 42 },
    { mes: "Jun", pacientes: 65, productos: 38 },
  ];

  const paymentData = [
    { tipo: "Efectivo", valor: 45, color: "hsl(var(--primary))" },
    { tipo: "Tarjeta", valor: 30, color: "hsl(142, 70%, 45%)" },
    { tipo: "Transferencia", valor: 25, color: "hsl(217, 70%, 55%)" },
  ];

  const weeklyActivity = [
    { dia: "Lun", visitas: 12 },
    { dia: "Mar", visitas: 19 },
    { dia: "Mié", visitas: 15 },
    { dia: "Jue", visitas: 22 },
    { dia: "Vie", visitas: 18 },
    { dia: "Sáb", visitas: 8 },
    { dia: "Dom", visitas: 5 },
  ];

  return (
    <DashboardLayout userRole="admin" userName="Administrador">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Estadísticas</h1>
          <p className="text-muted-foreground">Análisis y métricas del sistema</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Pacientes" value="351" icon={Users} colorClass="bg-primary/10" subtitle="+12% vs mes anterior" />
          <StatCard title="Crecimiento" value="+18%" icon={TrendingUp} colorClass="bg-emerald-100" subtitle="Este mes" />
          <StatCard title="Productos Vendidos" value="197" icon={Package} colorClass="bg-blue-100" subtitle="+8% vs mes anterior" />
          <StatCard title="Escaneos Cuánticos" value="142" icon={Activity} colorClass="bg-amber-100" subtitle="Este mes" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia Mensual</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="mes" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line type="monotone" dataKey="pacientes" stroke="hsl(var(--primary))" strokeWidth={2} name="Pacientes" />
                  <Line type="monotone" dataKey="productos" stroke="hsl(142, 70%, 45%)" strokeWidth={2} name="Productos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Payment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Pagos</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ tipo, valor }) => `${tipo}: ${valor}%`}
                    outerRadius={100}
                    fill="hsl(var(--primary))"
                    dataKey="valor"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Actividad Semanal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--foreground))" />
                  <YAxis stroke="hsl(var(--foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Visitas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminEstadisticas;
