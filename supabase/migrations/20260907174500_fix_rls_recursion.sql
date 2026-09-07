-- Función para verificar si un usuario es admin sin causar recursión infinita en RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  v_rol text;
BEGIN
  SELECT rol INTO v_rol FROM public.profiles WHERE id = auth.uid();
  RETURN coalesce(v_rol = 'administrador', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Actualizamos las políticas de profiles
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
CREATE POLICY "Admins can do everything on profiles" ON public.profiles 
FOR ALL TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- Actualizamos las políticas de centros_costo
DROP POLICY IF EXISTS "Admins manage centros_costo" ON public.centros_costo;
CREATE POLICY "Admins manage centros_costo" ON public.centros_costo 
FOR ALL TO authenticated
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- Actualizamos las políticas de rendiciones
DROP POLICY IF EXISTS "Admins can read all rendiciones" ON public.rendiciones;
CREATE POLICY "Admins can read all rendiciones" ON public.rendiciones 
FOR SELECT TO authenticated
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all rendiciones" ON public.rendiciones;
CREATE POLICY "Admins can update all rendiciones" ON public.rendiciones 
FOR UPDATE TO authenticated
USING ( public.is_admin() );

-- Actualizamos las políticas de gastos
DROP POLICY IF EXISTS "Admins can read all gastos" ON public.gastos;
CREATE POLICY "Admins can read all gastos" ON public.gastos 
FOR SELECT TO authenticated
USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admins can update all gastos" ON public.gastos;
CREATE POLICY "Admins can update all gastos" ON public.gastos 
FOR UPDATE TO authenticated
USING ( public.is_admin() );
