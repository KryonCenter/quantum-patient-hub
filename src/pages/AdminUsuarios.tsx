import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Shield, UserCheck, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  nombre: string;
  correo: string;
  rol: "admin" | "usuario";
  estado: "activo" | "inactivo";
  fechaRegistro: string;
}

const AdminUsuarios = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      nombre: "Admin Principal",
      correo: "admin@example.com",
      rol: "admin",
      estado: "activo",
      fechaRegistro: "2024-01-15",
    },
    {
      id: "2",
      nombre: "Juan Pérez",
      correo: "juan@example.com",
      rol: "usuario",
      estado: "activo",
      fechaRegistro: "2024-03-20",
    },
    {
      id: "3",
      nombre: "María García",
      correo: "maria@example.com",
      rol: "usuario",
      estado: "activo",
      fechaRegistro: "2024-05-10",
    },
  ]);

  const [newUser, setNewUser] = useState({
    nombre: "",
    correo: "",
    rol: "usuario" as "admin" | "usuario",
    password: "",
  });

  const handleAddUser = () => {
    const user: User = {
      id: Date.now().toString(),
      nombre: newUser.nombre,
      correo: newUser.correo,
      rol: newUser.rol,
      estado: "activo",
      fechaRegistro: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, user]);
    setIsDialogOpen(false);
    setNewUser({ nombre: "", correo: "", rol: "usuario", password: "" });
    toast({
      title: "Usuario creado",
      description: "El usuario ha sido registrado exitosamente",
    });
  };

  const activeUsers = users.filter(u => u.estado === "activo").length;
  const adminUsers = users.filter(u => u.rol === "admin").length;

  return (
    <DashboardLayout userRole="admin" userName="Administrador">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">Administra los usuarios del sistema</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    value={newUser.nombre}
                    onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                    placeholder="Nombre del usuario"
                  />
                </div>
                <div>
                  <Label htmlFor="correo">Correo Electrónico</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={newUser.correo}
                    onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })}
                    placeholder="correo@ejemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Contraseña"
                  />
                </div>
                <div>
                  <Label htmlFor="rol">Rol</Label>
                  <Select value={newUser.rol} onValueChange={(value: "admin" | "usuario") => setNewUser({ ...newUser, rol: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usuario">Usuario</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Crear Usuario
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Usuarios" value={users.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Usuarios Activos" value={activeUsers} icon={UserCheck} colorClass="bg-emerald-100" />
          <StatCard title="Administradores" value={adminUsers} icon={Shield} colorClass="bg-blue-100" />
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nombre o correo..." className="pl-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nombre}</TableCell>
                    <TableCell>{user.correo}</TableCell>
                    <TableCell>
                      <Badge variant={user.rol === "admin" ? "default" : "secondary"}>
                        {user.rol === "admin" ? "Administrador" : "Usuario"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.estado === "activo" ? "default" : "secondary"}>
                        {user.estado === "activo" ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(user.fechaRegistro).toLocaleDateString()}</TableCell>
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
