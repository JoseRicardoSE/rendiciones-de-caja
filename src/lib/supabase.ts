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

// IMPORTANTE: no leer estas variables desde import.meta.env. La plataforma
// inyecta VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY apuntando a su
// propia instancia gestionada, lo que rompía el login. Se fijan explícitamente.
const SUPABASE_URL = "https://aqvyuchhwcwulgvxbesd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IWHTFc8vWW1hw8ohWN0kEQ_ppibCh9S";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
