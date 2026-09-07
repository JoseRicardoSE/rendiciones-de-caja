import { Menu, LogOut, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarNav } from "./Sidebar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

export function Topbar() {
  const { profile, signOut } = useAuth();

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-slate-300 border-r-slate-800">
            <div className="flex h-14 items-center border-b border-slate-800 px-4 text-lg font-semibold text-white">
              Rendición de Gastos
            </div>
            <SidebarNav />
          </SheetContent>
        </Sheet>
        
        <div className="hidden md:block">
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">Resumen de tu actividad</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex relative w-64 items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Buscar rendición..." 
            className="w-full bg-slate-50 pl-9" 
          />
        </div>

        <div className="flex items-center gap-3 border-l pl-4">
          <Avatar className="h-8 w-8 bg-blue-100 text-blue-700">
            <AvatarFallback className="text-xs font-semibold uppercase">
              {profile?.nombre_completo ? profile.nombre_completo.substring(0, 2) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="hidden flex-col items-start md:flex">
            <span className="text-sm font-medium text-slate-700 leading-none">
              {profile?.nombre_completo || "Cargando..."}
            </span>
            <span className="text-xs text-slate-500 mt-1 leading-none capitalize">
              {profile?.rol || "Colaborador"}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2 text-slate-500 hover:text-slate-700" 
            title="Cerrar sesión"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
