# Rendiciones de Gastos

Aplicación web para la gestión de rendiciones de gastos y cajas, construida con tecnologías modernas y desplegada en Lovable.

🚀 **Sitio en producción:** [https://rendiciones-gastos.lovable.app](https://rendiciones-gastos.lovable.app)

## Características principales

El sistema digitaliza y audita el proceso de rendición de gastos corporativos, soportando los siguientes flujos principales:

- **Roles de Usuario:**
  - **Colaborador:** Puede crear rendiciones (sobres), adjuntar comprobantes en estado borrador, enviar a revisión y corregir rendiciones rechazadas.
  - **Administrador:** Dispone de una bandeja centralizada para auditar, aprobar o rechazar rendiciones (con comentarios). Gestiona el personal y los Centros de Costo.
- **Flujo de Estados (Máquina de Estados):**
  - Soporte para ciclo de vida completo: `borrador` ➔ `enviada` ➔ `aprobada` / `rechazada`.
- **Control Presupuestario:** Asignación de presupuestos por Centro de Costo con reportes de saldo ejecutado vs. presupuestado.
- **Seguridad y Auditoría:** Políticas RLS (Row Level Security) para proteger comprobantes, reglas de validación (inmutabilidad financiera para estados aprobados) y "Soft Delete" de usuarios.

## Stack Tecnológico

Este proyecto está construido con un stack moderno y escalable:

- **Framework:** [TanStack Start](https://tanstack.com/start/latest) con React
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) v4
- **Componentes UI:** [shadcn/ui](https://ui.shadcn.com/) y Radix UI
- **Manejo de Estado (Server State):** [TanStack Query](https://tanstack.com/query/latest)
- **Base de Datos & Backend:** [Supabase](https://supabase.com/)
- **Validación de datos:** [Zod](https://zod.dev/)

## Arquitectura y Diseño Técnico

El sistema está diseñado con una arquitectura de cliente enriquecido que se comunica directamente con Supabase (BaaS), delegando la seguridad y validación al nivel de la base de datos (PostgreSQL).

- **Dashboards y Gráficos:** Visualización de métricas y KPIs (uso de presupuesto, usuarios) implementados con `recharts`.
- **Exportaciones Nativas:** Capacidad de exportar reportes a Excel/CSV y vistas optimizadas para imprimir en PDF.

## Esquema de Base de Datos (Supabase)

El modelo de datos relacional consta de las siguientes entidades principales:

1. **`profiles`:** Gestión de usuarios (vinculado a `auth.users`). Define el rol (`administrador`, `usuario`) y el estado.
2. **`centros_costo`:** Agrupadores contables con un `presupuesto` asignado.
3. **`asignaciones_centro`:** Relación (N:M) que determina qué usuarios (`profiles`) tienen acceso para rendir en qué `centros_costo`.
4. **`rendiciones` (Maestro):** Reporte general de un usuario hacia un centro de costo. Mantiene el control del ciclo de vida (`estado`) y un `folio` identificador.
5. **`gastos` (Detalle):** Cada comprobante o boleta individual. Guarda detalles como `monto`, `fecha`, `categoria` y el enlace (`documento_url`) al bucket de Storage.

> **Almacenamiento Seguro (Storage):** Los comprobantes se suben a un bucket dedicado (`boletas`), aislados en subcarpetas por `auth.uid()` y protegidos mediante políticas RLS.

## Estructura de carpetas

```text
src/
  api/            # Funciones de servidor y endpoints
  components/
    shared/       # Componentes reutilizables propios de la aplicación
    ui/           # Componentes de interfaz estandarizados (shadcn/ui)
  db/             # Esquemas, tipos y configuración de base de datos
  entities/       # Modelos de dominio, esquemas Zod y validaciones
  hooks/          # Hooks personalizados de React (fetch, mutaciones, UI)
  lib/            # Utilidades compartidas y configuración global (ej. cliente supabase)
  routes/         # Definición de rutas basadas en archivos (TanStack Start)
  services/       # Capa de acceso a datos y lógica de negocio
  types/          # Tipos globales de TypeScript
```

## Desarrollo Local

### Requisitos previos
- [Bun](https://bun.sh/) (Runtime rápido de JavaScript y gestor de paquetes)
- Una instancia de [Supabase](https://supabase.com/)

### Instalación y ejecución

1. Asegúrate de estar en el directorio del proyecto y de haber clonado el código base.
2. Instala las dependencias:
   ```sh
   bun install
   ```
3. Configura las variables de entorno. Asegúrate de tener tu archivo `.env.local` configurado con las credenciales correctas de Supabase (URL y clave anon pública).
4. Inicia el servidor de desarrollo local:
   ```sh
   bun dev
   ```
5. Abre [http://localhost:5173](http://localhost:5173) en tu navegador (el puerto puede variar dependiendo de Vite).

### Scripts adicionales útiles

```sh
bun build    # Genera el build optimizado para producción
bun lint     # Revisa el código con ESLint
bun format   # Formatea el código automáticamente usando Prettier
```
