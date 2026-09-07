-- Agregar columna 'correo' a profiles
ALTER TABLE public.profiles ADD COLUMN correo TEXT;

-- Actualizar el trigger de auth.users para guardar el correo también
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, correo, nombre_completo, rol, estado)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'), 
    'usuario', 
    'activo'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agregar columna 'presupuesto' a centros_costo
ALTER TABLE public.centros_costo ADD COLUMN presupuesto NUMERIC DEFAULT 0 NOT NULL;

-- Agregar columna 'folio' auto-incremental a rendiciones
ALTER TABLE public.rendiciones ADD COLUMN folio SERIAL;
