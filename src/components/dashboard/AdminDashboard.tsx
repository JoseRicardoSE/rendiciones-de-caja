import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, Clock, Users, Building } from "lucide-react";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    totalRendidoMes: 0,
    pendientes: 0,
    usuariosActivos: 0,
    centrosActivos: 0,
  });
  const [chartData, setChartData] = useState<{name: string, total: number}[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // 1. Usuarios activos
    const { count: uCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("estado", "activo");
    
    // 2. Centros activos
    const { count: cCount } = await supabase.from("centros_costo").select("*", { count: "exact", head: true }).eq("estado", "activo");
    
    // 3. Pendientes (En revisión)
    const { count: pCount } = await supabase.from("rendiciones").select("*", { count: "exact", head: true }).eq("estado", "enviada");
    
    // 4. Total rendido este mes (aprobadas) y evolución real de los últimos 8 meses
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startWindow = new Date(now.getFullYear(), now.getMonth() - 7, 1);

    const { data: rends } = await supabase
      .from("rendiciones")
      .select("id, created_at")
      .eq("estado", "aprobada")
      .gte("created_at", startWindow.toISOString());

    const gastosPorRendicion: Record<string, number> = {};
    if (rends && rends.length > 0) {
      const ids = rends.map((r: any) => r.id);
      const { data: gastos } = await supabase.from("gastos").select("id_rendicion, monto").in("id_rendicion", ids);
      (gastos || []).forEach((g: any) => {
        gastosPorRendicion[g.id_rendicion] = (gastosPorRendicion[g.id_rendicion] || 0) + Number(g.monto || 0);
      });
    }

    // Acumular por mes
    const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    const buckets: { key: string; name: string; total: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, name: meses[d.getMonth()] ?? "", total: 0 });
    }

    let totalMes = 0;
    (rends || []).forEach((r: any) => {
      const monto = gastosPorRendicion[r.id] || 0;
      const d = new Date(r.created_at);
      const bucket = buckets.find((b) => b.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bucket) bucket.total += monto;
      if (d >= startOfMonth) totalMes += monto;
    });

    setStats({
      totalRendidoMes: totalMes,
      pendientes: pCount || 0,
      usuariosActivos: uCount || 0,
      centrosActivos: cCount || 0,
    });

    setChartData(buckets.map((b) => ({ name: b.name, total: b.total })));
  };

  const mesActual = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" }).format(new Date());


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gasto Aprobado (Mes)</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRendidoMes)}</div>
            <p className="text-xs text-slate-500 capitalize">{mesActual}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes de Aprobar</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendientes}</div>
            <p className="text-xs text-slate-500">Rendiciones en bandeja</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usuariosActivos}</div>
            <p className="text-xs text-slate-500">Colaboradores con acceso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centros de Costo</CardTitle>
            <Building className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.centrosActivos}</div>
            <p className="text-xs text-slate-500">Departamentos activos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ejecución Mensual</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
