import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboardNew from "./pages/AdminDashboardNew";
import AdminPacientes from "./pages/AdminPacientes";
import AdminProductos from "./pages/AdminProductos";
import AdminEstadisticas from "./pages/AdminEstadisticas";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminCitas from "./pages/AdminCitas";
import UserDashboardNew from "./pages/UserDashboardNew";
import DashboardPacientes from "./pages/DashboardPacientes";
import UserCitas from "./pages/UserCitas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardNew /></ProtectedRoute>} />
            <Route path="/admin/pacientes" element={<ProtectedRoute requireAdmin><AdminPacientes /></ProtectedRoute>} />
            <Route path="/admin/citas" element={<ProtectedRoute requireAdmin><AdminCitas /></ProtectedRoute>} />
            <Route path="/admin/productos" element={<ProtectedRoute requireAdmin><AdminProductos /></ProtectedRoute>} />
            <Route path="/admin/estadisticas" element={<ProtectedRoute requireAdmin><AdminEstadisticas /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />

            <Route path="/dashboard" element={<ProtectedRoute><UserDashboardNew /></ProtectedRoute>} />
            <Route path="/dashboard/pacientes" element={<ProtectedRoute><DashboardPacientes /></ProtectedRoute>} />
            <Route path="/dashboard/citas" element={<ProtectedRoute><UserCitas /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
