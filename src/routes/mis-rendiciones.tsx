import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertCircle, Download, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/mis-rendiciones")({
  component: MisRendicionesScreen,
});

type RendicionHistorial = {
  id: string;
  folio: number;
  titulo: string;
  estado: "enviada" | "aprobada" | "rechazada";
  created_at: string;
  centros_costo: { nombre: string } | null;
  _count: number;
  _total: number;
};

function MisRendicionesScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [historial, setHistorial] = useState<RendicionHistorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("todas");

  useEffect(() => {
    if (!user) return;
    fetchHistorial();
  }, [user]);

  const fetchHistorial = async () => {
    setLoading(true);
    
    // Traer enviadas, aprobadas y rechazadas
    const { data: rends, error } = await supabase
      .from("rendiciones")
      .select(`
        id, folio, titulo, estado, created_at,
        centros_costo ( nombre )
      `)
      .eq("id_usuario", user?.id)
      .in("estado", ["enviada", "aprobada", "rechazada"])
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar el historial");
      setLoading(false);
      return;
    }

    const result: RendicionHistorial[] = [];
    for (const r of (rends || [])) {
      const { data: gastos } = await supabase.from("gastos").select("monto").eq("id_rendicion", r.id);
      const total = (gastos || []).reduce((acc, curr) => acc + curr.monto, 0);
      result.push({
        ...r,
        estado: r.estado as any,
        centros_costo: r.centros_costo as unknown as {nombre: string},
        _count: gastos?.length || 0,
        _total: total
      });
    }

    setHistorial(result);
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
      default: return <Badge>{estado}</Badge>;
    }
  };

  const estadoLabel = (estado: string) =>
    estado === "enviada" ? "En Revisión" : estado === "aprobada" ? "Aprobada" : estado === "rechazada" ? "Rechazada" : estado;

  const filtered = historial.filter((r) => statusFilter === "todas" || r.estado === statusFilter);

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("No hay datos para exportar"); return; }
    const rows = [
      ["Folio", "Título", "Centro de Costo", "Estado", "Total"],
      ...filtered.map((r) => [
        `RND-${r.folio}`,
        r.titulo,
        r.centros_costo?.nombre ?? "",
        estadoLabel(r.estado),
        String(r._total),
      ]),
    ];
    const csv = rows.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mis-rendiciones-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (filtered.length === 0) { toast.error("No hay datos para exportar"); return; }
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Mis Rendiciones", 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Estado: ${statusFilter === "todas" ? "Todos" : estadoLabel(statusFilter)} — ${new Date().toLocaleDateString("es-CL")}`,
      14,
      22,
    );
    autoTable(doc, {
      startY: 28,
      head: [["Folio", "Título", "Centro de Costo", "Estado", "Total"]],
      body: filtered.map((r) => [
        `RND-${r.folio}`,
        r.titulo,
        r.centros_costo?.nombre ?? "",
        estadoLabel(r.estado),
        formatCurrency(r._total),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
    });
    doc.save(`mis-rendiciones-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mis Rendiciones</h1>
          <p className="text-sm text-slate-500">Historial de tus rendiciones enviadas, aprobadas y rechazadas.</p>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b flex flex-wrap items-center gap-3">
          <div className="w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos los estados</SelectItem>
                <SelectItem value="aprobada">Aprobadas</SelectItem>
                <SelectItem value="enviada">En Revisión</SelectItem>
                <SelectItem value="rechazada">Rechazadas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF}>
              <FileDown className="mr-1 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Folio</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Centro de Costo</TableHead>
              <TableHead className="text-center">Estado</TableHead>
              <TableHead className="text-right">Total Solicitado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-slate-500">Cargando...</TableCell>
              </TableRow>
            ) : historial.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-slate-500">
                  No has enviado ninguna rendición todavía.
                </TableCell>
              </TableRow>
            ) : (
              historial.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-slate-600">RND-{r.folio}</TableCell>
                  <TableCell className="font-semibold">{r.titulo}</TableCell>
                  <TableCell>{r.centros_costo?.nombre}</TableCell>
                  <TableCell className="text-center">{renderBadge(r.estado)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(r._total)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => navigate({to: `/rendicion/${r.id}`})}>
                      {r.estado === "rechazada" ? (
                        <><AlertCircle className="mr-1 h-4 w-4 text-red-500" /> Corregir</>
                      ) : (
                        <><Eye className="mr-1 h-4 w-4" /> Ver Detalle</>
                      )}
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
