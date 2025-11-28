import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Calendar, CreditCard, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock user data
  const userData = {
    nombre: "Juan Pérez Martínez",
    telefono: "+52 555 8765 4321",
    correo: "juan.perez@example.com",
    tipoPago: "Efectivo",
    observaciones: "Seguimiento mensual",
    producto: "Suplementos Vitamínicos",
    fechaRegistro: "2025-11-18",
    escaneoQuantico: false,
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Mi Panel</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Información Personal</CardTitle>
            </div>
            <CardDescription>Tus datos registrados en el sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nombre Completo</p>
                <p className="text-lg font-semibold">{userData.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                <p className="text-lg font-semibold">{userData.telefono}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Correo Electrónico</p>
                <p className="text-lg font-semibold">{userData.correo}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de Registro</p>
                <p className="text-lg font-semibold">
                  {new Date(userData.fechaRegistro).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle className="text-base">Tipo de Pago</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {userData.tipoPago}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle className="text-base">Producto Adquirido</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{userData.producto}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle className="text-base">Escaneo Cuántico</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {userData.escaneoQuantico ? (
                <Badge>Realizado</Badge>
              ) : (
                <Badge variant="secondary">No Realizado</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{userData.observaciones}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UserDashboard;
