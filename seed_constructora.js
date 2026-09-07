import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seedData() {
  console.log("🛠️ Iniciando semilla de Constructora...");

  // 1. Crear Obras (Centros de Costo)
  const obrasToCreate = [
    { nombre: "Obra Bicentenario (Torre A)", presupuesto: 50000000, estado: "activo" },
    { nombre: "Condominio Las Palmas", presupuesto: 120000000, estado: "activo" },
    { nombre: "Reparación Vial Ruta 5", presupuesto: 15000000, estado: "activo" }
  ];

  const obrasMap = {};
  for (const obra of obrasToCreate) {
    let { data } = await supabase.from("centros_costo").select().eq("nombre", obra.nombre).single();
    if (!data) {
      const { data: newData } = await supabase.from("centros_costo").insert(obra).select().single();
      data = newData;
    }
    obrasMap[obra.nombre] = data.id;
    console.log(`✅ Obra creada/encontrada: ${obra.nombre}`);
  }

  // 2. Crear Trabajadores
  const trabajadores = [
    { email: "jorge.capataz@empresa.com", nombre: "Jorge Capataz", obra: "Obra Bicentenario (Torre A)" },
    { email: "luis.jefeobra@empresa.com", nombre: "Luis Jefe de Obra", obra: "Condominio Las Palmas" }
  ];

  for (const t of trabajadores) {
    let userId;
    const { data: userData, error } = await supabase.auth.admin.createUser({
      email: t.email,
      password: "Password123!",
      email_confirm: true,
    });

    if (error && error.message.includes("already exists")) {
      const { data: users } = await supabase.auth.admin.listUsers();
      userId = users.users.find(u => u.email === t.email)?.id;
    } else {
      userId = userData.user.id;
      // Actualizar perfil
      await supabase.from("profiles").update({ 
        rol: "usuario", 
        nombre_completo: t.nombre,
        cargo: "Supervisor de Terreno"
      }).eq("id", userId);
    }
    
    console.log(`✅ Trabajador listo: ${t.nombre} (${t.email})`);

    // 3. Asignar Trabajador a la Obra
    const obraId = obrasMap[t.obra];
    if (userId && obraId) {
      await supabase.from("asignaciones_centro").upsert({
        id_usuario: userId,
        id_centro_costo: obraId
      }, { onConflict: "id_usuario,id_centro_costo" });
      console.log(`🔗 ${t.nombre} asignado estrictamente a ${t.obra}`);
    }
  }

  console.log("🎉 Todo listo! Entra con jorge.capataz@empresa.com o luis.jefeobra@empresa.com para probar.");
}

seedData();
