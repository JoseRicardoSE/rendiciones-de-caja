# CRUD Scaffold

Proyecto base mínimo sobre **TanStack Start** pensado para construir un CRUD simple. No incluye pantallas de negocio ni funcionalidad concreta: solo una estructura de carpetas clara, escalable y lista para continuar.

## Estructura de carpetas

```text
src/
  api/            # Funciones de servidor y endpoints de TanStack Start
  components/
    shared/       # Componentes reutilizables propios de la aplicación
    ui/           # Componentes de interfaz de shadcn/ui
  db/             # Esquemas, tipos y migraciones de base de datos
  entities/       # Modelos de dominio, esquemas Zod y validaciones
  hooks/          # Hooks de React compartidos (fetch, mutaciones, UI)
  lib/            # Utilidades y configuración global
  routes/         # Rutas basadas en archivos de TanStack Start
  services/       # Capa de acceso a datos / clientes API
  types/          # Tipos globales de TypeScript
```

## Convenciones básicas

- **Una entidad, una carpeta.** Cada modelo del dominio vive en `src/entities/<nombre>/` y contiene su schema Zod, tipos y, opcionalmente, hooks específicos.
- **Rutas como puntos de entrada.** Las páginas en `src/routes/` solo orquestan: obtienen datos a través de `src/hooks/` o `src/services/` y delegan la UI a componentes.
- **Componentes reutilizables.** Los componentes de negocio compartidos van en `src/components/shared/`. Los de `src/components/ui/` pertenecen a shadcn/ui y se mantienen tal cual.
- **Validación con Zod.** Usa Zod para formularios, contratos de API y validación de entradas de servidor.
- **Estado del servidor con TanStack Query.** Las lecturas y mutaciones de datos se gestionan mediante hooks de React Query para mantener la UI sincronizada.

## Scripts

```sh
bun dev      # Servidor de desarrollo
bun build    # Build de producción
bun lint     # Lint con ESLint
bun format   # Formatear con Prettier
```

## Próximos pasos

1. Define tu primera entidad en `src/entities/<nombre>/`.
2. Crea el schema de base de datos en `src/db/schema.ts` o mediante migraciones de Lovable Cloud.
3. Añade rutas en `src/routes/` para listar, crear, editar y eliminar registros.
4. Implementa los servicios en `src/services/` y los hooks en `src/hooks/`.

Para más detalles sobre rutas, consulta `src/routes/README.md`.
