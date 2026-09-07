# Constitución — Sistema de Rendición de Gastos

1. **Simplicidad primero:** Evitar sobreingeniería. Cada componente resuelve un solo problema.
2. **Seguridad (RLS):** Nunca confiar en el cliente para la seguridad de los datos. Toda la lógica de roles (Admin/Usuario) y acceso a filas debe estar asegurada por políticas RLS en Supabase.
3. **Calidad de interfaz (UI/UX):** La aplicación debe ser profesional, sobria y clara (Azul oscuro, gris, blanco), completamente funcional en dispositivos móviles y de escritorio.
4. **Verificabilidad (Test-Driven):** Ninguna funcionalidad se da por cerrada sin que exista una prueba (unitaria o de extremo a extremo automatizada/manual) que pase en "Verde".
5. **No inventar flujos:** Cualquier cambio de estado o permiso que no esté en la Spec no existe y debe preguntarse primero.
6. **Integridad de base de datos:** Los borrados de catálogos (ej. Centros de Costo) son lógicos (cambio de estado), nunca físicos, para no romper rendiciones históricas.
