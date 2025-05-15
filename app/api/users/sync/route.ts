import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    // Crear cliente de Supabase con permisos de servidor
    const supabase = createServerSupabaseClient()
    
    // Verificar autenticación y permisos (solo administradores)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }
    
    // Verificar si es administrador
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", session.user.id)
      .single()
    
    if (userError || userData?.rol !== "administrador") {
      return NextResponse.json({ error: "Acceso denegado. Se requieren permisos de administrador." }, { status: 403 })
    }
    
    // Obtener todos los usuarios de auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      return NextResponse.json({ error: "Error al obtener usuarios de autenticación" }, { status: 500 })
    }
    
    // Obtener todos los IDs de usuarios ya existentes en la tabla usuarios
    const { data: existingUsers, error: existingError } = await supabase
      .from("usuarios")
      .select("id")
    
    if (existingError) {
      return NextResponse.json({ error: "Error al verificar usuarios existentes" }, { status: 500 })
    }
    
    // Crear un conjunto de IDs existentes para búsqueda rápida
    const existingUserIds = new Set(existingUsers.map(user => user.id))
    
    // Filtrar usuarios que están en auth pero no en la tabla usuarios
    const usersToSync = authUsers.users.filter(authUser => !existingUserIds.has(authUser.id))
    
    // Crear entradas en la tabla usuarios para los usuarios faltantes
    const usersToInsert = usersToSync.map(user => ({
      id: user.id,
      email: user.email,
      nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
      habilidad: 50, // Valor por defecto
      created_at: user.created_at || new Date().toISOString(),
    }))
    
    const results = {
      total_auth_users: authUsers.users.length,
      existing_users: existingUsers.length,
      users_to_sync: usersToSync.length,
      synced_users: 0,
      failed_users: 0,
      details: []
    }
    
    // Si hay usuarios para sincronizar, insertarlos en lotes para evitar problemas con muchos usuarios
    if (usersToInsert.length > 0) {
      // Dividir en lotes de 50 usuarios máximo
      const batchSize = 50;
      for (let i = 0; i < usersToInsert.length; i += batchSize) {
        const batch = usersToInsert.slice(i, i + batchSize);
        
        const { data: insertedData, error: insertError } = await supabase
          .from("usuarios")
          .insert(batch)
          .select();
        
        if (insertError) {
          console.error("Error al sincronizar lote de usuarios:", insertError);
          results.failed_users += batch.length;
          results.details.push({
            batch_start: i,
            batch_end: i + batch.length,
            error: insertError.message
          });
        } else {
          results.synced_users += batch.length;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Sincronización completada. Se sincronizaron ${results.synced_users} usuarios.`,
      results
    })
  } catch (error) {
    console.error("Error en sincronización de usuarios:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}