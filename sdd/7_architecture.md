# Arquitectura y Diseño Técnico

## Stack Tecnológico
- **Frontend Core:** React 18+, TypeScript, Vite
- **Enrutamiento:** TanStack Router (generación de rutas basada en archivos).
- **Estilos y Componentes:** Tailwind CSS, shadcn/ui (radix-ui).
- **BaaS (Backend):** Supabase (PostgreSQL, Auth, Storage)
- **Diseño UI:** Profesional, sobrio (Azul oscuro, gris, blanco), responsivo (Mobile/Desktop).

## Esquema de Base de Datos (Supabase)

1. **`profiles`** (Vinculado a auth.users)
   - id (UUID, PK)
   - correo (Text, único)
   - nombre_completo (Text)
   - cargo (Text)
   - rol (Enum: administrador, usuario)
   - estado (Enum: activo, inactivo)
   
2. **`centros_costo`**
   - id (UUID, PK)
   - nombre (Text)
   - presupuesto (Numeric, default 0)
   - estado (Enum: activo, inactivo)

3. **`rendiciones`** (Contenedor Maestro)
   - id (UUID, PK)
   - folio (Serial, auto-incremental para RND-XXXX)
   - id_usuario (FK a profiles)
   - id_centro_costo (FK a centros_costo)
   - titulo (Text)
   - periodo (Text)
   - observaciones (Text, opcional)
   - estado (Enum: borrador, enviada, aprobada, rechazada)
   - comentario_admin (Text, requerido si estado=rechazada)
   - created_at / updated_at

4. **`gastos`** (Detalle de la boleta)
   - id (UUID, PK)
   - id_rendicion (FK a rendiciones)
   - fecha (Date)
   - categoria (Text)
   - descripcion (Text)
   - monto (Numeric, > 0)
   - documento_url (Text, Storage link, opcional)
   - created_at / updated_at

## Seguridad: Row Level Security (RLS)
- **Usuarios:** Solo pueden hacer SELECT, INSERT, UPDATE en `rendiciones` donde `id_usuario = auth.uid()`.
- **Administradores:** Tienen bypass o políticas que les permiten hacer SELECT/UPDATE globales.
- **Rutas de Frontend:** Protegidas según sesión activa y verificación del rol en la tabla `profiles`.

## Almacenamiento (Storage)
- Bucket: `boletas` (Formatos admitidos: JPG, PNG, PDF).
- **Aislamiento de archivos:** Cada usuario guarda archivos en una subcarpeta segura con su `auth.uid()`.

## Librerías y Herramientas Adicionales Implementadas
- **Gráficos (Dashboards):** Uso de `recharts` para representar KPIs (Gráficos de anillo para Usuarios, Gráficos de barras para Administradores).
- **Cálculo Financiero:** Lógica de agregación en cliente para calcular Saldo (Presupuesto Asignado vs Gasto Ejecutado).
- **Exportaciones Nativas:** 
  - **Excel/CSV:** Función de exportación de tablas in-memory usando formato Blob (`text/csv;charset=utf-8;`) respetando codificación para Excel en español.
  - **PDF:** Reutilización de la API del navegador `window.print()` con diseño limpio utilizando CSS Media Queries (`@media print` y utilidades Tailwind `print:hidden`, `print:p-0`).
