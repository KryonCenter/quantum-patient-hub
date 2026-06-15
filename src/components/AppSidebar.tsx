import { Activity, LayoutDashboard, Users, BarChart3, UsersRound, Settings, Shield, LogOut, CalendarDays, Building2, Stethoscope, CalendarClock } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth, type Role } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { fetchCurrentDoctor, fetchCurrentDoctorModules, type DoctorModules } from "@/lib/api";
import type { Doctor } from "@/lib/types";

interface AppSidebarProps {
  userRole: Role;
  userName: string;
}

export function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const isCollapsed = state === "collapsed";
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [modules, setModules] = useState<DoctorModules | null>(null);

  useEffect(() => {
    if (userRole === "doctor" || userRole === "admin") {
      fetchCurrentDoctor().then(setDoctor).catch(() => setDoctor(null));
    }
    fetchCurrentDoctorModules().then(setModules).catch(() => setModules(null));
  }, [userRole]);

  // Helper: only include module-gated items when the module is enabled (or modules not yet loaded for admin)
  const mod = (key: keyof DoctorModules | null, enabled = true) => {
    if (!enabled) return false;
    if (!key) return true;
    if (!modules) return userRole === "admin"; // admins see everything until modules load
    return Boolean(modules[key]);
  };

  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard, show: true },
    { title: "Pacientes", url: "/admin/pacientes", icon: Users, show: true },
    { title: "Citas", url: "/admin/citas", icon: CalendarDays, show: mod("citas") },
    { title: "Agenda", url: "/admin/agenda", icon: CalendarClock, show: mod("citas") },
    { title: "Productos", url: "/admin/productos", icon: Activity, show: true },
    { title: "Sucursales", url: "/admin/sucursales", icon: Building2, show: true },
    { title: "Estadísticas", url: "/admin/estadisticas", icon: BarChart3, show: mod("reportes") },
    { title: "Usuarios", url: "/admin/usuarios", icon: UsersRound, show: true },
    { title: "Configuración", url: "/admin/configuracion", icon: Settings, show: true },
  ].filter((i) => i.show);

  const doctorItems = [
    { title: "Dashboard", url: "/doctor", icon: LayoutDashboard, show: true },
    { title: "Pacientes", url: "/doctor/pacientes", icon: Users, show: true },
    { title: "Citas", url: "/doctor/citas", icon: CalendarDays, show: mod("citas") },
    { title: "Productos / Servicios", url: "/doctor/productos", icon: Activity, show: true },
    { title: "Sucursales", url: "/doctor/sucursales", icon: Building2, show: true },
    { title: "Configuración", url: "/doctor/configuracion", icon: Settings, show: true },
  ].filter((i) => i.show);

  const userItems = [
    { title: "Mis Citas", url: "/mis-citas", icon: CalendarDays, show: true },
  ];

  const items =
    userRole === "admin" ? adminItems : userRole === "doctor" ? doctorItems : userItems;


  const handleLogout = async () => {
    await signOut();
    toast({ title: "Sesión cerrada" });
    navigate("/login");
  };

  const brandName = doctor?.displayName || "MediRecord";
  const brandColor = doctor?.brandColor;

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-background border-r">
        <div className="flex items-center gap-3 p-4 border-b">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden"
            style={{ backgroundColor: brandColor ?? "hsl(var(--primary))" }}
          >
            {doctor?.logoUrl ? (
              <img src={doctor.logoUrl} alt={brandName} className="h-full w-full object-cover" />
            ) : (
              <Stethoscope className="h-5 w-5 text-white" />
            )}
          </div>
          {!isCollapsed && <span className="text-lg font-bold truncate">{brandName}</span>}
        </div>

        <div className="flex items-center gap-3 p-4">
          <Avatar>
            <AvatarFallback className="bg-primary/10">
              {userRole === "admin" ? <Shield className="h-5 w-5 text-primary" /> :
               userRole === "doctor" ? <Stethoscope className="h-5 w-5 text-primary" /> :
               <Users className="h-5 w-5 text-primary" />}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm truncate">{userName}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {userRole === "admin" ? "Administrador" : userRole === "doctor" ? "Doctor/a" : "Paciente"}
              </span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <div className="mt-auto p-4">
            <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
