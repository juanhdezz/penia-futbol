import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function POST(request: Request) {
  try {
    // Verificar permisos de administrador
    const supabase = createServerSupabaseClient()
    
    // Obtener la sesión del usuario
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    
    // Verificar si el usuario es administrador
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("rol")
      .eq("id", session.user.id)
      .single()
      
    if (userError || userData?.rol !== "administrador") {
      return NextResponse.json({ error: "No autorizado. Solo los administradores pueden ejecutar esta acción." }, { status: 403 })
    }
    
    // Leer el archivo SQL
    const filePath = path.join(process.cwd(), "scripts", "create_table_columns_function.sql")
    const sqlQuery = fs.readFileSync(filePath, "utf-8")
    
    // Ejecutar la consulta SQL para crear la función
    const { error: setupError } = await supabase.sql(sqlQuery)
    
    if (setupError) {
      console.error("Error al configurar función:", setupError)
      return NextResponse.json({ 
        error: "Error al configurar la función en la base de datos", 
        details: setupError 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: "Función de base de datos configurada correctamente"
    })
  } catch (error) {
    console.error("Error en la API:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor", 
      details: error instanceof Error ? error.message : "Error desconocido" 
    }, { status: 500 })
  }
}