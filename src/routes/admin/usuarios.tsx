import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Plus, Upload, Building } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({
  component: AdminUsuariosScreen,
});

type CentroCosto = {
  id: string;
  nombre: string;
};

type UserProfile = {
  id: string;
  nombre_completo: string;
  correo: string | null;
  cargo: string | null;
  rol: "administrador" | "usuario";
  estado: "activo" | "inactivo";
  asignaciones_centro?: { centros_costo: CentroCosto }[];
};

function AdminUsuariosScreen() {
  const { profile, session } = useAuth();
  const [usuarios, setUsuarios] = useState<UserProfile[]>([]);
  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para Asignación de Obras
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedCentrosIds, setSelectedCentrosIds] = useState<string[]>([]);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);

  useEffect(() => {
    if (profile?.rol !== "administrador") {
      window.location.href = "/";
      return;
    }
    fetchUsuarios();
    fetchCentros();
  }, [profile]);

  const fetchCentros = async () => {
    const { data } = await supabase.from("centros_costo").select("id, nombre").eq("estado", "activo");
    if (data) setCentros(data);
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*, asignaciones_centro(centros_costo(id, nombre))")
      .order("nombre_completo");
      
    if (error) {
      toast.error("Error al cargar usuarios");
    } else {
      setUsuarios(data as unknown as UserProfile[]);
    }
    setLoading(false);
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "activo" ? "inactivo" : "activo";
    const { error } = await supabase.from("profiles").update({ estado: newStatus }).eq("id", id);
    if (error) toast.error("Error al actualizar estado");
    else fetchUsuarios();
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "administrador" ? "usuario" : "administrador";
    const { error } = await supabase.from("profiles").update({ rol: newRole }).eq("id", id);
    if (error) toast.error("Error al actualizar rol");
    else fetchUsuarios();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Procesando archivo CSV...");
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) throw new Error("El archivo CSV está vacío o no tiene datos.");
        
        const usuariosAImportar = [];
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',');
          if (row.length >= 2) {
            usuariosAImportar.push({
              email: row[0].trim(),
              password: row[1].trim(),
              nombre_completo: row[2] ? row[2].trim() : "",
              cargo: row[3] ? row[3].trim() : "Colaborador",
            });
          }
        }

        const { data, error } = await supabase.functions.invoke('import-users', {
          body: { usuarios: usuariosAImportar },
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });

        if (error) throw new Error(error.message);
        if (data.error) throw new Error(data.error);

        toast.success(`Se procesaron ${usuariosAImportar.length} usuarios.`, { id: toastId });
        fetchUsuarios();
      } catch (err: any) {
        toast.error("Error al importar: " + err.message, { id: toastId });
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const openAssignModal = (user: UserProfile) => {
    setSelectedUser(user);
    const assignedIds = user.asignaciones_centro?.map(a => a.centros_costo.id) || [];
    setSelectedCentrosIds(assignedIds);
    setIsAssignModalOpen(true);
  };

  const saveAssignments = async () => {
    if (!selectedUser) return;
    setIsSavingAssignments(true);

    try {
      // 1. Borrar asignaciones previas
      await supabase.from("asignaciones_centro").delete().eq("id_usuario", selectedUser.id);
      
      // 2. Insertar nuevas
      if (selectedCentrosIds.length > 0) {
        const inserts = selectedCentrosIds.map(cid => ({
          id_usuario: selectedUser.id,
          id_centro_costo: cid
        }));
        const { error } = await supabase.from("asignaciones_centro").insert(inserts);
        if (error) throw error;
      }
      
      toast.success("Obras asignadas correctamente");
      setIsAssignModalOpen(false);
      fetchUsuarios(); // Recargar para ver los badges
    } catch (err: any) {
      toast.error("Error al asignar obras: " + err.message);
    } finally {
      setIsSavingAssignments(false);
    }
  };

  const toggleCentroSelection = (centroId: string, checked: boolean) => {
    if (checked) setSelectedCentrosIds([...selectedCentrosIds, centroId]);
    else setSelectedCentrosIds(selectedCentrosIds.filter(id => id !== centroId));
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.correo && u.correo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (profile?.rol !== "administrador") return null;

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500">Administra el acceso y asignación de obras a los colaboradores.</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
          />
          <Button variant="outline" className="bg-white" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4 text-blue-600" /> Importar CSV
          </Button>
          <Button className="bg-slate-900">
            <Plus className="mr-2 h-4 w-4" /> Nuevo usuario
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre completo</TableHead>
              <TableHead>Obras Asignadas</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">Cargando usuarios...</TableCell>
              </TableRow>
            ) : filteredUsuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">No se encontraron usuarios.</TableCell>
              </TableRow>
            ) : (
              filteredUsuarios.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.nombre_completo}
                    <div className="text-xs text-slate-500 font-normal">{u.cargo}</div>
                  </TableCell>
                  <TableCell>
                    {u.rol === "administrador" ? (
                      <span className="text-xs text-slate-400 italic">Acceso Global</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[250px]">
                        {u.asignaciones_centro?.length === 0 ? (
                          <span className="text-xs text-slate-400">Sin asignaciones</span>
                        ) : (
                          u.asignaciones_centro?.map((a, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-slate-50">
                              {a.centros_costo.nombre}
                            </Badge>
                          ))
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-500">{u.correo}</TableCell>
                  <TableCell>
                    {u.rol === "administrador" ? (
                      <span className="font-medium text-blue-700">Administrador</span>
                    ) : "Usuario"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.estado === "activo" ? "default" : "secondary"} className={u.estado === "activo" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}>
                      {u.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openAssignModal(u)}>
                          <Building className="mr-2 h-4 w-4" /> Asignar Obras
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleRole(u.id, u.rol)}>
                          Hacer {u.rol === "administrador" ? "Usuario" : "Administrador"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => toggleStatus(u.id, u.estado)}
                          className={u.estado === "activo" ? "text-red-600" : "text-emerald-600"}
                        >
                          {u.estado === "activo" ? "Desactivar usuario" : "Activar usuario"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Obras a {selectedUser?.nombre_completo}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-slate-500 mb-4">
              Selecciona los centros de costo en los que este trabajador está autorizado a rendir gastos.
            </p>
            {centros.length === 0 ? (
              <p className="text-sm text-red-500">No hay centros de costo activos en el sistema.</p>
            ) : (
              centros.map((centro) => (
                <div key={centro.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`centro-${centro.id}`} 
                    checked={selectedCentrosIds.includes(centro.id)}
                    onCheckedChange={(checked) => toggleCentroSelection(centro.id, checked as boolean)}
                  />
                  <Label htmlFor={`centro-${centro.id}`} className="font-normal cursor-pointer">
                    {centro.nombre}
                  </Label>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
            <Button onClick={saveAssignments} disabled={isSavingAssignments}>
              {isSavingAssignments ? "Guardando..." : "Guardar Asignaciones"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
