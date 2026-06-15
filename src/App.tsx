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
import DoctorDashboard from "./pages/UserDashboardNew";
import DoctorBranches from "./pages/DoctorBranches";
import DoctorConfig from "./pages/DoctorConfig";
import DoctorAgenda from "./pages/DoctorAgenda";
import UserCitas from "./pages/UserCitas";
import PatientBooking from "./pages/PatientBooking";
import DoctorPOS from "./pages/DoctorPOS";
import DoctorInventario from "./pages/DoctorInventario";
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

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboardNew /></ProtectedRoute>} />
            <Route path="/admin/pacientes" element={<ProtectedRoute requireAdmin><AdminPacientes /></ProtectedRoute>} />
            <Route path="/admin/citas" element={<ProtectedRoute requireAdmin><AdminCitas /></ProtectedRoute>} />
            <Route path="/admin/productos" element={<ProtectedRoute requireAdmin><AdminProductos /></ProtectedRoute>} />
            <Route path="/admin/sucursales" element={<ProtectedRoute requireAdmin><DoctorBranches /></ProtectedRoute>} />
            <Route path="/admin/estadisticas" element={<ProtectedRoute requireAdmin><AdminEstadisticas /></ProtectedRoute>} />
            <Route path="/admin/usuarios" element={<ProtectedRoute requireAdmin><AdminUsuarios /></ProtectedRoute>} />
            <Route path="/admin/configuracion" element={<ProtectedRoute requireAdmin><DoctorConfig /></ProtectedRoute>} />

            {/* Doctor */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/doctor/pacientes" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><AdminPacientes /></ProtectedRoute>} />
            <Route path="/doctor/citas" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><AdminCitas /></ProtectedRoute>} />
            <Route path="/doctor/productos" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><AdminProductos /></ProtectedRoute>} />
            <Route path="/doctor/sucursales" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><DoctorBranches /></ProtectedRoute>} />
            <Route path="/doctor/configuracion" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><DoctorConfig /></ProtectedRoute>} />
            <Route path="/doctor/agenda" element={<ProtectedRoute allowedRoles={["doctor", "admin"]}><DoctorAgenda /></ProtectedRoute>} />
            <Route path="/admin/agenda" element={<ProtectedRoute requireAdmin><DoctorAgenda /></ProtectedRoute>} />

            {/* Patient */}
            <Route path="/mis-citas" element={<ProtectedRoute><UserCitas /></ProtectedRoute>} />
            <Route path="/solicitar-cita" element={<ProtectedRoute><PatientBooking /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
