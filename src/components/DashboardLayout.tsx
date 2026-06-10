import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
  onNewPatient?: () => void;
}

export function DashboardLayout({ children, onNewPatient }: DashboardLayoutProps) {
  const { role, fullName, user } = useAuth();
  const effectiveRole = role ?? "user";
  const effectiveName = fullName || user?.email || "Usuario";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar userRole={effectiveRole} userName={effectiveName} />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between border-b bg-card px-6 py-4">
            <SidebarTrigger />
            {onNewPatient && (
              <Button onClick={onNewPatient} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </Button>
            )}
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
