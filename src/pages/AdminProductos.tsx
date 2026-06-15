import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Package, DollarSign, Activity, Search, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductKind } from "@/lib/types";
import { createProduct, deleteProduct, fetchProducts } from "@/lib/api";

const AdminProductos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [newProduct, setNewProduct] = useState({
    nombre: "", precio: "", stock: "", descripcion: "",
    kind: "service" as ProductKind,
    trackInventory: false, minStock: "0",
  });

  const load = async () => {
    try { setProducts(await fetchProducts()); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!newProduct.nombre) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    try {
      await createProduct({
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion,
        precio: parseFloat(newProduct.precio) || 0,
        stock: newProduct.kind === "service" ? 0 : (parseInt(newProduct.stock) || 0),
        kind: newProduct.kind,
        trackInventory: newProduct.kind === "physical" ? newProduct.trackInventory : false,
        minStock: parseInt(newProduct.minStock) || 0,
      });
      setIsDialogOpen(false);
      setNewProduct({ nombre: "", precio: "", stock: "", descripcion: "", kind: "service", trackInventory: false, minStock: "0" });
      toast({ title: "Agregado" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    try {
      await deleteProduct(id);
      toast({ title: "Eliminado" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(search.toLowerCase())
  );
  const services = products.filter((p) => p.kind === "service").length;
  const physical = products.filter((p) => p.kind === "physical").length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Productos y Servicios</h1>
            <p className="text-muted-foreground">Catálogo de tu consultorio</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Nuevo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar Producto o Servicio</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newProduct.kind} onValueChange={(v) => setNewProduct({ ...newProduct, kind: v as ProductKind })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Servicio (ej. limpieza dental, terapia)</SelectItem>
                      <SelectItem value="physical">Producto físico (ej. brackets, vitaminas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Nombre</Label>
                  <Input value={newProduct.nombre} onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })} /></div>
                <div><Label>Precio</Label>
                  <Input type="number" value={newProduct.precio} onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })} /></div>
                {newProduct.kind === "physical" && (
                  <>
                    <div><Label>Stock inicial</Label>
                      <Input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} /></div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <Label>Controlar inventario</Label>
                        <p className="text-xs text-muted-foreground">Descuenta stock al vender y avisa cuando esté bajo</p>
                      </div>
                      <input type="checkbox" checked={newProduct.trackInventory}
                        onChange={(e) => setNewProduct({ ...newProduct, trackInventory: e.target.checked })}
                        className="h-4 w-4" />
                    </div>
                    {newProduct.trackInventory && (
                      <div><Label>Stock mínimo</Label>
                        <Input type="number" value={newProduct.minStock} onChange={(e) => setNewProduct({ ...newProduct, minStock: e.target.value })} /></div>
                    )}
                  </>
                )}
                <div><Label>Descripción</Label>
                  <Textarea value={newProduct.descripcion} onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })} /></div>
                <Button onClick={handleAdd} className="w-full">Agregar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total" value={products.length} icon={Package} colorClass="bg-primary/10" />
          <StatCard title="Servicios" value={services} icon={Activity} colorClass="bg-emerald-100" />
          <StatCard title="Productos" value={physical} icon={DollarSign} colorClass="bg-blue-100" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card><CardContent className="p-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nombre</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Precio</TableHead><TableHead>Stock</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nombre}<div className="text-xs text-muted-foreground">{p.descripcion}</div></TableCell>
                  <TableCell><Badge variant={p.kind === "service" ? "default" : "secondary"}>{p.kind === "service" ? "Servicio" : "Producto"}</Badge></TableCell>
                  <TableCell>${p.precio.toLocaleString()}</TableCell>
                  <TableCell>{p.kind === "service" ? "—" : p.stock}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">Sin registros</div>}
        </CardContent></Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminProductos;
