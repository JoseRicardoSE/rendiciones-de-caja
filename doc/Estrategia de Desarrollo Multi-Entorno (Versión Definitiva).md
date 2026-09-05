# **Estrategia de Desarrollo Multi-Entorno (Versión Definitiva)**

**Stack:** Lovable (Frontend AI) \+ AntiGravity (IDE Local AI) \+ Supabase (DB Local Docker / Supabase Externo) \+ GitHub (Version Control) \+ Docker \+ pnpm

## **⚠️ REGLAS DE ORO (CRÍTICAS PARA QUE FUNCIONE)**

> 1. **Nunca trabajes en paralelo:** Si estás diseñando en Lovable, no tengas a AntiGravity escribiendo código al mismo tiempo. Finaliza la sesión en una herramienta antes de pasar a la otra.  
> 2. **Cuidado con las Migraciones de BD:** Las migraciones deben ser lineales. Si modificas la base de datos en tu proyecto externo o en local con Docker, debes sincronizar inmediatamente antes de seguir programando.  
> 3. **El Repositorio es el Rey:** GitHub es la única fuente de verdad para el código, y tu proyecto externo de Supabase en São Paulo es la fuente de verdad para los datos en producción.  
> 4. **Consistencia de Gestor de Paquetes:** Usa siempre **pnpm** para la gestión de dependencias locales a fin de mantener la integridad estricta del proyecto.

## **FASE 0: Configuración Inicial (Estado Actual)**

> 1. Repositorio creado y vinculado en **GitHub** (JoseRicardoSE/rendiciones-de-caja).  
> 2. Instancia externa de **Supabase** creada en São Paulo (aqvyuchhwcwulgvxbesd.supabase.co) conectada mediante cliente personalizado (src/lib/supabase.ts), sin depender de la capa interna de Lovable Cloud.  
> 3. En **AntiGravity (Local)**, clonar y preparar el entorno de desarrollo usando pnpm:  
>    git clone https://github.com/JoseRicardoSE/rendiciones-de-caja.git  
>    cd rendiciones-de-caja  
>    pnpm install

>    \# Vincular la CLI con tu proyecto real en la nube  
>    supabase login  
>    supabase link \--project-ref aqvyuchhwcwulgvxbesd

## **FASE 1: Ciclo "Lovable Primero" (Prototipado rápido y UI)**

*Uso: Cuando usas el chat de Lovable para maquetar vistas, componentes visuales o pedir la creación inicial de tablas.*

> 1. Pídele a **Lovable** que diseñe las interfaces o componentes necesarios.  
> 2. Lovable sincronizará automáticamente los cambios de código hacia **GitHub**.  
> 3. **PASO CRÍTICO DE SINCRONIZACIÓN (Antes de abrir AntiGravity):**  
>    Abre tu terminal local y ejecuta la secuencia para alinear el código y el esquema de la base de datos:  
>    \# A. Traer los cambios de código hechos por Lovable  
>    git pull origin main

>    \# B. Descargar la estructura de la base de datos desde tu proyecto externo  
>    supabase db pull

>    \# C. Actualizar los tipos de TypeScript para el autocompletado local  
>    supabase gen types typescript \--linked \> src/types/supabase.ts

## **FASE 2: Ciclo "AntiGravity Local" (Lógica compleja y Backend)**

*Uso: Cuando tomas el control en tu máquina con AntiGravity para escribir lógica de negocio avanzada, refactorizar o gestionar migraciones.*

> 0. **Configuración del Proyecto y Credenciales (Si cambias de entorno o proyecto):**
>    Asegúrate de tener un archivo `.env.local` con tus variables:
>    ```env
>    NEXT_PUBLIC_SUPABASE_URL=https://aqvyuchhwcwulgvxbesd.supabase.co
>    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_IWHTFc8vWW1hw8ohWN0kEQ_ppibCh9S
>    ```
>    Vincula la CLI con el proyecto remoto y descarga la estructura más reciente:
>    ```bash
>    # Vincular proyecto
>    npx supabase link --project-ref aqvyuchhwcwulgvxbesd --password [TU_CONTRASEÑA]
>    
>    # Descargar estructura de la BD
>    npx supabase db pull --password [TU_CONTRASEÑA]
>    
>    # Actualizar tipos de TypeScript
>    npx supabase gen types typescript --db-url "postgres://postgres.aqvyuchhwcwulgvxbesd:[TU_CONTRASEÑA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" > src/types/supabase.ts
>    ```
> 
> 1. **Asegúrate de que Docker esté abierto** en tu computadora.  
> 2. Levanta el entorno local en la terminal de AntiGravity:  
>    supabase start*(Esto levantará una instancia de PostgreSQL en localhost:54323 idéntica a la de producción para que pruebes de forma segura).*  
> 3. Desarrolla y prueba localmente. Si creas tablas o haces cambios de esquema en tu base de datos local, guárdalos como una migración oficial:  
>    \# Genera un archivo .sql con los cambios locales  
>    supabase db diff \-f nombre\_descriptivo\_migracion

>    \# Actualiza los tipos de TypeScript con base en tu entorno local  
>    supabase gen types typescript \--local \> src/types/supabase.ts  
> 4. **PASO CRÍTICO DE DESPLIEGUE A PRODUCCIÓN:**  
>    Una vez probado todo en local, sube los cambios:  
>    \# A. Sube el código y las migraciones a GitHub  
>    git add .  
>    git commit \-m "feat: lógica compleja y nuevas tablas"  
>    git push origin main

>    \# B. Empuja las migraciones locales directamente a tu proyecto externo de Supabase  
>    supabase db push

## **FASE 3: Volver a Lovable**

Si después de trabajar en local quieres volver a la interfaz web de Lovable:

> 1. No se requiere acción manual compleja; al haber hecho git push y supabase db push, GitHub actualizará el código en Lovable y tu base de datos externa reflejará los cambios de manera nativa mediante el cliente personalizado (src/lib/supabase.ts).