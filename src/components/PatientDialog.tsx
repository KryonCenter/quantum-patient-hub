import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Phone, Mail, CreditCard, FileText, Activity, X } from "lucide-react";
import { AppointmentSection } from "@/components/AppointmentSection";
import type { Patient, Appointment } from "@/lib/types";
import type { Product } from "@/pages/AdminProductos";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patient: Patient | Omit<Patient, "id">) => void;
  patient?: Patient | null;
}

export const PatientDialog = ({ open, onOpenChange, onSave, patient }: PatientDialogProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    tipoPago: "",
    observaciones: "",
    fechaRegistro: new Date().toISOString().split('T')[0],
    escaneoQuantico: false,
  });

  useEffect(() => {
    if (patient) {
      setFormData(patient);
      setAppointments(patient.citas || []);
    } else {
      setFormData({
        nombre: "",
        telefono: "",
        correo: "",
        tipoPago: "",
        observaciones: "",
        fechaRegistro: new Date().toISOString().split('T')[0],
        escaneoQuantico: false,
      });
      setAppointments([]);
    }
  }, [patient, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patient) {
      onSave({ ...formData, id: patient.id, citas: appointments });
    } else {
      onSave({ ...formData, citas: appointments });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header with close button */}
        <div className="bg-primary/5 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{patient ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {patient ? "Actualiza la información del paciente" : "Ingresa la información del nuevo paciente"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nombre Completo
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Juan Pérez García"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Número de Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="+52 123 456 7890"
                required
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="correo" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Electrónico
              </Label>
              <Input
                id="correo"
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="paciente@ejemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tipoPago" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Tipo de Pago
              </Label>
              <Select
                value={formData.tipoPago}
                onValueChange={(value) => setFormData({ ...formData, tipoPago: value })}
              >
                <SelectTrigger id="tipoPago">
                  <SelectValue placeholder="Selecciona tipo de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Observaciones
            </Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el paciente, historial, síntomas, etc..."
              rows={3}
            />
          </div>

          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="escaneoQuantico"
                checked={formData.escaneoQuantico}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, escaneoQuantico: checked as boolean })
                }
              />
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <Label htmlFor="escaneoQuantico" className="cursor-pointer font-semibold">
                  Escaneo Cuántico - Terapia
                </Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground ml-9">Servicio de escaneo cuántico</p>
          </div>

          {/* Sección de seguimiento de citas */}
          <div className="border-t pt-6">
            <AppointmentSection
              appointments={appointments}
              onAppointmentsChange={setAppointments}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg">
              Cancelar
            </Button>
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
