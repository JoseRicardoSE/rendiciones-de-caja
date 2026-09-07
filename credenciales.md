# Credenciales de Acceso - Plataforma de Rendiciones

Estas son las cuentas de prueba inyectadas en la base de datos local para que puedas probar los distintos roles del sistema.

### 👨‍💼 Administrador Global
Tiene acceso completo a estadísticas de toda la empresa, gestión de centros de costo, aprobación/rechazo de gastos y creación masiva de usuarios.

- **Correo:** `admin@empresa.com`
- **Contraseña:** `Password123!`

---

### 👷‍♂️ Trabajador (Colaborador)
Usuario estándar. Solo puede crear sus propias rendiciones, subir boletas, adjuntar gastos y enviarlos a revisión. 

- **Correo:** `trabajador@empresa.com`
- **Contraseña:** `Password123!`

---

### 👥 Usuarios de la Plantilla de Importación Masiva (CSV)
Si utilizas el botón **Importar CSV** desde el panel del Administrador y cargas el archivo `tests/fixtures/plantilla_empleados.csv`, se crearán automáticamente estas 4 cuentas. Todas comparten la misma clave temporal.

**Contraseña para todos:** `TempPass123!`

- **Juan Pérez (Técnico de Terreno):** `j.perez@empresa.com`
- **María Rodríguez (Diseñadora):** `m.rodriguez@empresa.com`
- **Ana Silva (Ejecutiva de Ventas):** `a.silva@empresa.com`
- **Carlos Tapia (Desarrollador Junior):** `c.tapia@empresa.com`
### 🏗️ Usuarios de Obras (Control de Acceso Estricto)
Estos usuarios solo pueden rendir gastos para las obras que el administrador les asignó.
- **Jorge Capataz:** jorge.capataz@empresa.com (Solo ve 'Obra Bicentenario')
- **Luis Jefe de Obra:** luis.jefeobra@empresa.com (Solo ve 'Condominio Las Palmas')
- **Clave para ambos:** Password123!
