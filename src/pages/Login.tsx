import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication
    if (email === "admin@example.com" && password === "admin123") {
      localStorage.setItem("userRole", "admin");
      toast({
        title: "Acceso exitoso",
        description: "Bienvenido al panel de administración",
      });
      navigate("/admin");
    } else if (email === "usuario@example.com" && password === "user123") {
      localStorage.setItem("userRole", "user");
      toast({
        title: "Acceso exitoso",
        description: "Bienvenido a tu panel",
      });
      navigate("/dashboard");
    } else {
      toast({
        title: "Error de autenticación",
        description: "Credenciales incorrectas",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
          <CardDescription className="text-center">
            Sistema de Gestión de Pacientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Ingresar
            </Button>
          </form>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Credenciales de prueba:</p>
            <p>Admin: admin@example.com / admin123</p>
            <p>Usuario: usuario@example.com / user123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
