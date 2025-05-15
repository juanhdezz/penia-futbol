import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

    // Validar datos
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Crear cliente de Supabase con permisos de servidor
    const supabase = createServerSupabaseClient()

    // Verificar si el email ya existe en la autenticación usando signUp
    // En lugar de getUserByEmail que requiere permisos de administrador
    const { data: checkData, error: checkError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre: name },
      }
    })

    // Si el error indica que el usuario ya existe, devolvemos un mensaje apropiado
    if (checkError) {
      if (checkError.message.includes("already exists")) {
        return NextResponse.json({ error: "Este email ya está registrado" }, { status: 400 })
      }
      console.error("Error al verificar usuario existente:", checkError)
      return NextResponse.json({ 
        error: "Error al verificar usuario", 
        details: checkError.message 
      }, { status: 500 })
    }

    // Si el usuario fue creado ahora con signUp, continuamos con el proceso
    if (checkData.user) {
      // Verificar si el email ya existe en la tabla usuarios
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("email", email)
        .maybeSingle()

      if (existingEmail) {
        try {
          // Si ya existe en la tabla usuarios pero se ha creado en auth, eliminarlo de auth
          await supabase.auth.admin.deleteUser(checkData.user.id)
        } catch (deleteError) {
          console.error("Error al limpiar usuario duplicado:", deleteError)
        }
        
        return NextResponse.json({ error: "Este email ya está registrado en el sistema" }, { status: 400 })
      }

      // Crear perfil de usuario en la tabla usuarios
      const { error: profileError } = await supabase.from("usuarios").insert({
        id: checkData.user.id,
        nombre: name,
        email: email,
        habilidad: 50, // Valor por defecto
        created_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("Error al crear perfil:", profileError)
        // Intentar eliminar el usuario de auth si falla la creación del perfil
        try {
          await supabase.auth.admin.deleteUser(checkData.user.id)
        } catch (deleteError) {
          console.error("Error al eliminar usuario tras fallo:", deleteError)
        }
        
        return NextResponse.json({ 
          error: "Error al crear perfil de usuario", 
          details: profileError.message 
        }, { status: 500 })
      }

      // Todo correcto
      return NextResponse.json({ 
        success: true, 
        user: {
          id: checkData.user.id,
          email: checkData.user.email,
          nombre: name,
        } 
      })
    } else {
      // Si signUp no devuelve error pero tampoco usuario, podría ser un caso de confirmación por email
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({ 
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido"
    }, { status: 500 })
  }
}
