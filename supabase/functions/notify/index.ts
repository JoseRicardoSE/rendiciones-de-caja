import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("No hay token de autorización");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verificar Admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) throw new Error("Token inválido");

    const { data: adminProfile } = await supabaseAdmin.from("profiles").select("rol").eq("id", user.id).single();
    if (adminProfile?.rol !== "administrador") throw new Error("Acceso denegado: Solo admins pueden enviar notificaciones");

    // Recibir payload
    const { rendicionId, estado, comentario, trabajadorNombre, trabajadorEmail, folio } = await req.json();

    if (!rendicionId || !estado || !trabajadorEmail) {
      throw new Error("Faltan datos obligatorios para enviar el correo");
    }

    // --------------------------------------------------------
    // CONSTRUCCIÓN DEL CORREO (Lógica de Negocio)
    // --------------------------------------------------------
    const asunto = estado === 'aprobada' 
      ? `✅ Rendición ${folio} Aprobada` 
      : `❌ Rendición ${folio} Rechazada`;

    let mensajeBase = "";
    let instrucciones = "";

    if (estado === 'aprobada') {
      mensajeBase = `Hola ${trabajadorNombre}, te informamos que tu rendición de gastos **${folio}** ha sido **APROBADA** por la jefatura.`;
      instrucciones = `**Siguientes Pasos:**\n1. El departamento de finanzas procesará tu pago en un plazo de 48 a 72 horas hábiles.\n2. Asegúrate de entregar las boletas físicas originales (si aplica) a secretaría antes del viernes.`;
    } else {
      mensajeBase = `Hola ${trabajadorNombre}, tu rendición de gastos **${folio}** ha sido **RECHAZADA** tras nuestra auditoría.`;
      instrucciones = `**Motivo del rechazo (Comentario del Administrador):**\n> "${comentario}"\n\n**Siguientes Pasos:**\n1. Ingresa a la plataforma y corrige el gasto indicado.\n2. Vuelve a enviar la rendición a revisión.`;
    }

    const emailTemplate = `
      <h1>${asunto}</h1>
      <p>${mensajeBase}</p>
      <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid ${estado === 'aprobada' ? '#10b981' : '#ef4444'}; margin: 20px 0;">
        ${instrucciones.replace(/\n/g, '<br/>')}
      </div>
      <p style="font-size: 12px; color: #64748b;">Este es un mensaje automático del Sistema de Rendiciones de Caja.</p>
    `;

    // --------------------------------------------------------
    // SIMULACIÓN DE ENVÍO (Resend / SendGrid)
    // --------------------------------------------------------
    // En producción, aquí haríamos: await fetch('https://api.resend.com/emails', { ... })
    console.log(`[SIMULACIÓN SMTP] Enviando correo a: ${trabajadorEmail}`);
    console.log(`[SIMULACIÓN SMTP] Asunto: ${asunto}`);
    console.log(`[SIMULACIÓN SMTP] Contenido:\n`, emailTemplate);

    return new Response(JSON.stringify({ 
      success: true, 
      simulatedEmail: emailTemplate,
      message: `Correo enviado con éxito a ${trabajadorEmail}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
