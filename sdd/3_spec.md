# Especificación de Requerimientos e Historias de Usuario

El sistema digitaliza y audita el proceso de rendición de gastos corporativos bajo una arquitectura Maestro-Detalle (Rendición 1 -> N Gastos).

## 1. Actores
- **Colaborador (Usuario):** Empleado que genera gastos corporativos. Accede a su espacio personal para agrupar y subir comprobantes.
- **Administrador (Aprobador):** Rol con visión global. Administra presupuestos, cuentas y tiene la facultad de auditar y aprobar/rechazar el dinero rendido.

---

## 2. Historias de Usuario (User Stories)

### Colaboradores
- **HU1 - Creación de Rendición:** Como colaborador, quiero crear un "Sobre" (Rendición) asignado a un Centro de Costo, para poder agrupar todos los comprobantes de un evento o viaje.
- **HU2 - Carga de Gastos:** Como colaborador, quiero agregar múltiples boletas (gastos) a mi rendición en estado borrador, indicando monto, fecha y adjuntando una foto del comprobante.
- **HU3 - Seguimiento y Borradores:** Como colaborador, quiero guardar mi rendición como borrador para continuar agregando boletas durante la semana, y solo enviarla a revisión cuando el viaje concluya.
- **HU4 - Corrección de Rechazos:** Como colaborador, si mi rendición es rechazada, quiero leer el comentario del administrador, editar la boleta problemática y volver a enviarla sin perder las demás.

### Administradores
- **HU5 - Auditoría de Gastos:** Como administrador, quiero ver una bandeja centralizada con las rendiciones "En Revisión" de toda la empresa, para priorizar mi carga de trabajo.
- **HU6 - Aprobación/Rechazo:** Como administrador, quiero aprobar una rendición correcta, o rechazarla enviando un comentario obligatorio para que el colaborador sepa qué boleta debe corregir.
- **HU7 - Control Presupuestario:** Como administrador, quiero definir el presupuesto de cada Centro de Costo, para luego ver reportes automáticos que comparen lo "Ejecutado" vs el "Presupuesto" (Saldo).
- **HU8 - Gestión de Personal:** Como administrador, quiero poder crear cuentas para nuevos empleados y desactivar a los que dejan la empresa, sin borrar su historial financiero.

---

## 3. Casos Atípicos (Edge Cases) y Mitigaciones

| Flujo / Entidad | Caso Atípico (Edge Case) | Comportamiento del Sistema (Mitigación) |
| :--- | :--- | :--- |
| **Borradores** | El usuario crea una rendición, pero nunca agrega gastos y hace clic en "Enviar a revisión". | **Bloqueo UI/Backend:** El sistema verifica el conteo de gastos vinculados. Si es 0, muestra error y no cambia el estado a 'enviada'. |
| **Centros de Costo** | Un Admin desactiva el Centro de Costo "Marketing", pero Juan tenía un borrador abierto con ese centro. | **Regla de Negocio:** Juan podrá terminar y enviar esa rendición histórica, pero no podrá crear *nuevas* rendiciones con "Marketing". |
| **Centros de Costo** | Un Admin intenta eliminar definitivamente un Centro de Costo de la BD. | **Protección SQL:** La BD tiene restricción `ON DELETE RESTRICT`. Lanzará error porque afecta la integridad contable. Solo se pueden *desactivar*. |
| **Edición (RLS)** | Un usuario habilidoso usa la API para intentar cambiar el estado de su rendición de "borrador" a "aprobada". | **Protección RLS:** La política de Base de Datos intercepta el `UPDATE` y mediante un bloque `WITH CHECK` rechaza la transacción si el estado destino no es válido. |
| **Seguridad Archivos** | Un usuario malintencionado intenta subir un virus `.exe` al storage, o intenta adivinar el nombre del comprobante de otra persona para sobrescribirlo. | **Filtros Supabase:** El frontend y el Storage solo admiten MIME types válidos (PDF, JPG, PNG). RLS en el Storage restringe subir/borrar archivos obligando a que la ruta empiece por el `auth.uid()` del atacante (aislamiento de carpetas). |
| **Cantidades Absurdas** | El usuario digita letras en el monto o un gasto de $0 o negativo. | **Validación Frontend + BD:** El input es `type="number"`. La BD tiene un `CHECK (monto > 0)`. Falla inmediatamente si es menor a 1. |
| **Baja de Empleados** | Un colaborador es despedido. El Admin desactiva su cuenta. ¿Qué pasa con sus rendiciones pendientes? | **Soft Delete:** El perfil queda 'inactivo'. El usuario no puede hacer login. El Admin aún verá sus rendiciones históricas intactas para auditoría contable. |

---

## 4. Reglas de Estados de Rendición (Máquina de Estados)
1. `borrador`: Creada por el usuario. Editable 100% (agregar/quitar gastos). Eliminable.
2. `enviada` (En revisión): Usuario no puede editar ni eliminar nada. Admin la está auditando.
3. `rechazada`: Vuelve al usuario. El Admin debe haber escrito un `comentario_admin`. El usuario puede editar los gastos de nuevo y pasar el estado nuevamente a `enviada`.
4. `aprobada`: Proceso cerrado. Nadie puede editar los gastos (inmutabilidad financiera).
