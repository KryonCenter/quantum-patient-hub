import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, Shield, UserCheck, Search, Stethoscope, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchDoctorModules,
  fetchDoctorStaff,
  updateDoctorModules,
  addDoctorStaff,
  removeDoctorStaff,
  listAllDoctors,
  type DoctorModules,
  type DoctorStaff,
  type StaffRole,
} from "@/lib/api";

interface AppUser {
  id: string;
  nombre: string;
  correo: string;
  roles: string[];
  fechaRegistro: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  super_admin: "Super Admin",
  doctor: "Doctor/a",
  recepcion: "Recepción",
  asistente: "Asistente",
  monitor: "Monitor (TV)",
  user: "Paciente",
};

const ASSIGNABLE_ROLES = ["admin", "doctor", "recepcion", "asistente", "monitor", "user"];
const STAFF_ROLES: StaffRole[] = ["recepcion", "asistente", "monitor"];

const MODULE_LABELS: Record<keyof Omit<DoctorModules, "doctorId">, string> = {
  citas: "Citas",
  pos: "Punto de venta",
  inventario: "Inventario",
  monitor: "Monitor TV",
  recordatorios: "Recordatorios",
  reportes: "Reportes",
  googleCalendar: "Google Calendar",
};

const AdminUsuarios = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [doctors, setDoctors] = useState<{ id: string; displayName: string }[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [modules, setModules] = useState<DoctorModules | null>(null);
  const [staff, setStaff] = useState<DoctorStaff[]>([]);
  const [newStaffUser, setNewStaffUser] = useState<string>("");
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>("recepcion");

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }, docs] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        listAllDoctors(),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const rolesByUser = new Map<string, string[]>();
      for (const r of roles ?? []) {
        const arr = rolesByUser.get(r.user_id) ?? [];
        arr.push(r.role as string);
        rolesByUser.set(r.user_id, arr);
      }
      setUsers((profiles ?? []).map((p) => ({
        id: p.id,
        nombre: p.full_name ?? "(sin nombre)",
        correo: p.email ?? "",
        roles: rolesByUser.get(p.id) ?? ["user"],
        fechaRegistro: (p.created_at as string).split("T")[0],
      })));
      setDoctors(docs);
      if (docs.length > 0 && !selectedDoctor) setSelectedDoctor(docs[0].id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorPanel = async () => {
    if (!selectedDoctor) return;
    try {
      const [m, s] = await Promise.all([
        fetchDoctorModules(selectedDoctor),
        fetchDoctorStaff(selectedDoctor),
      ]);
      setModules(m);
      setStaff(s);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { loadDoctorPanel(); }, [selectedDoctor]);

  const setRole = async (u: AppUser, role: string) => {
    try {
      // Remove all existing roles for this user and set the chosen one as primary
      await supabase.from("user_roles").delete().eq("user_id", u.id);
      const { error } = await supabase.from("user_roles").insert({ user_id: u.id, role: role as any });
      if (error) throw error;
      toast({ title: "Rol actualizado", description: `${u.nombre}: ${ROLE_LABELS[role] ?? role}` });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const toggleModule = async (key: keyof Omit<DoctorModules, "doctorId">, value: boolean) => {
    if (!modules) return;
    try {
      await updateDoctorModules(modules.doctorId, { [key]: value } as any);
      setModules({ ...modules, [key]: value });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleAddStaff = async () => {
    if (!selectedDoctor || !newStaffUser) {
      toast({ title: "Selecciona un usuario", variant: "destructive" });
      return;
    }
    try {
      await addDoctorStaff({ doctorId: selectedDoctor, userId: newStaffUser, role: newStaffRole });
      toast({ title: "Personal asignado" });
      setNewStaffUser("");
      await loadDoctorPanel();
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRemoveStaff = async (s: DoctorStaff) => {
    try {
      await removeDoctorStaff(s.id, s.userId, s.role);
      toast({ title: "Personal removido" });
      await loadDoctorPanel();
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = users.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.correo.toLowerCase().includes(search.toLowerCase())
  );
  const adminUsers = users.filter((u) => u.roles.includes("admin") || u.roles.includes("super_admin")).length;
  const doctorUsers = users.filter((u) => u.roles.includes("doctor")).length;

  const candidateUsers = users.filter((u) =>
    !u.roles.includes("admin") &&
    !u.roles.includes("super_admin") &&
    !u.roles.includes("doctor") &&
    !staff.some((s) => s.userId === u.id)
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Asigna roles, configura módulos por doctor y vincula personal (recepción, asistente, monitor) a cada doctor.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total" value={users.length} icon={Users} colorClass="bg-primary/10" />
          <StatCard title="Pacientes" value={users.length - adminUsers - doctorUsers} icon={UserCheck} colorClass="bg-emerald-100" />
          <StatCard title="Doctores" value={doctorUsers} icon={Stethoscope} colorClass="bg-teal-100" />
          <StatCard title="Administradores" value={adminUsers} icon={Shield} colorClass="bg-blue-100" />
        </div>

        {/* Doctor configuration panel */}
        {doctors.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Configuración por doctor</CardTitle>
              <div className="w-72">
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger><SelectValue placeholder="Selecciona doctor" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.displayName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Módulos habilitados</h3>
                {!modules ? (
                  <p className="text-sm text-muted-foreground">Cargando…</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {(Object.keys(MODULE_LABELS) as (keyof typeof MODULE_LABELS)[]).map((key) => (
                      <div key={key} className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <Label>{MODULE_LABELS[key]}</Label>
                        <Switch
                          checked={Boolean(modules[key])}
                          onCheckedChange={(v) => toggleModule(key, v)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Personal del doctor</h3>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                  <div className="flex-1">
                    <Select value={newStaffUser} onValueChange={setNewStaffUser}>
                      <SelectTrigger><SelectValue placeholder="Usuario a asignar" /></SelectTrigger>
                      <SelectContent>
                        {candidateUsers.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No hay usuarios disponibles</div>
                        ) : candidateUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.nombre} — {u.correo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-48">
                    <Select value={newStaffRole} onValueChange={(v) => setNewStaffRole(v as StaffRole)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddStaff}>Asignar</Button>
                </div>

                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin personal asignado.</p>
                ) : (
                  <div className="space-y-2">
                    {staff.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="font-medium">{s.fullName || "(sin nombre)"} <span className="text-xs text-muted-foreground">— {s.email}</span></div>
                          <Badge variant="secondary" className="mt-1">{ROLE_LABELS[s.role] ?? s.role}</Badge>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => handleRemoveStaff(s)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* User table */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
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
                  <TableHead>Roles</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Rol principal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay usuarios</TableCell></TableRow>
                ) : filtered.map((u) => {
                  const primary = u.roles.includes("admin") ? "admin"
                    : u.roles.includes("super_admin") ? "super_admin"
                    : u.roles.includes("doctor") ? "doctor"
                    : u.roles[0] ?? "user";
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nombre}</TableCell>
                      <TableCell>{u.correo}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((r) => (
                            <Badge key={r} variant={r === "admin" || r === "super_admin" ? "default" : "secondary"}>
                              {ROLE_LABELS[r] ?? r}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{u.fechaRegistro}</TableCell>
                      <TableCell className="w-48">
                        <Select
                          value={primary}
                          onValueChange={(v) => setRole(u, v)}
                          disabled={u.id === currentUser?.id}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsuarios;
