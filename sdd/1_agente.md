# INSTRUCCIONES ESTRICTAS PARA EL AGENTE DE IA (Agent Rules)

Eres el agente encargado de desarrollar el "Sistema de Rendición de Gastos". Al trabajar en este repositorio, **DEBES SEGUIR ESTAS REGLAS SIN EXCEPCIÓN**:

## 1. La Arquitectura Modular es la Fuente de la Verdad
Antes de iniciar cualquier código, debes contextualizarte leyendo los archivos de la carpeta `sdd/`:
- `3_spec.md`: Requerimientos y flujos de negocio.
- `7_architecture.md`: Modelo de base de datos y tecnologías.
- `5_plan.md`: Las fases generales.
- `6_tasks.md`: El checklist técnico exacto.

## 2. EL CICLO DE TRABAJO Y ACTUALIZACIÓN (¡CRÍTICO!)
La documentación modular (el SDD) es un organismo vivo. No debes esperar a que el usuario te pida que la actualices. Tu flujo de trabajo DEBE ser siempre:

1. **SELECCIONAR:** Lees `6_tasks.md` y tomas la siguiente tarea pendiente.
2. **IMPLEMENTAR Y TESTEAR:** Escribes el código de ESA única tarea. Verificas visualmente o mediante consola que funcione sin errores (tests o QA).
3. **MARCAR Y ACTUALIZAR (Auto-Mantenimiento):** 
   - Una vez comprobado que funciona, abres `6_tasks.md` y modificas la casilla a `[x]`.
   - Si tomaste alguna decisión técnica de arquitectura (ej. modificaste una tabla en BD, o añadiste una librería), abres `7_architecture.md` y la agregas.
4. **PARAR:** Notificas al usuario que la tarea terminó y esperas confirmación para continuar.

**¡No implementes múltiples tareas grandes a la vez!** Trabaja de a un checkbox de `6_tasks.md`, actualiza la documentación y pide el OK.
