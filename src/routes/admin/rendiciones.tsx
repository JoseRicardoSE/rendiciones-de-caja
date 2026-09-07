import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/admin/rendiciones")({
  component: AdminTodasRendicionesScreen,
});

type RendicionAdmin = {
  id: string;
  folio: number;
  titulo: string;
  estado: "borrador" | "enviada" | "aprobada" | "rechazada";
  created_at: string;
  profiles: { nombre_completo: string } | null;
  centros_costo: { nombre: string } | null;
  _total: number;
};

function AdminTodasRendicionesScreen() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rendiciones, setRendiciones] = useState<RendicionAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");

  useEffect(() => {
    if (profile?.rol !== "administrador") {
      window.location.href = "/";
      return;
    }
    fetchRendiciones();
  }, [profile]);

  const fetchRendiciones = async () => {
    setLoading(true);
    
    const { data: rends, error } = await supabase
      .from("rendiciones")
      .select(`
        id, folio, titulo, estado, created_at,
        profiles ( nombre_completo ),
        centros_costo ( nombre )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar rendiciones");
      setLoading(false);
      return;
    }

    const result: RendicionAdmin[] = [];
    for (const r of (rends || [])) {
      const { data: gastos } = await supabase.from("gastos").select("monto").eq("id_rendicion", r.id);
      const total = (gastos || []).reduce((acc, curr) => acc + curr.monto, 0);
      result.push({
        ...r,
        estado: r.estado as any,
        profiles: r.profiles as {nombre_completo: string},
        centros_costo: r.centros_costo as {nombre: string},
        _total: total
      });
    }

    setRendiciones(result);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  const renderBadge = (estado: string) => {
    switch (estado) {
      case "enviada": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">En Revisión</Badge>;
      case "aprobada": return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Aprobada</Badge>;
      case "rechazada": return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazada</Badge>;
      case "borrador": return <Badge variant="secondary">Borrador</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  const filteredRendiciones = rendiciones.filter(r => {
    const matchesSearch = 
      r.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.profiles?.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `rnd-${r.folio}`.includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "todas" || r.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (profile?.rol !== "administrador") return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Todas las Rendiciones</h1>
          <p className="text-sm text-slate-500">Auditoría centralizada de gastos de la empresa.</p>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por título, empleado o folio..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="w-[180px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los estados</SelectItem>
                <SelectItem value="enviada">En Revisión</SelectItem>
                <SelectItem value="aprobada">Aprobadas</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
                <SelectItem value="borrador">Borradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Colaborador</TableHead>
              <TableHead>Centro de Costo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">Cargando...</TableCell>
              </TableRow>
            ) : filteredRendiciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                  No hay rendiciones que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            ) : (
              filteredRendiciones.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-slate-600">RND-{r.folio}</TableCell>
                  <TableCell className="font-medium">{r.profiles?.nombre_completo}</TableCell>
                  <TableCell>{r.centros_costo?.nombre}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(r._total)}</TableCell>
                  <TableCell className="text-center">{renderBadge(r.estado)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate({to: `/rendicion/${r.id}`})}>
                      <Eye className="mr-1 h-4 w-4" /> Ver / Auditar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
