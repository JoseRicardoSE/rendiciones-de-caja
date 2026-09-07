import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/borradores")({
  component: BorradoresScreen,
});

type RendicionBorrador = {
  id: string;
  folio: number;
  titulo: string;
  created_at: string;
  centros_costo: { nombre: string } | null;
  _count: number;
  _total: number;
};

function BorradoresScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [borradores, setBorradores] = useState<RendicionBorrador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchBorradores();
  }, [user]);

  const fetchBorradores = async () => {
    setLoading(true);
    
    // Traer borradores del usuario
    const { data: rends, error } = await supabase
      .from("rendiciones")
      .select(`
        id, folio, titulo, created_at,
        centros_costo ( nombre )
      `)
      .eq("id_usuario", user?.id)
      .eq("estado", "borrador")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar borradores");
      setLoading(false);
      return;
    }

    // Para cada borrador, calcular cantidad de gastos y total (lo hacemos simple con un fetch extra por ahora, en prod mejor una vista o RPC)
    const result: RendicionBorrador[] = [];
    for (const r of (rends || [])) {
      const { data: gastos } = await supabase.from("gastos").select("monto").eq("id_rendicion", r.id);
      const total = (gastos || []).reduce((acc, curr) => acc + curr.monto, 0);
      result.push({
        ...r,
        centros_costo: r.centros_costo as {nombre: string},
        _count: gastos?.length || 0,
        _total: total
      });
    }

    setBorradores(result);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("¿Estás seguro de eliminar este borrador? Todos los gastos asociados se perderán.")) return;
    const { error } = await supabase.from("rendiciones").delete().eq("id", id);
    if(error) toast.error("Error al eliminar borrador");
    else {
      toast.success("Borrador eliminado");
      setBorradores(borradores.filter(b => b.id !== id));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Borradores</h1>
          <p className="text-sm text-slate-500">Rendiciones en preparación. Aún no han sido enviadas.</p>
        </div>
        <Button className="bg-slate-900" onClick={() => navigate({to: "/nueva-rendicion"})}>
          Crear Nueva
        </Button>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Centro de Costo</TableHead>
              <TableHead className="text-center">Boletas</TableHead>
              <TableHead className="text-right">Total Acumulado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">Cargando...</TableCell>
              </TableRow>
            ) : borradores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="mb-2">No tienes borradores pendientes.</p>
                    <Button variant="outline" size="sm" onClick={() => navigate({to: "/nueva-rendicion"})}>Empezar una rendición</Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              borradores.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium text-slate-600">RND-{b.folio}</TableCell>
                  <TableCell className="font-semibold">{b.titulo}</TableCell>
                  <TableCell>{b.centros_costo?.nombre}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{b._count}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(b._total)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate({to: `/rendicion/${b.id}`})}>
                        <FileEdit className="mr-2 h-4 w-4" /> Continuar
                      </Button>
                    </div>
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
