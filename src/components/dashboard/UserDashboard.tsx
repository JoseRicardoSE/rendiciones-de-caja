import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DollarSign, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAprobado: 0,
    borradores: 0,
    rechazadas: 0,
    enRevision: 0,
  });
  const [chartData, setChartData] = useState<{name: string, value: number}[]>([]);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    // 1. Conteo de estados
    const { data: rends } = await supabase.from("rendiciones").select("id, estado").eq("id_usuario", user?.id);
    
    let borradores = 0;
    let rechazadas = 0;
    let enRevision = 0;
    const aprobadasIds: string[] = [];

    (rends || []).forEach(r => {
      if (r.estado === "borrador") borradores++;
      else if (r.estado === "rechazada") rechazadas++;
      else if (r.estado === "enviada") enRevision++;
      else if (r.estado === "aprobada") aprobadasIds.push(r.id);
    });

    // 2. Total Aprobado (Histórico o Mes, lo haremos histórico para que el gráfico sea vistoso)
    let totalAprobado = 0;
    let categoriasMap: Record<string, number> = {};

    if (aprobadasIds.length > 0) {
      const { data: gastos } = await supabase.from("gastos").select("categoria, monto").in("id_rendicion", aprobadasIds);
      (gastos || []).forEach(g => {
        totalAprobado += g.monto;
        categoriasMap[g.categoria] = (categoriasMap[g.categoria] || 0) + g.monto;
      });
    }

    setStats({ totalAprobado, borradores, rechazadas, enRevision });

    const pieData = Object.keys(categoriasMap).map(k => ({
      name: k,
      value: categoriasMap[k]
    })).sort((a,b) => b.value - a.value).slice(0, 5); // Top 5 categorías

    setChartData(pieData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Aprobado (Total)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalAprobado)}</div>
            <p className="text-xs text-slate-500">Acumulado histórico</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Revisión</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enRevision}</div>
            <p className="text-xs text-slate-500">Rendiciones pendientes de jefatura</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borradores</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.borradores}</div>
            <p className="text-xs text-slate-500">Rendiciones sin enviar</p>
          </CardContent>
        </Card>

        <Card className={stats.rechazadas > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rechazadas}</div>
            <p className="text-xs text-red-500">Requieren tu atención</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Gastos por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-[300px] w-full">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  No hay datos suficientes (Aún no tienes gastos aprobados).
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
