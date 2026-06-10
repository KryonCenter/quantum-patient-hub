import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Upload, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchCurrentDoctor, upsertDoctor, uploadDoctorLogo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const DoctorConfig = () => {
  const { toast } = useToast();
  const { refreshRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    specialty: "",
    whatsappPhone: "",
    brandColor: "#10b981",
    logoUrl: "" as string,
  });

  useEffect(() => {
    (async () => {
      const d = await fetchCurrentDoctor();
      if (d) {
        setForm({
          displayName: d.displayName,
          specialty: d.specialty ?? "",
          whatsappPhone: d.whatsappPhone ?? "",
          brandColor: d.brandColor,
          logoUrl: d.logoUrl ?? "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadDoctorLogo(file);
      setForm({ ...form, logoUrl: url });
      toast({ title: "Logo cargado" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await upsertDoctor(form);
      await refreshRole();
      toast({ title: "Configuración guardada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <DashboardLayout><div className="p-6">Cargando...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">Configuración del Doctor</h1>
          <p className="text-muted-foreground">Personaliza tu plataforma</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5" /> Perfil profesional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Nombre / Clínica</Label>
              <Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Dra. María García" /></div>
            <div><Label>Especialidad</Label>
              <Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Fisioterapia" /></div>
            <div><Label>WhatsApp (con código país)</Label>
              <Input value={form.whatsappPhone} onChange={(e) => setForm({ ...form, whatsappPhone: e.target.value })} placeholder="+52 555 123 4567" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Color de marca</Label>
                <Input type="color" value={form.brandColor}
                  onChange={(e) => setForm({ ...form, brandColor: e.target.value })} className="h-10" />
              </div>
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-2">
                  {form.logoUrl && <img src={form.logoUrl} alt="logo" className="h-10 w-10 rounded-full object-cover border" />}
                  <Input type="file" accept="image/*" onChange={handleLogo} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" /> Google Calendar</CardTitle>
            <CardDescription>Sincroniza tus citas con tu Google Calendar personal</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Conectar Google Calendar (próximamente)
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Necesitamos credenciales OAuth de Google. Avísanos cuando quieras activarlo.
            </p>
          </CardContent>
        </Card>

        <Button onClick={save} disabled={saving || !form.displayName} size="lg">
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default DoctorConfig;
