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
    // 1. Verificar JWT del usuario que hace la petición
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("No hay token de autorización");
    }

    // Inicializar cliente con Service Role para saltar RLS y crear usuarios
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. Verificar que el que llama es Administrador
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Token inválido");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (profile?.rol !== "administrador") {
      throw new Error("Acceso denegado: Se requiere rol de administrador");
    }

    // 3. Procesar los usuarios enviados
    const body = await req.json();
    const { usuarios } = body; // array de { email, password, nombre_completo, cargo }

    if (!Array.isArray(usuarios) || usuarios.length === 0) {
      throw new Error("Se requiere un array de usuarios");
    }

    const resultados = [];

    for (const u of usuarios) {
      if (!u.email || !u.password) {
        resultados.push({ email: u.email, status: "error", message: "Email y password requeridos" });
        continue;
      }

      // Crear usuario en auth.users
      const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
      });

      if (createError) {
        resultados.push({ email: u.email, status: "error", message: createError.message });
        continue;
      }

      // Actualizar el profile que se creó automáticamente por el Trigger
      const userId = authData.user.id;
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({
          nombre_completo: u.nombre_completo || "Usuario Importado",
          cargo: u.cargo || "Colaborador",
          rol: u.rol || "usuario"
        })
        .eq("id", userId);

      if (profileError) {
        resultados.push({ email: u.email, status: "warning", message: "Usuario creado pero error al actualizar perfil: " + profileError.message });
      } else {
        resultados.push({ email: u.email, status: "success", message: "Creado correctamente" });
      }
    }

    return new Response(JSON.stringify({ resultados }), {
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
