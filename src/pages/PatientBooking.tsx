import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CalendarPlus, Stethoscope } from "lucide-react";
import {
  fetchAvailableSlots,
  fetchBranches,
  listPublicDoctors,
  requestAppointmentByPatient,
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import type { Branch } from "@/lib/types";

export default function PatientBooking() {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<{ id: string; displayName: string; specialty: string | null; brandColor: string }[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<string[]>([]);
  const [slot, setSlot] = useState<string>("");
  const [motivo, setMotivo] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    listPublicDoctors().then((d) => {
      setDoctors(d.map((x) => ({ id: x.id, displayName: x.displayName, specialty: x.specialty, brandColor: x.brandColor })));
      if (d[0]) setDoctorId(d[0].id);
    });
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    (async () => {
      const { data } = await supabase.from("branches").select("*").eq("doctor_id", doctorId);
      const list = (data ?? []).map((r: any) => ({
        id: r.id, doctorId: r.doctor_id, name: r.name, address: r.address, city: r.city, phone: r.phone,
        isPrimary: r.is_primary, roomCount: r.room_count ?? 1,
      })) as Branch[];
      setBranches(list);
      setBranchId(list[0]?.id ?? "");
    })();
  }, [doctorId]);

  useEffect(() => {
    if (!doctorId || !date) return;
    setLoadingSlots(true);
    setSlot("");
    fetchAvailableSlots({ doctorId, date, branchId: branchId || null })
      .then(setSlots)
      .finally(() => setLoadingSlots(false));
  }, [doctorId, date, branchId]);

  const submit = async () => {
    if (!doctorId || !date || !slot || !motivo) {
      toast({ title: "Datos incompletos", description: "Selecciona doctor, fecha, hora y motivo.", variant: "destructive" });
      return;
    }
    try {
      await requestAppointmentByPatient({
        doctorId,
        branchId: branchId || null,
        fecha: date,
        hora: slot,
        motivo,
      });
      toast({ title: "Solicitud enviada", description: "El doctor confirmará tu cita pronto." });
      setMotivo("");
      setSlot("");
      // refresh slots
      fetchAvailableSlots({ doctorId, date, branchId: branchId || null }).then(setSlots);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarPlus className="h-7 w-7 text-primary" /> Solicitar cita
          </h1>
          <p className="text-muted-foreground">Elige doctor, sucursal, día y un horario disponible.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva solicitud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Doctor/a</Label>
                <Select value={doctorId} onValueChange={setDoctorId}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        <span className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" style={{ color: d.brandColor }} />
                          {d.displayName}{d.specialty ? ` · ${d.specialty}` : ""}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Sucursal</Label>
                <Select value={branchId || "any"} onValueChange={(v) => setBranchId(v === "any" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Cualquiera" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Cualquiera</SelectItem>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Fecha</Label>
                <Input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Horario disponible</Label>
                {loadingSlots ? (
                  <p className="text-sm text-muted-foreground">Buscando horarios...</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No hay horarios para ese día.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        size="sm"
                        variant={slot === s ? "default" : "outline"}
                        onClick={() => setSlot(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Motivo</Label>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Describe brevemente el motivo de tu cita" />
            </div>
            <Button onClick={submit} disabled={!slot}>Enviar solicitud</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
