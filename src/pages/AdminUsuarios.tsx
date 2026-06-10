import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Shield, UserCheck, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AppUser {
  id: string;
  nombre: string;
  correo: string;
  isAdmin: boolean;
  fechaRegistro: string;
}

const AdminUsuarios = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const admins = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));
      setUsers((profiles ?? []).map((p) => ({
        id: p.id,
        nombre: p.full_name ?? "(sin nombre)",
        correo: p.email ?? "",
        isAdmin: admins.has(p.id),
        fechaRegistro: (p.created_at as string).split("T")[0],
      })));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (u: AppUser) => {
    try {
      if (u.isAdmin) {
        const { error } = await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
        if (error) throw error;
        toast({ title: "Rol actualizado", description: `${u.nombre} ya no es administrador` });
      } else {
        const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" });
        if (error) throw error;
        toast({ title: "Rol actualizado", description: `${u.nombre} ahora es administrador` });
      }
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = users.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.correo.toLowerCase().includes(search.toLowerCase())
  );
  const adminUsers = users.filter((u) => u.isAdmin).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Los nuevos usuarios se registran desde la página de inicio de sesión. Aquí puedes asignar el rol de administrador.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Usuarios" value={users.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Usuarios" value={users.length - adminUsers} icon={UserCheck} colorClass="bg-emerald-100" />
          <StatCard title="Administradores" value={adminUsers} icon={Shield} colorClass="bg-blue-100" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nombre o correo..." className="pl-10"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay usuarios</TableCell></TableRow>
                ) : filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nombre}</TableCell>
                    <TableCell>{u.correo}</TableCell>
                    <TableCell>
                      <Badge variant={u.isAdmin ? "default" : "secondary"}>
                        {u.isAdmin ? "Administrador" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.fechaRegistro}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={u.id === currentUser?.id}
                        onClick={() => toggleAdmin(u)}
                      >
                        {u.isAdmin ? "Quitar admin" : "Hacer admin"}
                      </Button>
                    </TableCell>
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

export default AdminUsuarios;
