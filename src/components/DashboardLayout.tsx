import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "admin" | "user";
  userName: string;
  onNewPatient?: () => void;
}

export function DashboardLayout({ children, userRole, userName, onNewPatient }: DashboardLayoutProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      navigate("/login");
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={userRole} userName={userName} />
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b bg-card px-6 py-4">
            <SidebarTrigger />
            {onNewPatient && (
              <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </Button>
            )}
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
