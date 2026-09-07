-- AUDITORÍA: Correcciones de Seguridad y Mejores Prácticas

-- 1. Unicidad de Correo
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_correo_key;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_correo_key UNIQUE (correo);

-- 2. Profesionalismo: Empezar folio en 1000
ALTER SEQUENCE IF EXISTS public.rendiciones_folio_seq RESTART WITH 1000;

-- 3. SEGURIDAD CRÍTICA: Prevenir Auto-aprobación
-- La política anterior permitía que el usuario cambiara el estado a 'aprobada' al hacer un UPDATE.
-- Ahora forzamos a que solo puedan guardarlo como 'borrador' o 'enviada'.
DROP POLICY IF EXISTS "Users can update own rendiciones if draft or rejected" ON public.rendiciones;

CREATE POLICY "Users can update own rendiciones if draft or rejected" ON public.rendiciones 
FOR UPDATE TO authenticated
USING ( id_usuario = auth.uid() AND estado IN ('borrador', 'rechazada') )
WITH CHECK ( id_usuario = auth.uid() AND estado IN ('borrador', 'enviada') );

-- 4. SEGURIDAD DE ARCHIVOS: Evitar sobrescritura o acceso cruzado en buckets
DROP POLICY IF EXISTS "Users can upload their own boletas" ON storage.objects;
CREATE POLICY "Users can upload their own boletas" ON storage.objects 
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'boletas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own boletas" ON storage.objects;
CREATE POLICY "Users can delete their own boletas" ON storage.objects 
FOR DELETE TO authenticated
USING (
  bucket_id = 'boletas' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
