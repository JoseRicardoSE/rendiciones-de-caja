# Tareas de Implementación (Checklist)

> [!IMPORTANT]
> **El agente debe marcar con `[x]` las tareas a medida que las completa y supera las pruebas de validación.**

## Fase 1: Arquitectura y Diseño
- [x] 1.1 Configurar Layout principal (Sidebar, Topbar) con navegación TanStack.
- [x] 1.2 Configurar paleta de colores y componentes globales UI.
  - *Validación:* Verificar renderizado responsivo (Sidebar y Drawer móvil funcionando). **[x]**

## Fase 2: Base de Datos y Seguridad (Completado)
- [x] 2.1 Migraciones SQL (`profiles`, `centros_costo`, `rendiciones`, `gastos`).
- [x] 2.2 Políticas RLS restrictivas (Usuarios vs Administradores).
- [x] 2.3 Bucket `boletas` en Storage (Políticas de aislamiento por UID).
- [x] 2.4 Auditoría Edge Cases: Secuencia Folio (1000+), Restricción de auto-aprobación.
  - *Validación:* Comando `supabase db reset` ejecutado con éxito sin errores, aplicando RLS estrictos. **[x]**

## Fase 3: Autenticación y Usuarios
- [x] 3.1 Implementar pantalla de Login (Auth Supabase).
- [x] 3.2 Proteger rutas (Redirección al Login si no hay sesión activa).
- [x] 3.3 Dashboard Admin: Tabla de usuarios con edición de roles y estado.
  - *Validación (Edge Case):* Verificar que los usuarios "inactivos" pierdan acceso al sistema, pero su historial de rendiciones siga visible. [x]

## Fase 4: Centros de Costo y Presupuestos
- [x] 4.1 Dashboard Admin: CRUD de Centros de Costo (Nombre, Presupuesto, Estado).
  - *Validación (Edge Case):* Comprobar que no se puedan eliminar registros (solo desactivar) para no romper la integridad de datos históricos. [x]

## Fase 5: Rendiciones (Usuario Colaborador)
- [x] 5.1 Interfaz Nueva Rendición (Maestro-Detalle).
- [x] 5.2 Upload de archivos a Storage.
  - *Validación (Edge Case):* Intentar crear un gasto con monto <= 0 o caracteres inválidos (Debe fallar). [x]
  - *Validación (Edge Case):* Intentar "Enviar a revisión" una rendición con 0 boletas adjuntas (Debe bloquearse). [x]
- [x] 5.3 Vistas separadas: "Borradores" (Editables) y "Mis Rendiciones" (Histórico).

## Fase 6: Revisión y Auditoría (Administrador)
- [x] 6.1 Tabla global de rendiciones con buscador de folios y filtros.
- [x] 6.2 Lógica de Aprobación.
- [x] 6.3 Lógica de Rechazo.
  - *Validación (Edge Case):* Bloquear botón de rechazo si el Admin no escribe el motivo (comentario). [x]
  - *Validación (Edge Case):* Verificar que una rendición aprobada quede bloqueada 100% para edición, incluso para su dueño. [x]

## Fase 7 y 8: Reportes y Exportación
- [x] 7.1 Dashboard Usuario y Admin (KPIs y Gráficos).
- [x] 7.2 Vista "Informes Generales" comparando Gasto Ejecutado vs Presupuesto Asignado.
- [x] 8.1 Sistema de Exportación de tablas (PDF y Excel).
- [x] 8.2 QA Final.
  - *Validación (Edge Case):* Un usuario estándar intenta ingresar a `/admin/usuarios` escribiendo la URL manualmente (Debe ser pateado al dashboard). [x]

## Fase 9: Inteligencia Artificial (Extra / SaaS Premium)
- [x] 9.1 Integración de Google Gemini OCR.
- [x] 9.2 Supabase Edge Function (`ocr`) para procesamiento seguro de imágenes en backend.
- [x] 9.3 Botón "Autocompletar con IA" en el formulario de creación de gastos.
