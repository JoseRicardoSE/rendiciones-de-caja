import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/centros-costo")({
  component: CentrosCostoScreen,
});

type CentroCosto = {
  id: string;
  nombre: string;
  presupuesto: number;
  estado: "activo" | "inactivo";
};

function CentrosCostoScreen() {
  const { profile } = useAuth();
  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal de Creación/Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ nombre: "", presupuesto: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile?.rol !== "administrador") {
      window.location.href = "/";
      return;
    }
    fetchCentros();
  }, [profile]);

  const fetchCentros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("centros_costo")
      .select("*")
      .order("nombre");

    if (error) {
      toast.error("Error al cargar centros de costo");
    } else {
      setCentros(data as CentroCosto[]);
    }
    setLoading(false);
  };

  const openModal = (centro?: CentroCosto) => {
    if (centro) {
      setEditingId(centro.id);
      setFormData({ nombre: centro.nombre, presupuesto: centro.presupuesto });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", presupuesto: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (formData.presupuesto < 0) {
      toast.error("El presupuesto no puede ser negativo");
      return;
    }

    setIsSaving(true);
    if (editingId) {
      // Actualizar
      const { error } = await supabase
        .from("centros_costo")
        .update({ nombre: formData.nombre, presupuesto: formData.presupuesto })
        .eq("id", editingId);
        
      if (error) toast.error("Error al actualizar");
      else {
        toast.success("Centro de costo actualizado");
        setIsModalOpen(false);
        fetchCentros();
      }
    } else {
      // Crear
      const { error } = await supabase
        .from("centros_costo")
        .insert([{ nombre: formData.nombre, presupuesto: formData.presupuesto, estado: "activo" }]);
        
      if (error) toast.error("Error al crear");
      else {
        toast.success("Centro de costo creado");
        setIsModalOpen(false);
        fetchCentros();
      }
    }
    setIsSaving(false);
  };

  const toggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === "activo" ? "inactivo" : "activo";
    const { error } = await supabase
      .from("centros_costo")
      .update({ estado: nuevoEstado })
      .eq("id", id);
      
    if (error) {
      toast.error("Error al cambiar estado");
    } else {
      toast.success(`Centro de costo marcado como ${nuevoEstado}`);
      setCentros(centros.map(c => c.id === id ? { ...c, estado: nuevoEstado as any } : c));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  const filteredCentros = centros.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.rol !== "administrador") return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Centros de Costo</h1>
          <p className="text-sm text-slate-500">Estructura presupuestaria de la organización</p>
        </div>
        <Button className="bg-slate-900" onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo centro
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Presupuesto Mensual</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                  Cargando centros de costo...
                </TableCell>
              </TableRow>
            ) : filteredCentros.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-slate-500">
                  No se encontraron resultados.
                </TableCell>
              </TableRow>
            ) : (
              filteredCentros.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nombre}</TableCell>
                  <TableCell className="text-slate-600">{formatCurrency(c.presupuesto)}</TableCell>
                  <TableCell>
                    <Badge variant={c.estado === "activo" ? "default" : "secondary"} className={c.estado === "activo" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                      {c.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(c)}>
                        <Pencil className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className={c.estado === "activo" ? "text-red-600 hover:text-red-700" : "text-emerald-600 hover:text-emerald-700"}
                        onClick={() => toggleEstado(c.id, c.estado)}
                      >
                        {c.estado === "activo" ? (
                          <><Ban className="h-4 w-4 mr-1" /> Desactivar</>
                        ) : (
                          <><CheckCircle className="h-4 w-4 mr-1" /> Activar</>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Centro de Costo" : "Nuevo Centro de Costo"}</DialogTitle>
            <DialogDescription>
              Administra la bolsa presupuestaria a la cual los colaboradores pueden rendir gastos.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre del Centro</Label>
              <Input 
                id="nombre" 
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Marketing Corporativo" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="presupuesto">Presupuesto Mensual ($)</Label>
              <Input 
                id="presupuesto" 
                type="number" 
                min="0"
                value={formData.presupuesto}
                onChange={(e) => setFormData({...formData, presupuesto: Number(e.target.value)})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-slate-900">
              {isSaving ? "Guardando..." : "Guardar Centro de Costo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
