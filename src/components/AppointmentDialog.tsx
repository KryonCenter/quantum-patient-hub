import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, FileText, Package, Trash2, X, Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Appointment, AppointmentProduct, Branch, Product } from "@/lib/types";
import { fetchBranches, fetchProducts } from "@/lib/api";

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (appointment: Appointment | Omit<Appointment, "id">) => void;
  appointment?: Appointment | null;
}

export const AppointmentDialog = ({ open, onOpenChange, onSave, appointment }: AppointmentDialogProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<AppointmentProduct[]>([]);
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    motivo: "",
    branchId: "",
    estado: "pendiente" as Appointment["estado"],
    consulta: { sintomas: "", diagnostico: "", tratamiento: "", observaciones: "" },
  });

  useEffect(() => {
    if (open) {
      fetchProducts().then(setProducts).catch(() => setProducts([]));
      fetchBranches().then(setBranches).catch(() => setBranches([]));
    }
  }, [open]);

  useEffect(() => {
    if (appointment) {
      setFormData({
        fecha: appointment.fecha,
        hora: appointment.hora,
        motivo: appointment.motivo,
        branchId: appointment.branchId ?? "",
        estado: appointment.estado,
        consulta: appointment.consulta,
      });
      setSelectedProducts(appointment.productos || []);
    } else {
      setFormData({
        fecha: "",
        hora: "",
        motivo: "",
        branchId: "",
        estado: "pendiente",
        consulta: { sintomas: "", diagnostico: "", tratamiento: "", observaciones: "" },
      });
      setSelectedProducts([]);
    }
  }, [appointment, open]);

  const handleAddProduct = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = selectedProducts.find(p => p.productId === productId);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p =>
        p.productId === productId ? { ...p, cantidad: p.cantidad + 1 } : p,
      ));
    } else {
      setSelectedProducts([...selectedProducts, {
        id: `tmp-${productId}-${Date.now()}`,
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        cantidad: 1,
      }]);
    }
  };

  const handleUpdateQuantity = (lineId: string, cantidad: number) => {
    if (cantidad <= 0) setSelectedProducts(selectedProducts.filter(p => p.id !== lineId));
    else setSelectedProducts(selectedProducts.map(p => p.id === lineId ? { ...p, cantidad } : p));
  };

  const handleRemoveProduct = (lineId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== lineId));
  };

  const total = selectedProducts.reduce((sum, p) => sum + p.precio * p.cantidad, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const branch = branches.find(b => b.id === formData.branchId);
    const payload = {
      ...formData,
      branchId: formData.branchId || null,
      branchName: branch?.name ?? null,
      branchAddress: branch?.address ?? null,
      productos: selectedProducts,
    };
    if (appointment) onSave({ ...payload, id: appointment.id });
    else onSave(payload);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <div className="bg-primary/5 p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl">{appointment ? "Editar Cita" : "Nueva Cita"}</DialogTitle>
                <p className="text-sm text-muted-foreground">Define fecha, sucursal y servicio</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <Card><CardContent className="p-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="flex items-center gap-2"><Calendar className="h-4 w-4" />Fecha</Label>
              <Input id="fecha" type="date" value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora" className="flex items-center gap-2"><Clock className="h-4 w-4" />Hora</Label>
              <Input id="hora" type="time" value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Input id="motivo" placeholder="Revisión, seguimiento..." value={formData.motivo}
                onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} required />
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-4 space-y-2">
            <Label className="flex items-center gap-2 text-base"><Building2 className="h-5 w-5 text-primary" />Sucursal</Label>
            <Select value={formData.branchId} onValueChange={(v) => setFormData({ ...formData, branchId: v })}>
              <SelectTrigger>
                <SelectValue placeholder={branches.length === 0 ? "Aún no has creado sucursales" : "Selecciona una sucursal"} />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name} — {b.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent></Card>

          <Card><CardContent className="p-4 space-y-4">
            <Label className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-primary" />Producto / Servicio
            </Label>
            {selectedProducts.length > 0 && (
              <div className="space-y-2">
                {selectedProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="font-medium">{product.nombre}</span>
                      <span className="text-sm text-muted-foreground">${product.precio}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(product.id, product.cantidad - 1)}>-</Button>
                      <span className="w-8 text-center">{product.cantidad}</span>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(product.id, product.cantidad + 1)}>+</Button>
                      <span className="font-semibold w-20 text-right">
                        ${(product.precio * product.cantidad).toLocaleString()}
                      </span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveProduct(product.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex justify-end pt-2 border-t">
                  <div className="text-lg font-bold">Total: ${total.toLocaleString()}</div>
                </div>
              </div>
            )}
            <Select onValueChange={handleAddProduct}>
              <SelectTrigger>
                <SelectValue placeholder={products.length === 0 ? "Aún no has creado productos/servicios" : "Agregar producto o servicio"} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.nombre} {product.kind === "service" ? "(servicio)" : "(producto)"} — ${product.precio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent></Card>

          <Card><CardContent className="p-4 space-y-4">
            <Label className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5 text-primary" />Información de Consulta
            </Label>
            <div className="space-y-4">
              {(["sintomas", "diagnostico", "tratamiento", "observaciones"] as const).map((k) => (
                <div key={k} className="space-y-2">
                  <Label className="capitalize">{k}</Label>
                  <Textarea value={formData.consulta[k]}
                    onChange={(e) => setFormData({ ...formData, consulta: { ...formData.consulta, [k]: e.target.value } })}
                    rows={2} />
                </div>
              ))}
            </div>
          </CardContent></Card>

          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value as any })}>
              <SelectTrigger id="estado"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="completada">Completada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="lg">Cancelar</Button>
            <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90">
              <Calendar className="mr-2 h-4 w-4" />
              {appointment ? "Actualizar Cita" : "Guardar Cita"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
