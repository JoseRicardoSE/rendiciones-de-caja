-- Tipos ENUM para estados y roles
CREATE TYPE rol_usuario AS ENUM ('administrador', 'usuario');
CREATE TYPE estado_registro AS ENUM ('activo', 'inactivo');
CREATE TYPE estado_rendicion AS ENUM ('borrador', 'enviada', 'aprobada', 'rechazada');

-- 1. Tabla de Perfiles
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  cargo TEXT,
  rol rol_usuario DEFAULT 'usuario' NOT NULL,
  estado estado_registro DEFAULT 'activo' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de Centros de Costo
CREATE TABLE public.centros_costo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  estado estado_registro DEFAULT 'activo' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.centros_costo ENABLE ROW LEVEL SECURITY;

-- 3. Tabla de Rendiciones
CREATE TABLE public.rendiciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_usuario UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  id_centro_costo UUID REFERENCES public.centros_costo(id) ON DELETE RESTRICT NOT NULL,
  numero_boleta TEXT NOT NULL,
  fecha DATE NOT NULL,
  monto NUMERIC NOT NULL CHECK (monto > 0),
  concepto TEXT NOT NULL,
  imagen_url TEXT,
  estado estado_rendicion DEFAULT 'borrador' NOT NULL,
  comentario_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- REGLA: Si la rendición es rechazada, el comentario_admin no puede estar vacío.
  CONSTRAINT check_comentario_rechazada CHECK (
    (estado != 'rechazada') OR (comentario_admin IS NOT NULL AND trim(comentario_admin) <> '')
  )
);
ALTER TABLE public.rendiciones ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- POLÍTICAS RLS (Row Level Security)
-- ========================================================

-- Perfiles (profiles)
-- Un administrador puede ver y editar cualquier perfil.
CREATE POLICY "Admins can do everything on profiles" ON public.profiles 
FOR ALL TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' )
WITH CHECK ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- Un usuario puede ver únicamente su propio perfil.
CREATE POLICY "Users can read own profile" ON public.profiles 
FOR SELECT TO authenticated
USING ( auth.uid() = id );

-- Centros de Costo (centros_costo)
-- Un administrador puede gestionarlos.
CREATE POLICY "Admins manage centros_costo" ON public.centros_costo 
FOR ALL TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' )
WITH CHECK ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- Los usuarios solo pueden verlos (para asignarlos a las rendiciones).
CREATE POLICY "Users read centros_costo" ON public.centros_costo 
FOR SELECT TO authenticated
USING ( true ); 

-- Rendiciones (rendiciones)
-- Administradores pueden ver y actualizar cualquier rendición.
CREATE POLICY "Admins can read all rendiciones" ON public.rendiciones 
FOR SELECT TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

CREATE POLICY "Admins can update all rendiciones" ON public.rendiciones 
FOR UPDATE TO authenticated
USING ( (SELECT rol FROM public.profiles WHERE id = auth.uid()) = 'administrador' );

-- Usuarios leen y crean las suyas.
CREATE POLICY "Users can read own rendiciones" ON public.rendiciones 
FOR SELECT TO authenticated
USING ( id_usuario = auth.uid() );

CREATE POLICY "Users can insert own rendiciones" ON public.rendiciones 
FOR INSERT TO authenticated
WITH CHECK ( id_usuario = auth.uid() );

-- Usuarios actualizan sus rendiciones SOLO si están en 'borrador' o 'rechazada'.
CREATE POLICY "Users can update own rendiciones if draft or rejected" ON public.rendiciones 
FOR UPDATE TO authenticated
USING ( id_usuario = auth.uid() AND estado IN ('borrador', 'rechazada') )
WITH CHECK ( id_usuario = auth.uid() );

-- Usuarios eliminan sus rendiciones SOLO si están en 'borrador'.
CREATE POLICY "Users can delete own rendiciones if draft" ON public.rendiciones 
FOR DELETE TO authenticated
USING ( id_usuario = auth.uid() AND estado = 'borrador' );

-- ========================================================
-- FUNCIONES Y TRIGGERS AUTOMÁTICOS
-- ========================================================

-- Actualizar updated_at en modificaciones
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_centros_costo_modtime BEFORE UPDATE ON public.centros_costo FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER update_rendiciones_modtime BEFORE UPDATE ON public.rendiciones FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Crear automáticamente un perfil de 'usuario' al registrarse en Auth Supabase
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre_completo, rol, estado)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'), 'usuario', 'activo');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ========================================================
-- ALMACENAMIENTO DE BOLETAS (Supabase Storage)
-- ========================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('boletas', 'boletas', true);

CREATE POLICY "Boletas images are publicly accessible" ON storage.objects 
FOR SELECT USING ( bucket_id = 'boletas' );

CREATE POLICY "Users can upload their own boletas" ON storage.objects 
FOR INSERT TO authenticated
WITH CHECK ( bucket_id = 'boletas' );

CREATE POLICY "Users can delete their own boletas" ON storage.objects 
FOR DELETE TO authenticated
USING ( bucket_id = 'boletas' );
