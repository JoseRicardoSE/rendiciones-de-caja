CREATE TABLE asignaciones_centro ( 
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  id_usuario UUID REFERENCES profiles(id) ON DELETE CASCADE, 
  id_centro_costo UUID REFERENCES centros_costo(id) ON DELETE CASCADE, 
  UNIQUE(id_usuario, id_centro_costo) 
); 
ALTER TABLE asignaciones_centro ENABLE ROW LEVEL SECURITY; 
CREATE POLICY "Admins_pueden_todo" ON asignaciones_centro FOR ALL USING ( (SELECT rol FROM profiles WHERE id = auth.uid()) = 'administrador' ); 
CREATE POLICY "Usuarios_ven_sus_asignaciones" ON asignaciones_centro FOR SELECT USING ( id_usuario = auth.uid() );
