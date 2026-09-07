# Plan de Ejecución — Sistema de Rendición de Gastos

El proyecto está dividido en 8 fases secuenciales. La regla estricta es **completar y probar exhaustivamente cada fase antes de iniciar la siguiente**.

- **Fase 1: Arquitectura y Diseño:** Proyecto base, componentes globales UI y Layout responsivo.
- **Fase 2: Base de Datos y Seguridad:** Tablas Supabase (Modelo Maestro-Detalle), relaciones, RLS estricto y Storage.
- **Fase 3: Autenticación y Usuarios:** Login, roles (Admin/Colaborador), y Dashboard de control de personal.
- **Fase 4: Centros de Costo y Presupuestos:** CRUD de cuentas presupuestarias para la organización.
- **Fase 5: Módulo de Rendiciones (Usuario):** Carga de múltiples boletas por rendición, Storage y manejo de Borradores.
- **Fase 6: Revisión y Aprobación (Admin):** Bandeja global, flujos inmutables de aprobación y rechazos con feedback.
- **Fase 7: Dashboard e Informes:** Estadísticas, filtros, gráficas de usuario y comparación de Ejecutado vs Presupuesto.
- **Fase 8: Exportación y Pruebas:** Funciones a PDF/Excel, notificaciones y validación QA final.
