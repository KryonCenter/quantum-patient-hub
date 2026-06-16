import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  fetchReminderSettings,
  saveReminderSettings,
  renderWhatsappTemplate,
  buildWhatsappLink,
  type ReminderSettings,
} from "@/lib/api";
import { MessageCircle } from "lucide-react";

const PREVIEW_VARS = {
  paciente: "Abril Sofía",
  fecha: "lunes 16 de junio",
  hora: "6:30 PM",
  doctor: "Dra. García",
  sucursal: "Sucursal Centro",
};

const DoctorRecordatorios = () => {
  const { toast } = useToast();
  const [s, setS] = useState<ReminderSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReminderSettings().then(setS).catch((e) => toast({ title: "Error", description: e.message, variant: "destructive" }));
  }, []);

  if (!s) return <DashboardLayout><div className="p-6">Cargando...</div></DashboardLayout>;

  const set = (patch: Partial<ReminderSettings>) => setS({ ...s, ...patch });

  const save = async () => {
    setSaving(true);
    try {
      await saveReminderSettings(s);
      toast({ title: "Configuración guardada" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const preview = renderWhatsappTemplate(s.whatsappTemplate, PREVIEW_VARS);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold">Recordatorios</h1>
          <p className="text-muted-foreground">Configura cuándo y qué se envía a tus pacientes</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Cuándo enviar</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Recordatorios activos</Label>
              <Switch checked={s.enabled} onCheckedChange={(v) => set({ enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Un día antes</Label>
              <Switch checked={s.sendDayBefore} onCheckedChange={(v) => set({ sendDayBefore: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>El mismo día (en la mañana)</Label>
              <Switch checked={s.sendSameDay} onCheckedChange={(v) => set({ sendSameDay: v })} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label className="flex-1">Check-in horas antes</Label>
              <Switch checked={s.sendHoursBefore} onCheckedChange={(v) => set({ sendHoursBefore: v })} />
              <Input
                type="number" min={1} max={24} className="w-20"
                value={s.hoursBefore}
                onChange={(e) => set({ hoursBefore: Number(e.target.value) || 2 })}
              />
            </div>
            <div>
              <Label>Hora de envío (mismo día / día antes)</Label>
              <Input type="time" value={s.sendTime} onChange={(e) => set({ sendTime: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plantilla de WhatsApp</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Variables disponibles: <code>{"{paciente}"}</code> <code>{"{fecha}"}</code> <code>{"{hora}"}</code> <code>{"{doctor}"}</code> <code>{"{sucursal}"}</code>
            </p>
            <Textarea
              rows={10}
              value={s.whatsappTemplate}
              onChange={(e) => set({ whatsappTemplate: e.target.value })}
            />
            <div>
              <Label>Vista previa</Label>
              <div className="mt-2 rounded-lg bg-muted p-4 whitespace-pre-wrap text-sm">{preview}</div>
              <Button
                variant="outline" size="sm" className="mt-2"
                onClick={() => window.open(buildWhatsappLink("5215555555555", preview), "_blank")}
              >
                <MessageCircle className="h-4 w-4 mr-2" /> Probar en WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorRecordatorios;
