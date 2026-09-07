// Cliente Supabase del proyecto.
//
// Apunta de forma exclusiva a la instancia EXTERNA de Supabase del usuario.
// Las claves publishable/anon son públicas por diseño (la seguridad la aplica
// Row Level Security en la base de datos), por lo que es seguro tenerlas aquí.
//
// Importa el cliente así en componentes, hooks y services:
//   import { supabase } from "@/lib/supabase";
//
// NOTA: no uses `@/integrations/supabase/client` — ese módulo autogenerado
// sigue ligado a la instancia gestionada por la plataforma.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "http://127.0.0.1:54321";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
