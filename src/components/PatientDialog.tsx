import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Patient } from "@/pages/AdminDashboard";

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patient: Patient | Omit<Patient, "id">) => void;
  patient?: Patient | null;
}

export const PatientDialog = ({ open, onOpenChange, onSave, patient }: PatientDialogProps) => {
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    correo: "",
    tipoPago: "",
    observaciones: "",
    producto: "",
    fechaRegistro: new Date().toISOString().split('T')[0],
    escaneoQuantico: false,
  });

  useEffect(() => {
    if (patient) {
      setFormData(patient);
    } else {
      setFormData({
        nombre: "",
        telefono: "",
        correo: "",
        tipoPago: "",
        observaciones: "",
        producto: "",
        fechaRegistro: new Date().toISOString().split('T')[0],
        escaneoQuantico: false,
      });
    }
  }, [patient, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (patient) {
      onSave({ ...formData, id: patient.id });
    } else {
      onSave(formData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
          <DialogDescription>
            {patient ? "Actualiza la información del paciente" : "Ingresa los datos del nuevo paciente"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                id="telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="correo">Correo Electrónico *</Label>
            <Input
              id="correo"
              type="email"
              value={formData.correo}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipoPago">Tipo de Pago *</Label>
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
            <div className="space-y-2">
              <Label htmlFor="fechaRegistro">Fecha de Registro *</Label>
              <Input
                id="fechaRegistro"
                type="date"
                value={formData.fechaRegistro}
                onChange={(e) => setFormData({ ...formData, fechaRegistro: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="producto">Producto</Label>
            <Input
              id="producto"
              value={formData.producto}
              onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
              placeholder="Ej: Terapia Cuántica, Suplementos, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Notas adicionales sobre el paciente..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="escaneoQuantico"
              checked={formData.escaneoQuantico}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, escaneoQuantico: checked as boolean })
              }
            />
            <Label htmlFor="escaneoQuantico" className="cursor-pointer">
              Escaneo Cuántico - Terapia
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {patient ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
