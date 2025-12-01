import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminDashboardNew from "./pages/AdminDashboardNew";
import AdminPacientes from "./pages/AdminPacientes";
import AdminProductos from "./pages/AdminProductos";
import AdminEstadisticas from "./pages/AdminEstadisticas";
import AdminUsuarios from "./pages/AdminUsuarios";
import UserDashboardNew from "./pages/UserDashboardNew";
import DashboardPacientes from "./pages/DashboardPacientes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboardNew />} />
          <Route path="/admin/pacientes" element={<AdminPacientes />} />
          <Route path="/admin/productos" element={<AdminProductos />} />
          <Route path="/admin/estadisticas" element={<AdminEstadisticas />} />
          <Route path="/admin/usuarios" element={<AdminUsuarios />} />
          <Route path="/dashboard" element={<UserDashboardNew />} />
          <Route path="/dashboard/pacientes" element={<DashboardPacientes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
