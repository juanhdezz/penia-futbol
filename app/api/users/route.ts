import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/supabase"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data, error } = await supabase.from("usuarios").select("*").order("nombre")

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { nombre, email, posicion, habilidad } = await request.json()

    // Validar datos
    if (!nombre || !email) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // Crear usuario en Supabase Auth con contraseña temporal
    const password = Math.random().toString(36).slice(-8)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Crear perfil de usuario
    const { error: profileError } = await supabase.from("usuarios").insert({
      id: authData.user.id,
      nombre,
      email,
      posicion: posicion || null,
      habilidad: habilidad || 50,
    })

    if (profileError) {
      // Si hay error al crear el perfil, intentar eliminar el usuario de auth
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json({ error: "Error al crear perfil de usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        nombre,
        email,
        posicion,
        habilidad,
      },
    })
  } catch (error) {
    console.error("Error al crear usuario:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
