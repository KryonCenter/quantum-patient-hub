import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LogOut, Plus, Edit, Trash2 } from "lucide-react";
import { PatientDialog } from "@/components/PatientDialog";
import { useToast } from "@/hooks/use-toast";

export interface Patient {
  id: string;
  nombre: string;
  telefono: string;
  correo: string;
  tipoPago: string;
  observaciones: string;
  producto: string;
  fechaRegistro: string;
  escaneoQuantico: boolean;
  citas?: Appointment[];
}

export interface Appointment {
  id: string;
  fecha: string;
  hora: string;
  motivo: string;
  estado: "pendiente" | "completada" | "cancelada";
}

const mockPatients: Patient[] = [
  {
    id: "1",
    nombre: "María García López",
    telefono: "+52 555 1234 5678",
    correo: "maria.garcia@example.com",
    tipoPago: "Tarjeta",
    observaciones: "Primera consulta, interesada en tratamiento integral",
    producto: "Terapia Cuántica Básica",
    fechaRegistro: "2025-11-20",
    escaneoQuantico: true,
  },
  {
    id: "2",
    nombre: "Juan Pérez Martínez",
    telefono: "+52 555 8765 4321",
    correo: "juan.perez@example.com",
    tipoPago: "Efectivo",
    observaciones: "Seguimiento mensual",
    producto: "Suplementos Vitamínicos",
    fechaRegistro: "2025-11-18",
    escaneoQuantico: false,
  },
  {
    id: "3",
    nombre: "Ana Rodríguez Silva",
    telefono: "+52 555 2468 1357",
    correo: "ana.rodriguez@example.com",
    tipoPago: "Transferencia",
    observaciones: "Paciente recurrente, excelente respuesta al tratamiento",
    producto: "Terapia Cuántica Premium",
    fechaRegistro: "2025-11-15",
    escaneoQuantico: true,
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>(mockPatients);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate("/login");
  };

  const handleAddPatient = (patient: Omit<Patient, "id">) => {
    const newPatient = {
      ...patient,
      id: Date.now().toString(),
    };
    setPatients([...patients, newPatient]);
    toast({
      title: "Paciente agregado",
      description: "El paciente ha sido registrado exitosamente",
    });
  };

  const handleEditPatient = (patient: Patient) => {
    setPatients(patients.map(p => p.id === patient.id ? patient : p));
    toast({
      title: "Paciente actualizado",
      description: "Los datos del paciente han sido actualizados",
    });
  };

  const handleDeletePatient = (id: string) => {
    setPatients(patients.filter(p => p.id !== id));
    toast({
      title: "Paciente eliminado",
      description: "El registro ha sido eliminado exitosamente",
    });
  };

  const openEditDialog = (patient: Patient) => {
    setEditingPatient(patient);
    setIsDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingPatient(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription>Total Pacientes</CardDescription>
              <CardTitle className="text-3xl">{patients.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Con Escaneo Cuántico</CardDescription>
              <CardTitle className="text-3xl">
                {patients.filter(p => p.escaneoQuantico).length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Registros Este Mes</CardDescription>
              <CardTitle className="text-3xl">{patients.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Registro de Pacientes</CardTitle>
                <CardDescription>Gestiona la información de los pacientes</CardDescription>
              </div>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Tipo Pago</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Escaneo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.nombre}</TableCell>
                    <TableCell>{patient.telefono}</TableCell>
                    <TableCell>{patient.correo}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{patient.tipoPago}</Badge>
                    </TableCell>
                    <TableCell>{patient.producto}</TableCell>
                    <TableCell>{new Date(patient.fechaRegistro).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {patient.escaneoQuantico ? (
                        <Badge>Sí</Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(patient)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePatient(patient.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      <PatientDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={editingPatient ? handleEditPatient : handleAddPatient}
        patient={editingPatient}
      />
    </div>
  );
};

export default AdminDashboard;
