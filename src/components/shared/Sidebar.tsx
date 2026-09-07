import { Link } from "@tanstack/react-router";
import { Home, PlusCircle, List, FileText, Users, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SidebarNav() {
  const { profile } = useAuth();
  const role = profile?.rol || "usuario";

  return (
    <ul className="grid gap-1 px-3 py-4">
      <li>
        <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white [&.active]:bg-blue-600 [&.active]:text-white transition-colors">
          <Home className="h-4 w-4" /> Dashboard
        </Link>
      </li>
      
      {role === "usuario" && (
        <>
          <li>
            <Link to="/nueva-rendicion" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <PlusCircle className="h-4 w-4" /> Nueva Rendición
            </Link>
          </li>
          <li>
            <Link to="/borradores" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <FileText className="h-4 w-4" /> Borradores
            </Link>
          </li>
          <li>
            <Link to="/mis-rendiciones" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <List className="h-4 w-4" /> Mis Rendiciones
            </Link>
          </li>
          <li>
            <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors">
              <FileText className="h-4 w-4" /> Mis Informes
            </Link>
          </li>
        </>
      )}

      {role === "administrador" && (
        <>
          <div className="mt-4 mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Administración
          </div>
          <li>
            <Link to="/admin/usuarios" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <Users className="h-4 w-4" /> Usuarios
            </Link>
          </li>
          <li>
            <Link to="/admin/centros-costo" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <Building className="h-4 w-4" /> Centros de Costo
            </Link>
          </li>
          <li>
            <Link to="/admin/rendiciones" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <List className="h-4 w-4" /> Todas las Rendiciones
            </Link>
          </li>
          <li>
            <Link to="/admin/informes" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors [&.active]:bg-blue-600 [&.active]:text-white">
              <FileText className="h-4 w-4" /> Informes Generales
            </Link>
          </li>
        </>
      )}
    </ul>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 md:flex">
      <div className="flex h-14 items-center border-b border-slate-800 px-4 text-lg font-semibold text-white">
        Rendición de Gastos
      </div>
      <nav className="flex-1 overflow-auto">
        <SidebarNav />
      </nav>
    </aside>
  );
}
