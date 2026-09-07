# Clarificación — QA de Especificación

*(Este documento detecta posibles fallos en la Spec basados en principios de QA profesional, sin resolverlos)*

## Ambigüedades
1. **Comprobantes y "Formatos permitidos"**: Se indica soporte para JPG, PNG, PDF. Sin embargo, no hay reglas explícitas sobre compresión, validación de integridad (archivos corruptos), ni tamaño máximo.
2. **Rol de Administrador**: ¿Existe un súper-administrador que gestiona administradores, o cualquier administrador puede desactivar a otro administrador?
3. **Reportes "Total Gastado"**: No se define la moneda. Si la empresa opera en múltiples monedas (ej. CLP y USD), sumar montos sin conversión generará inconsistencias lógicas.

## Contradicciones
1. **Flujo de Edición vs. RLS**: La constitución prohíbe confiar en el cliente para la seguridad, pero si el usuario tiene una rendición en "Borrador", ¿puede editar su monto mientras se sube la imagen? El Storage (bucket boletas) requerirá RLS propio emparejado al estado de la fila en Postgres.

## Casos límite ausentes en la Spec
1. **Borrado de boletas**: ¿Qué pasa si un usuario adjunta un PDF incorrecto, guarda el borrador, y luego cambia de opinión y borra el PDF? El archivo original debe eliminarse físicamente de Supabase Storage para evitar fugas de memoria o costos muertos.
2. **Rechazos y Modificaciones Cíclicas**: Si una rendición es rechazada, editada por el usuario, devuelta, y luego aprobada, ¿se mantiene un historial de las correcciones previas? (El *Brief* explícitamente pone "Historial de modificaciones" fuera de alcance, por tanto se pierde el rastro previo al rechazo).

## Conflictos con la Constitución
1. **"Los borrados son lógicos, nunca físicos"**: Se aplica a Centros de Costo, pero no se especificó qué ocurre si el administrador borra a un Usuario. ¿El usuario pasa a estado "inactivo" para no romper sus rendiciones? Esto necesita estar en la spec como requerimiento.
