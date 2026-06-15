import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, DollarSign, CreditCard, Wallet, ArrowRightLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSales,
  fetchSale,
  fetchProducts,
  createSaleFromAppointment,
  updateSaleItems,
  closeSale,
  cancelSale,
} from "@/lib/api";
import type { Sale, SaleItem, SalePayment, Product, PaymentMethod } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";

const METHODS: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: "efectivo", label: "Efectivo", icon: Wallet },
  { value: "transferencia", label: "Transferencia", icon: ArrowRightLeft },
  { value: "tarjeta", label: "Tarjeta", icon: CreditCard },
];

export default function DoctorPOS() {
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [openAppts, setOpenAppts] = useState<any[]>([]);
  const [current, setCurrent] = useState<Sale | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([{ method: "efectivo", amount: 0 }]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [s, p] = await Promise.all([fetchSales(), fetchProducts()]);
      setSales(s);
      setProducts(p);
      const { data: appts } = await supabase
        .from("appointments")
        .select("id, fecha, hora, motivo, patient_id, patients(first_name, last_name_paterno, nombre)")
        .order("fecha", { ascending: false })
        .limit(50);
      // Filter out ones already with a sale
      const saleApptIds = new Set(s.map((x) => x.appointmentId).filter(Boolean));
      setOpenAppts((appts ?? []).filter((a: any) => !saleApptIds.has(a.id)));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  useEffect(() => { load(); }, []);

  const openCheckout = async (saleId: string) => {
    const s = await fetchSale(saleId);
    if (!s) return;
    setCurrent(s);
    const remaining = s.total - s.paid;
    setPayments(s.payments.length > 0 ? s.payments : [{ method: "efectivo", amount: remaining }]);
  };

  const startFromAppointment = async (appointmentId: string) => {
    try {
      const id = await createSaleFromAppointment(appointmentId);
      await load();
      await openCheckout(id);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const updateItem = (idx: number, patch: Partial<SaleItem>) => {
    if (!current) return;
    const items = [...current.items];
    items[idx] = { ...items[idx], ...patch };
    items[idx].subtotal = items[idx].unitPrice * items[idx].quantity;
    setCurrent({ ...current, items, total: items.reduce((s, i) => s + i.subtotal, 0) });
  };

  const removeItem = (idx: number) => {
    if (!current) return;
    const items = current.items.filter((_, i) => i !== idx);
    setCurrent({ ...current, items, total: items.reduce((s, i) => s + i.subtotal, 0) });
  };

  const addProduct = (productId: string) => {
    if (!current) return;
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const item: SaleItem = {
      productId: p.id,
      name: p.nombre,
      unitPrice: p.precio,
      quantity: 1,
      subtotal: p.precio,
      isService: p.kind === "service",
    };
    const items = [...current.items, item];
    setCurrent({ ...current, items, total: items.reduce((s, i) => s + i.subtotal, 0) });
  };

  const addFreeItem = () => {
    if (!current) return;
    const item: SaleItem = { name: "Servicio", unitPrice: 0, quantity: 1, subtotal: 0, isService: true };
    setCurrent({ ...current, items: [...current.items, item] });
  };

  const addPayment = () => setPayments([...payments, { method: "efectivo", amount: 0 }]);
  const updatePayment = (i: number, patch: Partial<SalePayment>) => {
    const next = [...payments];
    next[i] = { ...next[i], ...patch };
    setPayments(next);
  };
  const removePayment = (i: number) => setPayments(payments.filter((_, idx) => idx !== i));

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0);

  const handleSaveItems = async () => {
    if (!current) return;
    setLoading(true);
    try {
      await updateSaleItems(current.id, current.items);
      toast({ title: "Ítems guardados" });
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const handleClose = async () => {
    if (!current) return;
    if (Math.abs(totalPaid - current.total) > 0.01) {
      toast({ title: "Monto no coincide", description: "El total pagado debe igualar al total", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await updateSaleItems(current.id, current.items);
      await closeSale(current.id, payments.filter((p) => p.amount > 0));
      toast({ title: "Venta cerrada" });
      setCurrent(null);
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Punto de Venta</h1>
          <p className="text-muted-foreground">Cobra servicios y productos de tus citas</p>
        </div>

        {!current && (
          <>
            <Card>
              <CardHeader><CardTitle>Citas pendientes de cobro</CardTitle></CardHeader>
              <CardContent>
                {openAppts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No hay citas pendientes</div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {openAppts.slice(0, 12).map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {a.patients?.first_name || a.patients?.nombre || "Paciente"} {a.patients?.last_name_paterno || ""}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {a.fecha} {a.hora ? String(a.hora).slice(0, 5) : ""} — {a.motivo}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => startFromAppointment(a.id)}>Cobrar</Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Ventas recientes</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Fecha</TableHead><TableHead>Total</TableHead><TableHead>Pagado</TableHead>
                    <TableHead>Estado</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {sales.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{new Date(s.createdAt!).toLocaleString()}</TableCell>
                        <TableCell>${s.total.toFixed(2)}</TableCell>
                        <TableCell>${s.paid.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={s.status === "paid" ? "default" : s.status === "cancelled" ? "destructive" : "secondary"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => openCheckout(s.id)}>
                            {s.status === "open" ? "Cobrar" : "Ver"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sales.length === 0 && <div className="text-center py-8 text-muted-foreground">Sin ventas</div>}
              </CardContent>
            </Card>
          </>
        )}

        {current && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cobro</CardTitle>
                <Button variant="ghost" onClick={() => setCurrent(null)}>Volver</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ítems</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={addProduct}>
                      <SelectTrigger className="w-[260px]"><SelectValue placeholder="Agregar producto/servicio" /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.nombre} — ${p.precio}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={addFreeItem}><Plus className="h-4 w-4 mr-1" />Libre</Button>
                  </div>
                </div>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Nombre</TableHead><TableHead className="w-24">Cantidad</TableHead>
                    <TableHead className="w-32">Precio</TableHead><TableHead className="w-32">Subtotal</TableHead><TableHead></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {current.items.map((it, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: Number(e.target.value) || 0 })} />
                        </TableCell>
                        <TableCell>${it.subtotal.toFixed(2)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {current.items.length === 0 && <div className="text-center py-4 text-muted-foreground text-sm">Sin ítems</div>}
              </div>

              <div className="flex items-center justify-end gap-4 text-lg">
                <DollarSign className="h-5 w-5" />
                <span className="font-bold">Total: ${current.total.toFixed(2)}</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Pagos (hasta 3 métodos)</Label>
                  {payments.length < 3 && (
                    <Button size="sm" variant="outline" onClick={addPayment}>
                      <Plus className="h-4 w-4 mr-1" />Agregar pago
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {payments.map((p, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-3">
                        <Label className="text-xs">Método</Label>
                        <Select value={p.method} onValueChange={(v) => updatePayment(i, { method: v as PaymentMethod })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {METHODS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Monto</Label>
                        <Input type="number" value={p.amount} onChange={(e) => updatePayment(i, { amount: Number(e.target.value) || 0 })} />
                      </div>
                      <div className="col-span-5">
                        <Label className="text-xs">Referencia {p.method === "efectivo" ? "(opcional)" : ""}</Label>
                        <Input value={p.reference ?? ""} onChange={(e) => updatePayment(i, { reference: e.target.value })}
                          placeholder={p.method === "transferencia" ? "Folio o banco" : p.method === "tarjeta" ? "Últimos 4 dígitos" : ""} />
                      </div>
                      <div className="col-span-1">
                        {payments.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removePayment(i)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-sm text-muted-foreground">
                  Pagado: ${totalPaid.toFixed(2)} / ${current.total.toFixed(2)} —
                  {Math.abs(totalPaid - current.total) < 0.01 ? " ✅ cuadra" : ` faltan $${(current.total - totalPaid).toFixed(2)}`}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={loading} onClick={handleSaveItems}>Guardar cambios</Button>
                <Button variant="destructive" disabled={loading} onClick={async () => {
                  await cancelSale(current.id); setCurrent(null); await load();
                  toast({ title: "Venta cancelada" });
                }}>Cancelar venta</Button>
                <Button disabled={loading || current.status === "paid"} onClick={handleClose}>Cobrar</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
