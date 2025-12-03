import { Activity, LayoutDashboard, Users, BarChart3, UsersRound, Settings, Shield, LogOut, CalendarDays } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AppSidebarProps {
  userRole: "admin" | "user";
  userName: string;
}

export function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isCollapsed = state === "collapsed";

  const adminItems = [
    { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "Pacientes", url: "/admin/pacientes", icon: Users },
    { title: "Citas", url: "/admin/citas", icon: CalendarDays },
    { title: "Productos", url: "/admin/productos", icon: Activity },
    { title: "Estadísticas", url: "/admin/estadisticas", icon: BarChart3 },
    { title: "Usuarios", url: "/admin/usuarios", icon: UsersRound },
    { title: "Configuración", url: "/admin/configuracion", icon: Settings },
  ];

  const userItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Mis Pacientes", url: "/dashboard/pacientes", icon: Users },
    { title: "Citas", url: "/dashboard/citas", icon: CalendarDays },
  ];

  const items = userRole === "admin" ? adminItems : userItems;

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/login");
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-background border-r">
        {/* Logo */}
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="text-xl font-bold">MediRecord</span>}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-4">
          <Avatar>
            <AvatarFallback className="bg-primary/10">
              {userRole === "admin" ? <Shield className="h-5 w-5 text-primary" /> : <Users className="h-5 w-5 text-primary" />}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{userName}</span>
              <span className="text-xs text-muted-foreground capitalize">{userRole === "admin" ? "Administrador" : "Usuario"}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
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

        {/* Logout Button */}
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
