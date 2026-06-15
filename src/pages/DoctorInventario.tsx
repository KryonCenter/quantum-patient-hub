import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  fetchProducts,
  updateProduct,
  fetchInventoryMovements,
  createInventoryMovement,
} from "@/lib/api";
import type { Product, InventoryMovement } from "@/lib/types";
import { AlertTriangle, Package, Plus } from "lucide-react";

export default function DoctorInventario() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productId: "", qty: "0", type: "entrada" as "entrada" | "salida" | "ajuste", reason: "",
  });

  const load = async () => {
    try {
      const [p, m] = await Promise.all([fetchProducts(), fetchInventoryMovements()]);
      setProducts(p.filter((x) => x.kind === "physical"));
      setMovements(m);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  useEffect(() => { load(); }, []);

  const toggleTracking = async (p: Product, value: boolean) => {
    try {
      await updateProduct(p.id, { trackInventory: value });
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const updateMin = async (p: Product, value: number) => {
    try {
      await updateProduct(p.id, { minStock: value });
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const submitMovement = async () => {
    if (!form.productId) { toast({ title: "Selecciona producto", variant: "destructive" }); return; }
    try {
      await createInventoryMovement({
        productId: form.productId,
        qty: Number(form.qty) || 0,
        type: form.type,
        reason: form.reason || undefined,
      });
      toast({ title: "Movimiento registrado" });
      setOpen(false);
      setForm({ productId: "", qty: "0", type: "entrada", reason: "" });
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventario</h1>
            <p className="text-muted-foreground">Volumen de productos físicos</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" />Movimiento</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nuevo movimiento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Producto</Label>
                  <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre} (stock {p.stock})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada (+)</SelectItem>
                      <SelectItem value="salida">Salida (-)</SelectItem>
                      <SelectItem value="ajuste">Ajuste (fijar stock)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <Input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
                </div>
                <div>
                  <Label>Motivo</Label>
                  <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="Compra, merma, conteo físico..." />
                </div>
                <Button className="w-full" onClick={submitMovement}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle><Package className="inline h-5 w-5 mr-1" />Stock</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Producto</TableHead><TableHead>Stock</TableHead>
                <TableHead>Mínimo</TableHead><TableHead>Rastrear</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.nombre}</TableCell>
                    <TableCell>
                      {p.stock}
                      {p.trackInventory && p.stock <= (p.minStock ?? 0) && (
                        <Badge variant="destructive" className="ml-2">
                          <AlertTriangle className="h-3 w-3 mr-1" />Bajo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input type="number" className="w-24" defaultValue={p.minStock ?? 0}
                        onBlur={(e) => updateMin(p, Number(e.target.value) || 0)} />
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!p.trackInventory} onCheckedChange={(v) => toggleTracking(p, v)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {products.length === 0 && <div className="text-center py-6 text-muted-foreground text-sm">No tienes productos físicos. Agrégalos desde Productos.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Movimientos recientes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Fecha</TableHead><TableHead>Producto</TableHead>
                <TableHead>Tipo</TableHead><TableHead>Cantidad</TableHead><TableHead>Motivo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {movements.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{new Date(m.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{m.productName}</TableCell>
                    <TableCell><Badge variant="outline">{m.type}</Badge></TableCell>
                    <TableCell>{m.qty}</TableCell>
                    <TableCell>{m.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {movements.length === 0 && <div className="text-center py-6 text-muted-foreground text-sm">Sin movimientos</div>}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
