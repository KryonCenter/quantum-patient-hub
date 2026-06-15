import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, CalendarClock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchBranches,
  fetchDoctorSchedules,
  upsertDoctorSchedule,
  deleteDoctorSchedule,
  type DoctorSchedule,
} from "@/lib/api";
import type { Branch } from "@/lib/types";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function DoctorAgenda() {
  useAuth();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    dayOfWeek: 1,
    branchId: "" as string,
    startTime: "09:00",
    endTime: "13:00",
    slotMinutes: 30,
    active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const [s, b] = await Promise.all([fetchDoctorSchedules(), fetchBranches()]);
      setSchedules(s);
      setBranches(b);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    try {
      await upsertDoctorSchedule({
        branchId: form.branchId || null,
        dayOfWeek: form.dayOfWeek,
        startTime: form.startTime,
        endTime: form.endTime,
        slotMinutes: form.slotMinutes,
        active: form.active,
      });
      toast({ title: "Horario agregado" });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    await deleteDoctorSchedule(id);
    load();
  };

  const toggle = async (s: DoctorSchedule) => {
    await upsertDoctorSchedule({ ...s, active: !s.active });
    load();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" /> Agenda y horarios
          </h1>
          <p className="text-muted-foreground">Define tus días y horas laborales. Los pacientes solo podrán reservar en estos slots.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agregar horario</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="space-y-1">
              <Label>Día</Label>
              <Select value={String(form.dayOfWeek)} onValueChange={(v) => setForm({ ...form, dayOfWeek: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Sucursal</Label>
              <Select value={form.branchId || "all"} onValueChange={(v) => setForm({ ...form, branchId: v === "all" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Inicio</Label>
              <Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Fin</Label>
              <Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Duración (min)</Label>
              <Input type="number" min={5} value={form.slotMinutes} onChange={(e) => setForm({ ...form, slotMinutes: Number(e.target.value) })} />
            </div>
            <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horarios configurados</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <p className="text-muted-foreground">Cargando...</p> : schedules.length === 0 ? (
              <p className="text-muted-foreground">Aún no hay horarios.</p>
            ) : (
              <div className="divide-y">
                {schedules.map((s) => {
                  const branch = branches.find((b) => b.id === s.branchId);
                  return (
                    <div key={s.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex-1">
                        <div className="font-medium">{DAYS[s.dayOfWeek]} · {s.startTime} - {s.endTime}</div>
                        <div className="text-sm text-muted-foreground">
                          {branch?.name ?? "Todas las sucursales"} · cita cada {s.slotMinutes} min
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch checked={s.active} onCheckedChange={() => toggle(s)} />
                        <Button size="icon" variant="ghost" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
