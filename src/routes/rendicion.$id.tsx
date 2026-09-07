import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Upload, FileText, Send, Trash2, CheckCircle, XCircle, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/rendicion/$id")({
  component: RendicionDetailScreen,
});

type Rendicion = {
  id: string;
  folio: number;
  titulo: string;
  periodo: string;
  estado: string;
  comentario_admin: string | null;
  centros_costo: { nombre: string } | null;
  profiles: { nombre_completo: string } | null;
};

type Gasto = {
  id: string;
  fecha: string;
  categoria: string;
  descripcion: string;
  monto: number;
  documento_url: string | null;
};

function RendicionDetailScreen() {
  const { id } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [rendicion, setRendicion] = useState<Rendicion | null>(null);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [rechazoComentario, setRechazoComentario] = useState("");
  const [emailPreview, setEmailPreview] = useState<string | null>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [gastoForm, setGastoForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: "",
    descripcion: "",
    monto: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [id, user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: renData, error: renError } = await supabase
      .from("rendiciones")
      .select(`
        id, folio, titulo, periodo, estado, comentario_admin,
        centros_costo ( nombre ),
        profiles ( nombre_completo )
      `)
      .eq("id", id)
      .single();

    if (renError) {
      toast.error("No se pudo cargar la rendición");
      navigate({ to: "/" });
      return;
    }
    setRendicion(renData as unknown as Rendicion);

    const { data: gasData } = await supabase
      .from("gastos")
      .select("*")
      .eq("id_rendicion", id)
      .order("fecha", { ascending: false });

    if (gasData) setGastos(gasData);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });

  const handleAnalyzeFile = async () => {
    if (!file) return;
    setIsAnalyzing(true);
    const toastId = toast.loading("Analizando boleta con Inteligencia Artificial...");
    
    try {
      const base64Image = await toBase64(file);
      
      const { data, error } = await supabase.functions.invoke('ocr', {
        body: { base64Image, mimeType: file.type }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      // Autocompletar form
      setGastoForm({
        ...gastoForm,
        fecha: data.fecha || gastoForm.fecha,
        monto: data.monto ? String(data.monto) : gastoForm.monto,
        categoria: data.categoria || gastoForm.categoria,
        descripcion: data.descripcion || gastoForm.descripcion,
      });

      toast.success("¡Datos extraídos con éxito!", { id: toastId });
    } catch (err: any) {
      toast.error("No se pudo analizar la boleta: " + err.message, { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('boletas').upload(fileName, file);
    if (uploadError) throw new Error("Error al subir archivo: " + uploadError.message);
    return fileName;
  };

  const handleAddGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(gastoForm.monto);
    if (montoNum <= 0) return toast.error("El monto debe ser mayor a cero");
    
    setIsSaving(true);
    try {
      let documento_url = null;
      if (file) documento_url = await uploadFile();

      const { error } = await supabase.from("gastos").insert([{
        id_rendicion: id,
        fecha: gastoForm.fecha,
        categoria: gastoForm.categoria,
        descripcion: gastoForm.descripcion,
        monto: montoNum,
        documento_url
      }]);

      if (error) throw error;
      toast.success("Gasto agregado");
      setIsModalOpen(false);
      setGastoForm({ ...gastoForm, descripcion: "", monto: "", categoria: "" });
      setFile(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el gasto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGasto = async (gastoId: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    const { error } = await supabase.from("gastos").delete().eq("id", gastoId);
    if (error) toast.error("Error al eliminar");
    else {
      toast.success("Gasto eliminado");
      setGastos(gastos.filter(g => g.id !== gastoId));
    }
  };

  const handleEnviarRevision = async () => {
    if (gastos.length === 0) return toast.error("No puedes enviar una rendición vacía.");
    if (!confirm("¿Estás seguro de enviar esta rendición? Ya no podrás editarla.")) return;
    const { error } = await supabase.from("rendiciones").update({ estado: "enviada" }).eq("id", id);
    if (error) toast.error("Error al enviar: " + error.message);
    else {
      toast.success("Rendición enviada a revisión");
      fetchData();
    }
  };

  const sendNotification = async (nuevoEstado: "aprobada" | "rechazada", comentario: string | null) => {
    try {
      const { data: usuarioPerfil } = await supabase.from("profiles").select("correo").eq("id", rendicion?.id_usuario).single();
      const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify', {
        body: {
          rendicionId: id,
          estado: nuevoEstado,
          comentario: comentario,
          trabajadorNombre: rendicion?.profiles?.nombre_completo || "Colaborador",
          trabajadorEmail: usuarioPerfil?.correo || "correo@desconocido.com",
          folio: rendicion?.folio
        }
      });
      if (!notifyError && notifyData?.simulatedEmail) {
        setEmailPreview(notifyData.simulatedEmail);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAprobar = async () => {
    if (!confirm("¿Aprobar esta rendición? Quedará bloqueada permanentemente.")) return;
    setIsSaving(true);
    const { error } = await supabase.from("rendiciones").update({ estado: "aprobada", comentario_admin: null }).eq("id", id);
    if (error) toast.error("Error al aprobar");
    else {
      toast.success("Rendición Aprobada");
      await sendNotification("aprobada", null);
      fetchData();
    }
    setIsSaving(false);
  };

  const handleRechazar = async () => {
    if (!rechazoComentario.trim()) {
      toast.error("Debes indicar un motivo de rechazo");
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.from("rendiciones").update({ estado: "rechazada", comentario_admin: rechazoComentario }).eq("id", id);
    if (error) {
      toast.error("Error al rechazar: " + error.message);
    } else {
      toast.success("Rendición Rechazada");
      await sendNotification("rechazada", rechazoComentario);
      setIsRejectModalOpen(false);
      setRechazoComentario("");
      fetchData();
    }
    setIsSaving(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount);
  };

  const total = gastos.reduce((sum, g) => sum + g.monto, 0);
  
  // Permisos dinámicos
  const isAdmin = profile?.rol === "administrador";
  const isEditableByOwner = !isAdmin && (rendicion?.estado === "borrador" || rendicion?.estado === "rechazada");
  const canAdminAudit = isAdmin && rendicion?.estado === "enviada";

  if (loading || !rendicion) return <div className="p-8 text-center text-slate-500">Cargando...</div>;

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: isAdmin ? "/admin/rendiciones" : "/mis-rendiciones" })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">RND-{rendicion.folio}</h1>
            <Badge variant={rendicion.estado === "borrador" ? "secondary" : "default"} className="uppercase text-xs">
              {rendicion.estado}
            </Badge>
          </div>
          <p className="text-sm text-slate-500">{rendicion.titulo}</p>
        </div>
        
        <div className="ml-auto flex gap-3 print:hidden">
          <Button variant="outline" className="bg-white" onClick={() => window.print()}>
            <FileText className="mr-2 h-4 w-4" /> PDF
          </Button>
          {isEditableByOwner && (
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Agregar Gasto
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEnviarRevision}>
                <Send className="mr-2 h-4 w-4" /> Enviar a Revisión
              </Button>
            </>
          )}

          {canAdminAudit && (
            <>
              <Button variant="outline" className="text-red-600 hover:text-red-700" onClick={() => setIsRejectModalOpen(true)}>
                <XCircle className="mr-2 h-4 w-4" /> Rechazar
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAprobar}>
                <CheckCircle className="mr-2 h-4 w-4" /> Aprobar Rendición
              </Button>
            </>
          )}
        </div>
      </div>

      {rendicion.estado === "rechazada" && rendicion.comentario_admin && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md shadow-sm">
          <p className="font-semibold text-sm mb-1">Motivo del Rechazo (Admin):</p>
          <p className="text-sm">{rendicion.comentario_admin}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-4">
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg">Detalle de Gastos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="print:hidden">Boleta</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    {isEditableByOwner && <TableHead className="w-[50px] print:hidden"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gastos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isEditableByOwner ? 6 : 5} className="text-center h-24 text-slate-500">
                        No hay gastos registrados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gastos.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="whitespace-nowrap">{g.fecha}</TableCell>
                        <TableCell>{g.categoria}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{g.descripcion}</TableCell>
                        <TableCell className="print:hidden">
                          {g.documento_url ? (
                            <a href={`${supabase.storage.from('boletas').getPublicUrl(g.documento_url).data.publicUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center text-sm">
                              <FileText className="h-4 w-4 mr-1" /> Ver archivo
                            </a>
                          ) : (
                            <span className="text-slate-400 text-sm">Sin adjunto</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(g.monto)}</TableCell>
                        {isEditableByOwner && (
                          <TableCell className="print:hidden">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteGasto(g.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {isAdmin && (
                <div>
                  <p className="text-sm font-medium text-slate-500">Colaborador</p>
                  <p className="text-sm font-semibold">{rendicion.profiles?.nombre_completo}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-500">Centro de Costo</p>
                <p className="text-sm">{rendicion.centros_costo?.nombre}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Período</p>
                <p className="text-sm">{rendicion.periodo}</p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-slate-500 mb-1">Total Solicitado</p>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">{formatCurrency(total)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          {/* Modal HTML omitido para brevedad visual, es igual al original */}
          <DialogHeader><DialogTitle>Agregar Gasto</DialogTitle></DialogHeader>
          <form onSubmit={handleAddGasto} className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha <span className="text-red-500">*</span></Label>
                <Input type="date" value={gastoForm.fecha} onChange={e => setGastoForm({...gastoForm, fecha: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Monto ($) <span className="text-red-500">*</span></Label>
                <Input type="number" min="1" value={gastoForm.monto} onChange={e => setGastoForm({...gastoForm, monto: e.target.value})} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoría <span className="text-red-500">*</span></Label>
              <Input value={gastoForm.categoria} onChange={e => setGastoForm({...gastoForm, categoria: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Descripción <span className="text-red-500">*</span></Label>
              <Input value={gastoForm.descripcion} onChange={e => setGastoForm({...gastoForm, descripcion: e.target.value})} required />
            </div>
            <div className="space-y-2 pt-2 border-t mt-2">
              <Label>Comprobante (Opcional pero recomendado para IA)</Label>
              <div className="flex gap-2 items-center">
                <Input type="file" onChange={handleFileChange} accept="image/*,.pdf" />
                <Button 
                  type="button" 
                  variant="secondary" 
                  disabled={!file || isAnalyzing} 
                  onClick={handleAnalyzeFile}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
                >
                  <Sparkles className="h-4 w-4 mr-1" /> {isAnalyzing ? "Leyendo..." : "Autocompletar"}
                </Button>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="bg-slate-900">{isSaving ? "Guardando..." : "Guardar Gasto"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Rechazar Rendición</DialogTitle>
            <DialogDescription>
              La rendición volverá al colaborador para que la corrija. Debes explicar el motivo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="motivo">Motivo del rechazo <span className="text-red-500">*</span></Label>
            <Textarea 
              id="motivo"
              placeholder="Ej: La boleta #3 está borrosa, por favor súbela nuevamente."
              className="mt-2"
              rows={4}
              value={rechazoComentario}
              onChange={e => setRechazoComentario(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleRechazar}>Confirmar Rechazo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!emailPreview} onOpenChange={() => setEmailPreview(null)}>
        <DialogContent className="max-w-2xl bg-white print:hidden">
          <DialogHeader>
            <DialogTitle>Notificación de Correo Enviada</DialogTitle>
            <p className="text-sm text-slate-500">Este es el correo que el trabajador ha recibido en su bandeja de entrada:</p>
          </DialogHeader>
          <div className="border rounded-md p-6 mt-4 shadow-inner bg-slate-50" dangerouslySetInnerHTML={{ __html: emailPreview || "" }} />
          <DialogFooter>
            <Button onClick={() => setEmailPreview(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
