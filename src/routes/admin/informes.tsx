import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { ArrowDownToLine, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/informes")({
  component: InformesGeneralesScreen,
});

type InformeData = {
  id_centro: string;
  nombre_centro: string;
  presupuesto: number;
  ejecutado: number;
  saldo: number;
};

function InformesGeneralesScreen() {
  const { profile } = useAuth();
  const [datos, setDatos] = useState<InformeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.rol !== "administrador") {
      window.location.href = "/";
      return;
    }
    fetchInformes();
  }, [profile]);

  const fetchInformes = async () => {
    setLoading(true);
    
    // 1. Obtener centros de costo y su presupuesto
    const { data: centros, error: errC } = await supabase.from("centros_costo").select("id, nombre, presupuesto").order("nombre");
    if (errC) {
      toast.error("Error al cargar centros de costo");
      setLoading(false);
      return;
    }

    // 2. Obtener gastos de rendiciones APROBADAS en el mes actual
    // Para ser precisos, filtramos por mes actual (o podríamos poner un filtro de fecha, simplificaremos a mes actual)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const { data: rends, error: errR } = await supabase
      .from("rendiciones")
      .select("id, id_centro_costo")
      .eq("estado", "aprobada")
      .gte("created_at", startOfMonth.toISOString());
      
    if (errR) {
      toast.error("Error al cargar rendiciones");
      setLoading(false);
      return;
    }

    const rendIds = (rends || []).map(r => r.id);
    let gastosData: any[] = [];
    
    if (rendIds.length > 0) {
      const { data: gastos } = await supabase.from("gastos").select("id_rendicion, monto").in("id_rendicion", rendIds);
      gastosData = gastos || [];
    }

    // Mapear gastos al centro de costo
    const gastoPorCentro: Record<string, number> = {};
    gastosData.forEach(g => {
      // buscar el centro de la rendicion
      const ren = rends.find(r => r.id === g.id_rendicion);
      if (ren) {
        gastoPorCentro[ren.id_centro_costo] = (gastoPorCentro[ren.id_centro_costo] || 0) + g.monto;
      }
    });

    // Construir tabla final
    const resultado: InformeData[] = centros.map(c => {
      const ejecutado = gastoPorCentro[c.id] || 0;
      const saldo = c.presupuesto - ejecutado;
      return {
        id_centro: c.id,
        nombre_centro: c.nombre,
        presupuesto: c.presupuesto,
        ejecutado,
        saldo
      };
    });

    setDatos(resultado);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  const handleExport = () => {
    if (datos.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }

    // Cabeceras
    const headers = ["Centro de Costo", "Presupuesto Mensual", "Gasto Ejecutado", "Saldo Disponible"];
    
    // Filas
    const rows = datos.map(d => [
      `"${d.nombre_centro}"`,
      d.presupuesto,
      d.ejecutado,
      d.saldo
    ]);

    // Unir todo en formato CSV (usamos punto y coma para mejor compatibilidad con Excel en español)
    const csvContent = [
      headers.join(";"),
      ...rows.map(e => e.join(";"))
    ].join("\n");

    // Crear blob y descargar
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" }); // uFEFF es el BOM para UTF-8 en Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `informe_presupuestos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Informe descargado correctamente");
  };

  if (profile?.rol !== "administrador") return null;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Informes Generales</h1>
          <p className="text-sm text-slate-500">Consolidado de gasto de la organización (Mes Actual).</p>
        </div>
        <Button variant="outline" className="bg-white hover:bg-slate-100" onClick={handleExport}>
          <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" /> Exportar a Excel (CSV)
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Evolución del Gasto</CardTitle>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[400px] w-full">
                {datos.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">Sin datos</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(value) => `$${value / 1000}k`} />
                      <YAxis dataKey="nombre_centro" type="category" width={100} fontSize={12} />
                      <RechartsTooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="presupuesto" name="Presupuesto" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="ejecutado" name="Ejecutado" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Ejecución por Centro de Costo</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Centro de Costo</TableHead>
                    <TableHead className="text-right">Presupuesto Mensual</TableHead>
                    <TableHead className="text-right">Gasto Ejecutado</TableHead>
                    <TableHead className="text-right">Saldo Disponible</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-32">Cargando...</TableCell></TableRow>
                  ) : datos.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center h-32">No hay centros de costo registrados.</TableCell></TableRow>
                  ) : (
                    datos.map((d) => (
                      <TableRow key={d.id_centro}>
                        <TableCell className="font-medium">{d.nombre_centro}</TableCell>
                        <TableCell className="text-right">{formatCurrency(d.presupuesto)}</TableCell>
                        <TableCell className="text-right text-blue-600 font-semibold">{formatCurrency(d.ejecutado)}</TableCell>
                        <TableCell className={`text-right font-bold ${d.saldo < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {formatCurrency(d.saldo)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
