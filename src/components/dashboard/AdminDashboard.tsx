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
    
    // 4. Total rendido este mes (aprobadas)
    // Para simplificar el SQL en cliente, traemos las aprobadas y sumamos sus gastos localmente.
    // En producción se usaría una función RPC.
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    
    const { data: rends } = await supabase.from("rendiciones").select("id").eq("estado", "aprobada").gte("created_at", startOfMonth.toISOString());
    let totalMes = 0;
    if (rends && rends.length > 0) {
      const ids = rends.map(r => r.id);
      const { data: gastos } = await supabase.from("gastos").select("monto").in("id_rendicion", ids);
      totalMes = (gastos || []).reduce((acc, curr) => acc + curr.monto, 0);
    }

    setStats({
      totalRendidoMes: totalMes,
      pendientes: pCount || 0,
      usuariosActivos: uCount || 0,
      centrosActivos: cCount || 0,
    });

    // Mock Chart Data for UI (se podría calcular real agrupando por mes)
    setChartData([
      { name: "Ene", total: Math.floor(Math.random() * 5000000) },
      { name: "Feb", total: Math.floor(Math.random() * 5000000) },
      { name: "Mar", total: Math.floor(Math.random() * 5000000) },
      { name: "Abr", total: Math.floor(Math.random() * 5000000) },
      { name: "May", total: Math.floor(Math.random() * 5000000) },
      { name: "Jun", total: Math.floor(Math.random() * 5000000) },
      { name: "Jul", total: Math.floor(Math.random() * 5000000) },
      { name: "Ago", total: totalMes || 2400000 },
    ]);
  };

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
            <p className="text-xs text-slate-500">Agosto 2026</p>
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
