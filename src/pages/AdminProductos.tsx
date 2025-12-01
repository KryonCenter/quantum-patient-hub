import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Package, DollarSign, TrendingUp, Search, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
}

const AdminProductos = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({
    nombre: "",
    precio: "",
    stock: "",
    descripcion: "",
  });

  useEffect(() => {
    const savedProducts = localStorage.getItem("products");
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      const initialProducts = [
        { id: "1", nombre: "Suplemento A", precio: 250, stock: 45, descripcion: "Suplemento vitamínico" },
        { id: "2", nombre: "Terapia Cuántica", precio: 500, stock: 30, descripcion: "Sesión de terapia" },
        { id: "3", nombre: "Producto B", precio: 150, stock: 60, descripcion: "Producto natural" },
      ];
      localStorage.setItem("products", JSON.stringify(initialProducts));
      setProducts(initialProducts);
    }
  }, []);

  const handleAddProduct = () => {
    const product: Product = {
      id: Date.now().toString(),
      nombre: newProduct.nombre,
      precio: parseFloat(newProduct.precio),
      stock: parseInt(newProduct.stock),
      descripcion: newProduct.descripcion,
    };
    const updatedProducts = [...products, product];
    setProducts(updatedProducts);
    localStorage.setItem("products", JSON.stringify(updatedProducts));
    setIsDialogOpen(false);
    setNewProduct({ nombre: "", precio: "", stock: "", descripcion: "" });
    toast({
      title: "Producto agregado",
      description: "El producto ha sido registrado exitosamente",
    });
  };

  const totalValue = products.reduce((sum, p) => sum + p.precio * p.stock, 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  return (
    <DashboardLayout userRole="admin" userName="Administrador">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Productos</h1>
            <p className="text-muted-foreground">Administra el inventario de productos</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre del Producto</Label>
                  <Input
                    id="nombre"
                    value={newProduct.nombre}
                    onChange={(e) => setNewProduct({ ...newProduct, nombre: e.target.value })}
                    placeholder="Nombre del producto"
                  />
                </div>
                <div>
                  <Label htmlFor="precio">Precio</Label>
                  <Input
                    id="precio"
                    type="number"
                    value={newProduct.precio}
                    onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Input
                    id="descripcion"
                    value={newProduct.descripcion}
                    onChange={(e) => setNewProduct({ ...newProduct, descripcion: e.target.value })}
                    placeholder="Descripción del producto"
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Agregar Producto
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Productos" value={products.length} icon={Package} colorClass="bg-primary/10" />
          <StatCard title="Stock Total" value={totalStock} icon={TrendingUp} colorClass="bg-emerald-100" />
          <StatCard
            title="Valor Inventario"
            value={`$${totalValue.toLocaleString()}`}
            icon={DollarSign}
            colorClass="bg-blue-100"
          />
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar producto..." className="pl-10" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
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
                {products.map((product) => (
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminProductos;
