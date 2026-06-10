import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isDoctor, setIsDoctor] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const dest = role === "admin" ? "/admin" : role === "doctor" ? "/doctor" : "/mis-citas";
      navigate(dest, { replace: true });
    }
  }, [user, role, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Sesión iniciada", description: "Bienvenido" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
          is_doctor: isDoctor,
          specialty: isDoctor ? specialty : null,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cuenta creada", description: "Revisa tu correo para confirmar" });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({
        title: "Error con Google",
        description: result.error.message ?? "No se pudo iniciar sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Plataforma para Doctores
          </CardTitle>
          <CardDescription className="text-center">
            Gestiona tus pacientes, sucursales y citas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogle}
          >
            Continuar con Google
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">o</span>
            </div>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Correo</Label>
                  <Input id="signin-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <Input id="signin-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Procesando..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                  <Checkbox id="is-doctor" checked={isDoctor}
                    onCheckedChange={(c) => setIsDoctor(c as boolean)} />
                  <Label htmlFor="is-doctor" className="cursor-pointer">
                    Soy doctor/a (administraré mis pacientes)
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre completo</Label>
                  <Input id="signup-name" type="text" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} required />
                </div>
                {isDoctor && (
                  <div className="space-y-2">
                    <Label htmlFor="signup-specialty">Especialidad</Label>
                    <Input id="signup-specialty" type="text" placeholder="Ej. Fisioterapia, Odontología"
                      value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo</Label>
                  <Input id="signup-email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input id="signup-password" type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)} minLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Procesando..." : "Crear cuenta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
