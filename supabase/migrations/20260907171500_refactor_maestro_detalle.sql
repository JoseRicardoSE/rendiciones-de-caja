-- Borramos la tabla de rendiciones antigua (como estamos en fase inicial no hay riesgo de datos)
DROP TABLE IF EXISTS public.rendiciones CASCADE;

-- 1. Crear tabla contenedora (Rendiciones Maestro)
CREATE TABLE public.rendiciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  id_centro_costo UUID REFERENCES public.centros_costo(id) ON DELETE RESTRICT NOT NULL,
  titulo TEXT NOT NULL,
  periodo TEXT NOT NULL,
  observaciones TEXT,
  estado estado_rendicion DEFAULT 'borrador' NOT NULL,
  comentario_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_comentario_rechazada CHECK (
    (estado != 'rechazada') OR (comentario_admin IS NOT NULL AND trim(comentario_admin) <> '')
  )
);
ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;

-- 2. Crear tabla de detalles (Gastos)
CREATE TABLE public.gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_rendicion UUID REFERENCES public.rendiciones(id) ON DELETE CASCADE NOT NULL,
  fecha DATE NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  documento_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- POLÍTICAS RLS (Row Level Security)
-- ========================================================

-- RENDICIONES MAESTRO
CREATE POLICY "Admins can read all rendiciones" ON public.rendiciones 
FOR SELECT TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

CREATE POLICY "Admins can update all rendiciones" ON public.rendiciones 
FOR UPDATE TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

CREATE POLICY "Users can read own rendiciones" ON public.rendiciones 
FOR SELECT TO authenticated
USING ( id_usuario = auth.uid() );

CREATE POLICY "Users can insert own rendiciones" ON public.rendiciones 
FOR INSERT TO authenticated
WITH CHECK ( id_usuario = auth.uid() );

CREATE POLICY "Users can update own rendiciones if draft or rejected" ON public.rendiciones 
FOR UPDATE TO authenticated
USING ( id_usuario = auth.uid() AND estado IN ('borrador', 'rechazada') )
WITH CHECK ( id_usuario = auth.uid() );

CREATE POLICY "Users can delete own rendiciones if draft" ON public.rendiciones 
FOR DELETE TO authenticated
USING ( id_usuario = auth.uid() AND estado = 'borrador' );

-- GASTOS (Detalle)
-- Admins pueden leer todos los gastos
CREATE POLICY "Admins can read all gastos" ON public.gastos 
FOR SELECT TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- Admins pueden actualizar todos los gastos (opcional, pero útil si pueden corregir o auditar)
CREATE POLICY "Admins can update all gastos" ON public.gastos 
FOR UPDATE TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- Usuarios solo pueden leer los gastos de SUS rendiciones
CREATE POLICY "Users can read own gastos" ON public.gastos 
FOR SELECT TO authenticated
USING ( 
  EXISTS (
    SELECT 1 FROM public.rendiciones r 
    WHERE r.id = gastos.id_rendicion AND r.id_usuario = auth.uid()
  )
);

-- Usuarios pueden insertar gastos si la rendición es suya y no está aprobada/enviada
CREATE POLICY "Users can insert own gastos" ON public.gastos 
FOR INSERT TO authenticated
WITH CHECK ( 
  EXISTS (
    SELECT 1 FROM public.rendiciones r 
    WHERE r.id = gastos.id_rendicion 
      AND r.id_usuario = auth.uid() 
      AND r.estado IN ('borrador', 'rechazada')
  )
);

-- Usuarios pueden actualizar sus gastos bajo las mismas reglas
CREATE POLICY "Users can update own gastos" ON public.gastos 
FOR UPDATE TO authenticated
USING ( 
  EXISTS (
    SELECT 1 FROM public.rendiciones r 
    WHERE r.id = gastos.id_rendicion 
      AND r.id_usuario = auth.uid() 
      AND r.estado IN ('borrador', 'rechazada')
  )
)
WITH CHECK ( 
  EXISTS (
    SELECT 1 FROM public.rendiciones r 
    WHERE r.id = gastos.id_rendicion 
      AND r.id_usuario = auth.uid() 
      AND r.estado IN ('borrador', 'rechazada')
  )
);

-- Usuarios pueden borrar sus gastos bajo las mismas reglas
CREATE POLICY "Users can delete own gastos" ON public.gastos 
FOR DELETE TO authenticated
USING ( 
  EXISTS (
    SELECT 1 FROM public.rendiciones r 
    WHERE r.id = gastos.id_rendicion 
      AND r.id_usuario = auth.uid() 
      AND r.estado IN ('borrador', 'rechazada')
  )
);

-- TRIGGERS DE ACTUALIZACIÓN
CREATE TRIGGER update_rendiciones_modtime BEFORE UPDATE ON public.rendiciones FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_gastos_modtime BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
