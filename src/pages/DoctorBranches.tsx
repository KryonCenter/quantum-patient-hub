import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Plus, Pencil, Trash2, MapPin, Phone, DoorOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  createBranch, deleteBranch, fetchBranches, updateBranch,
  fetchBranchRooms, createBranchRoom, updateBranchRoom, deleteBranchRoom,
} from "@/lib/api";
import type { Branch, BranchRoom } from "@/lib/types";

const empty = { name: "", address: "", city: "", phone: "", isPrimary: false, roomCount: 1 };

const DoctorBranches = () => {
  const { toast } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rooms, setRooms] = useState<BranchRoom[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(empty);
  const [newRoom, setNewRoom] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const [b, r] = await Promise.all([fetchBranches(), fetchBranchRooms()]);
      setBranches(b);
      setRooms(r);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => {
    if (branches.length >= 5) {
      toast({ title: "Límite alcanzado", description: "Máximo 5 sucursales", variant: "destructive" });
      return;
    }
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (b: Branch) => {
    setEditing(b);
    setForm({
      name: b.name, address: b.address, city: b.city ?? "", phone: b.phone ?? "",
      isPrimary: b.isPrimary, roomCount: b.roomCount ?? 1,
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      if (editing) {
        await updateBranch({ ...editing, ...form });
        toast({ title: "Sucursal actualizada" });
      } else {
        await createBranch(form);
        toast({ title: "Sucursal creada" });
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta sucursal?")) return;
    try { await deleteBranchRooms(id); await deleteBranch(id); toast({ title: "Sucursal eliminada" }); await load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  // little helper since cascade handles deletion at DB level already
  async function deleteBranchRooms(_branchId: string) { /* DB cascade handles it */ }

  const addRoom = async (branchId: string) => {
    const name = (newRoom[branchId] || "").trim();
    if (!name) return;
    try {
      await createBranchRoom({ branchId, name });
      setNewRoom({ ...newRoom, [branchId]: "" });
      await load();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const renameRoom = async (room: BranchRoom, name: string) => {
    try { await updateBranchRoom(room.id, { name }); await load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const removeRoom = async (id: string) => {
    if (!confirm("¿Eliminar este consultorio?")) return;
    try { await deleteBranchRoom(id); await load(); }
    catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sucursales</h1>
            <p className="text-muted-foreground">Gestiona hasta 5 sucursales y sus consultorios. {branches.length}/5</p>
          </div>
          <Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva sucursal</Button>
        </div>

        {branches.length === 0 ? (
          <Card><CardContent className="p-12 text-center">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">No has creado sucursales</p>
            <Button onClick={openNew}>Crear primera sucursal</Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {branches.map((b) => {
              const bRooms = rooms.filter((r) => r.branchId === b.id);
              return (
                <Card key={b.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{b.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />{b.address}{b.city && `, ${b.city}`}</div>
                    {b.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{b.phone}</div>}
                    {b.isPrimary && <div className="text-xs text-primary font-medium">★ Principal</div>}

                    <div className="border-t pt-3 space-y-2">
                      <div className="flex items-center gap-2 font-medium">
                        <DoorOpen className="h-4 w-4 text-primary" /> Consultorios ({bRooms.length})
                      </div>
                      <div className="space-y-1">
                        {bRooms.map((r) => (
                          <div key={r.id} className="flex items-center gap-2">
                            <Input
                              defaultValue={r.name}
                              onBlur={(e) => e.target.value !== r.name && renameRoom(r, e.target.value)}
                              className="h-8"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeRoom(r.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nuevo consultorio (ej. Consultorio 1)"
                          value={newRoom[b.id] || ""}
                          onChange={(e) => setNewRoom({ ...newRoom, [b.id]: e.target.value })}
                          className="h-8"
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRoom(b.id))}
                        />
                        <Button size="sm" onClick={() => addRoom(b.id)}><Plus className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar sucursal" : "Nueva sucursal"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Sucursal Centro" /></div>
            <div><Label>Dirección</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Av. Principal 123" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Ciudad</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Teléfono</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div>
              <Label>Número de consultorios</Label>
              <Input type="number" min={1} max={20} value={form.roomCount}
                onChange={(e) => setForm({ ...form, roomCount: Math.max(1, parseInt(e.target.value || "1")) })} />
              <p className="text-xs text-muted-foreground mt-1">Solo informativo. Los consultorios individuales se administran desde la tarjeta de la sucursal.</p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="primary" checked={form.isPrimary} onCheckedChange={(c) => setForm({ ...form, isPrimary: c as boolean })} />
              <Label htmlFor="primary" className="cursor-pointer">Sucursal principal</Label>
            </div>
            <Button onClick={save} className="w-full" disabled={!form.name || !form.address}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default DoctorBranches;
