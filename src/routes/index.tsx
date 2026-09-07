import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";

export const Route = createFileRoute("/")({
  component: DashboardSelector,
});

function DashboardSelector() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) return null; // El Wrapper en __root ya muestra cargando

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="flex flex-col gap-6 w-full pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenido, {profile?.nombre_completo || "Usuario"}</h1>
        <p className="text-sm text-slate-500">
          Tu rol es: <strong className="uppercase">{profile?.rol}</strong>
        </p>
      </div>
      
      {profile?.rol === "administrador" ? <AdminDashboard /> : <UserDashboard />}
    </main>
  );
}
