import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Receipt } from "lucide-react";

export const Route = createFileRoute("/nueva-rendicion")({
  component: NuevaRendicionScreen,
});

type CentroCosto = {
  id: string;
  nombre: string;
};

function NuevaRendicionScreen() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [loading, setLoading] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [idCentroCosto, setIdCentroCosto] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    // Cargar solo los centros de costo ACTIVOS para nuevas rendiciones
    const fetchCentros = async () => {
      if (!profile) return;
      
      // Traer todos los centros activos
      const { data: centrosData, error: centrosError } = await supabase
        .from("centros_costo")
        .select("*")
        .eq("estado", "activo")
        .order("nombre");
        
      if (centrosError) {
        toast.error("Error al cargar centros de costo");
        return;
      }
  
      if (profile.rol === "administrador") {
        setCentros(centrosData as CentroCosto[]);
      } else {
        // Filtrar por asignaciones
        const { data: asignaciones } = await supabase
          .from("asignaciones_centro")
          .select("id_centro_costo")
          .eq("id_usuario", profile.id);
          
        const asignadosIds = asignaciones?.map(a => a.id_centro_costo) || [];
        setCentros(centrosData.filter(c => asignadosIds.includes(c.id)) as CentroCosto[]);
      }
    };
    fetchCentros();
  }, [profile]);

  const handleCrearRendicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!titulo.trim() || !idCentroCosto || !periodo.trim()) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("rendiciones")
      .insert([
        {
          id_usuario: user.id,
          id_centro_costo: idCentroCosto,
          titulo,
          periodo,
          observaciones,
          estado: "borrador"
        }
      ])
      .select("id")
      .single();

    setLoading(false);

    if (error) {
      toast.error("Error al crear la rendición: " + error.message);
    } else if (data) {
      toast.success("Rendición creada en borrador");
      // Redirigir al detalle para agregar gastos
      navigate({ to: `/rendicion/${data.id}` });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full pt-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nueva Rendición</h1>
        <p className="text-sm text-slate-500">Crea el contenedor (sobre) para agrupar tus gastos.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Datos Generales</CardTitle>
          <CardDescription>
            Estos datos aplicarán a todos los gastos que subas en esta rendición.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCrearRendicion}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título de la Rendición <span className="text-red-500">*</span></Label>
              <Input 
                id="titulo" 
                placeholder="Ej: Viaje a Antofagasta - Proyecto Minera" 
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="centro">Centro de Costo <span className="text-red-500">*</span></Label>
                <Select value={idCentroCosto} onValueChange={setIdCentroCosto} required>
                  <SelectTrigger id="centro">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {centros.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                    ))}
                    {centros.length === 0 && (
                      <SelectItem value="empty" disabled>No hay centros activos</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="periodo">Período <span className="text-red-500">*</span></Label>
                <Input 
                  id="periodo" 
                  placeholder="Ej: Agosto 2026" 
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs">Observaciones o Motivo (Opcional)</Label>
              <Textarea 
                id="obs" 
                placeholder="Indica el propósito del viaje o detalles importantes..." 
                className="resize-none"
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 border-t bg-slate-50/50 px-6 py-4">
            <Button variant="outline" type="button" onClick={() => navigate({ to: "/" })}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              <Receipt className="mr-2 h-4 w-4" />
              {loading ? "Creando..." : "Crear Borrador y Agregar Gastos"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
