import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Rendición de Gastos" },
      { name: "description", content: "Sistema corporativo de rendición de gastos" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster richColors position="top-right" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthWrapper />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Wrapper para inyectar lógica de carga global o layout protegido
function AuthWrapper() {
  const { isLoading, profile } = useAuth();
  
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 font-medium">Cargando sesión...</p></div>;
  }

  // Pequeño truco visual para no mostrar Sidebar en /login temporalmente
  if (window.location.pathname === "/login") {
    return <Outlet />;
  }

  // Bloqueo estricto para usuarios desactivados
  if (profile && profile.estado === "inactivo") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <h1 className="text-2xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-slate-600">Tu cuenta ha sido desactivada. Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
