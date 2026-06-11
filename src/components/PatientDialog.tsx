import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Phone, Mail, FileText, X, MapPin, Cake, Shield, Search } from "lucide-react";
import { AppointmentSection } from "@/components/AppointmentSection";
import { fetchPatients } from "@/lib/api";
import { ageFromBirth, fullName, type Patient, type Appointment } from "@/lib/types";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patient: Patient | Omit<Patient, "id">) => void;
  patient?: Patient | null;
}

const emptyForm = {
  firstName: "",
  lastNamePaterno: "",
  lastNameMaterno: "",
  telefono: "",
  correo: "",
  birthDate: "",
  locality: "",
  observaciones: "",
  fechaRegistro: new Date().toISOString().split("T")[0],
  guardianPatientId: "" as string,
  guardianFirstName: "",
  guardianLastNamePaterno: "",
  guardianLastNameMaterno: "",
};

export const PatientDialog = ({ open, onOpenChange, onSave, patient }: PatientDialogProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState(emptyForm);
  const [guardianSearch, setGuardianSearch] = useState("");
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    if (!open) return;
    fetchPatients().then(setAllPatients).catch(() => setAllPatients([]));
  }, [open]);

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName ?? "",
        lastNamePaterno: patient.lastNamePaterno ?? "",
        lastNameMaterno: patient.lastNameMaterno ?? "",
        telefono: patient.telefono,
        correo: patient.correo,
        birthDate: patient.birthDate ?? "",
        locality: patient.locality ?? "",
        observaciones: patient.observaciones,
        fechaRegistro: patient.fechaRegistro,
        guardianPatientId: patient.guardianPatientId ?? "",
        guardianFirstName: patient.guardianFirstName ?? "",
        guardianLastNamePaterno: patient.guardianLastNamePaterno ?? "",
        guardianLastNameMaterno: patient.guardianLastNameMaterno ?? "",
      });
      setAppointments(patient.citas || []);
    } else {
      setFormData(emptyForm);
      setAppointments([]);
    }
    setGuardianSearch("");
  }, [patient, open]);

  const age = ageFromBirth(formData.birthDate);
  const isMinor = age !== null && age < 18;

  const guardianMatches = useMemo(() => {
    if (!guardianSearch.trim()) return [];
    const q = guardianSearch.toLowerCase();
    return allPatients
      .filter((p) => p.id !== patient?.id)
      .filter(
        (p) =>
          fullName(p).toLowerCase().includes(q) ||
          (p.telefono || "").toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [guardianSearch, allPatients, patient?.id]);

  const selectedGuardian = allPatients.find((p) => p.id === formData.guardianPatientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nombre = [formData.firstName, formData.lastNamePaterno, formData.lastNameMaterno]
      .filter(Boolean)
      .join(" ")
      .trim();

    const base = {
      nombre,
      firstName: formData.firstName,
      lastNamePaterno: formData.lastNamePaterno,
      lastNameMaterno: formData.lastNameMaterno,
      telefono: formData.telefono,
      correo: formData.correo,
      tipoPago: patient?.tipoPago ?? "",
      observaciones: formData.observaciones,
      fechaRegistro: formData.fechaRegistro,
      birthDate: formData.birthDate || null,
      locality: formData.locality || null,
      guardianPatientId: isMinor && formData.guardianPatientId ? formData.guardianPatientId : null,
      guardianFirstName: isMinor ? formData.guardianFirstName : null,
      guardianLastNamePaterno: isMinor ? formData.guardianLastNamePaterno : null,
      guardianLastNameMaterno: isMinor ? formData.guardianLastNameMaterno : null,
      citas: appointments,
    };

    if (patient) onSave({ ...base, id: patient.id });
    else onSave(base);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-primary/5 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">
                  {patient ? "Editar Paciente" : "Nuevo Paciente"}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {patient ? "Actualiza la información del paciente" : "Registra un nuevo paciente"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><User className="h-4 w-4" />Nombres</Label>
              <Input value={formData.firstName} required
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Juan" />
            </div>
            <div className="space-y-2">
              <Label>Apellido paterno</Label>
              <Input value={formData.lastNamePaterno} required
                onChange={(e) => setFormData({ ...formData, lastNamePaterno: e.target.value })} placeholder="Pérez" />
            </div>
            <div className="space-y-2">
              <Label>Apellido materno</Label>
              <Input value={formData.lastNameMaterno}
                onChange={(e) => setFormData({ ...formData, lastNameMaterno: e.target.value })} placeholder="García" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Phone className="h-4 w-4" />Teléfono</Label>
              <Input type="tel" value={formData.telefono} required
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} placeholder="+52 123 456 7890" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />Correo</Label>
              <Input type="email" value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })} placeholder="paciente@ejemplo.com" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Cake className="h-4 w-4" />Fecha de nacimiento</Label>
              <Input type="date" value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
              {age !== null && (
                <p className="text-xs text-muted-foreground">{age} años{isMinor ? " (menor de edad)" : ""}</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" />Localidad</Label>
              <Input value={formData.locality}
                onChange={(e) => setFormData({ ...formData, locality: e.target.value })} placeholder="Ciudad / Colonia" />
            </div>
          </div>

          {isMinor && (
            <div className="border rounded-lg p-4 space-y-4 bg-amber-50/50 dark:bg-amber-950/10">
              <div className="flex items-center gap-2 font-medium">
                <Shield className="h-4 w-4 text-amber-600" /> Datos del tutor (obligatorio para menores)
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Search className="h-4 w-4" />
                  Buscar tutor entre pacientes registrados
                </Label>
                <Input value={guardianSearch}
                  onChange={(e) => setGuardianSearch(e.target.value)}
                  placeholder="Nombre o teléfono..." />
                {guardianMatches.length > 0 && (
                  <div className="border rounded-md divide-y bg-background">
                    {guardianMatches.map((p) => (
                      <button type="button" key={p.id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            guardianPatientId: p.id,
                            guardianFirstName: p.firstName ?? "",
                            guardianLastNamePaterno: p.lastNamePaterno ?? "",
                            guardianLastNameMaterno: p.lastNameMaterno ?? "",
                          });
                          setGuardianSearch("");
                        }}
                        className="w-full text-left p-2 hover:bg-accent text-sm">
                        <span className="font-medium">{fullName(p)}</span>
                        {p.telefono && <span className="text-muted-foreground"> · {p.telefono}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {selectedGuardian && (
                  <p className="text-xs text-primary">
                    ✓ Tutor vinculado: {fullName(selectedGuardian)}
                    <button type="button" className="ml-2 underline"
                      onClick={() => setFormData({ ...formData, guardianPatientId: "" })}>Quitar vínculo</button>
                  </p>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Nombres del tutor</Label>
                  <Input required={isMinor} value={formData.guardianFirstName}
                    onChange={(e) => setFormData({ ...formData, guardianFirstName: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Apellido paterno</Label>
                  <Input required={isMinor} value={formData.guardianLastNamePaterno}
                    onChange={(e) => setFormData({ ...formData, guardianLastNamePaterno: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Apellido materno</Label>
                  <Input value={formData.guardianLastNameMaterno}
                    onChange={(e) => setFormData({ ...formData, guardianLastNameMaterno: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-2"><FileText className="h-4 w-4" />Observaciones</Label>
            <Textarea value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas, historial, alergias..." rows={3} />
          </div>

          <div className="border-t pt-6">
            <AppointmentSection appointments={appointments} onAppointmentsChange={setAppointments} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg">Cancelar</Button>
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90">
              <FileText className="mr-2 h-4 w-4" />
              {patient ? "Actualizar Paciente" : "Registrar Paciente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
