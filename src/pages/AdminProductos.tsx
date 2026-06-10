import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Package, DollarSign, TrendingUp, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "@/lib/types";
import { createProduct, fetchProducts } from "@/lib/api";

const AdminProductos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [newProduct, setNewProduct] = useState({ nombre: "", precio: "", stock: "", descripcion: "" });

  const load = async () => {
    try { setProducts(await fetchProducts()); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  useEffect(() => { load(); }, []);

  const handleAddProduct = async () => {
    if (!newProduct.nombre) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }
    try {
      await createProduct({
        nombre: newProduct.nombre,
        descripcion: newProduct.descripcion,
        precio: parseFloat(newProduct.precio) || 0,
        stock: parseInt(newProduct.stock) || 0,
      });
      setIsDialogOpen(false);
      setNewProduct({ nombre: "", precio: "", stock: "", descripcion: "" });
      toast({ title: "Producto agregado", description: "Registrado exitosamente" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const filtered = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.descripcion.toLowerCase().includes(search.toLowerCase())
  );
  const totalValue = products.reduce((sum, p) => sum + p.precio * p.stock, 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Productos</h1>
            <p className="text-muted-foreground">Administra el inventario de productos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Agregar Nuevo Producto</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Producto</Label>
                  <Input id="nombre" value={newProduct.nombre}
                    onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="precio">Precio</Label>
                  <Input id="precio" type="number" value={newProduct.precio}
                    onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" type="number" value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea id="descripcion" value={newProduct.descripcion}
                    onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })} />
                </div>
                <Button onClick={handleAddProduct} className="w-full">Agregar Producto</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Productos" value={products.length} icon={Package} colorClass="bg-primary/10" />
          <StatCard title="Stock Total" value={totalStock} icon={TrendingUp} colorClass="bg-emerald-100" />
          <StatCard title="Valor Inventario" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-100" />
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar producto..." className="pl-10"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Valor Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.nombre}</TableCell>
                    <TableCell>{product.descripcion}</TableCell>
                    <TableCell>${product.precio.toLocaleString()}</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>${(product.precio * product.stock).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No hay productos</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminProductos;

// Re-export type for legacy imports
export type { Product } from "@/lib/types";
