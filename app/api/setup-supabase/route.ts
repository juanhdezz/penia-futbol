import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Crear cliente de Supabase con la clave de servicio para tener permisos completos
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    )

    // Crear las tablas necesarias
    const tablesSQL = `
    -- Tabla de usuarios (se conecta con auth.users)
    CREATE TABLE IF NOT EXISTS usuarios (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      imagen TEXT,
      posicion TEXT,
      habilidad INTEGER DEFAULT 50,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de partidos
    CREATE TABLE IF NOT EXISTS partidos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      fecha DATE NOT NULL,
      hora TEXT NOT NULL,
      campo TEXT NOT NULL,
      resultado_equipo_a INTEGER,
      resultado_equipo_b INTEGER,
      estado TEXT NOT NULL DEFAULT 'Pendiente',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de equipos
    CREATE TABLE IF NOT EXISTS equipos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de relación jugadores-equipos
    CREATE TABLE IF NOT EXISTS jugadores_equipos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
      usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de estadísticas de jugadores
    CREATE TABLE IF NOT EXISTS estadisticas_jugadores (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
      partido_id UUID REFERENCES partidos(id) ON DELETE CASCADE,
      equipo_id UUID REFERENCES equipos(id) ON DELETE CASCADE,
      goles INTEGER DEFAULT 0,
      asistencias INTEGER DEFAULT 0,
      tarjetas_amarillas INTEGER DEFAULT 0,
      tarjetas_rojas INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Tabla de multas
    CREATE TABLE IF NOT EXISTS multas (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
      motivo TEXT NOT NULL,
      monto NUMERIC(10, 2) NOT NULL,
      fecha DATE NOT NULL,
      pagado BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    `

    // Ejecutar SQL para crear tablas
    const { error: tablesError } = await supabaseAdmin.rpc("pgcrypto", { query: tablesSQL })

    if (tablesError) {
      // Si falla el método RPC, intentamos con consulta SQL directa
      const { error: sqlError } = await supabaseAdmin.sql(tablesSQL)
      if (sqlError) throw sqlError
    }

    // Configurar políticas de seguridad (RLS)
    const policiesSQL = `
    -- Activar RLS en todas las tablas
    ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
    ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE jugadores_equipos ENABLE ROW LEVEL SECURITY;
    ALTER TABLE estadisticas_jugadores ENABLE ROW LEVEL SECURITY;
    ALTER TABLE multas ENABLE ROW LEVEL SECURITY;

    -- Política para usuarios (todos pueden ver, solo pueden editar su propio perfil)
    CREATE POLICY IF NOT EXISTS "Usuarios pueden ver todos los perfiles" 
    ON usuarios FOR SELECT 
    USING (true);

    CREATE POLICY IF NOT EXISTS "Usuarios solo pueden actualizar su propio perfil" 
    ON usuarios FOR UPDATE 
    USING (auth.uid() = id);

    -- Política para partidos (todos pueden ver, todos pueden editar)
    CREATE POLICY IF NOT EXISTS "Todos pueden ver partidos" 
    ON partidos FOR SELECT 
    USING (true);

    CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden crear partidos" 
    ON partidos FOR INSERT 
    WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden actualizar partidos" 
    ON partidos FOR UPDATE 
    USING (auth.role() = 'authenticated');

    -- Políticas similares para las demás tablas
    CREATE POLICY IF NOT EXISTS "Todos pueden ver equipos" 
    ON equipos FOR SELECT 
    USING (true);

    CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden gestionar equipos" 
    ON equipos FOR ALL 
    USING (auth.role() = 'authenticated');

    CREATE POLICY IF NOT EXISTS "Todos pueden ver jugadores_equipos" 
    ON jugadores_equipos FOR SELECT 
    USING (true);

    CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden gestionar jugadores_equipos" 
    ON jugadores_equipos FOR ALL 
    USING (auth.role() = 'authenticated');

    CREATE POLICY IF NOT EXISTS "Todos pueden ver estadisticas_jugadores" 
    ON estadisticas_jugadores FOR SELECT 
    USING (true);

    CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden gestionar estadisticas_jugadores" 
    ON estadisticas_jugadores FOR ALL 
    USING (auth.role() = 'authenticated');

    CREATE POLICY IF NOT EXISTS "Todos pueden ver multas" 
    ON multas FOR SELECT 
    USING (true);

    CREATE POLICY IF NOT EXISTS "Usuarios autenticados pueden gestionar multas" 
    ON multas FOR ALL 
    USING (auth.role() = 'authenticated');
    `

    // Ejecutar SQL para configurar políticas
    const { error: policiesError } = await supabaseAdmin.rpc("pgcrypto", { query: policiesSQL })

    if (policiesError) {
      // Si falla el método RPC, intentamos con consulta SQL directa
      const { error: sqlError } = await supabaseAdmin.sql(policiesSQL)
      if (sqlError) throw sqlError
    }

    return NextResponse.json({
      success: true,
      message: "Base de datos configurada correctamente",
    })
  } catch (error) {
    console.error("Error al configurar Supabase:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error al configurar la base de datos",
      },
      { status: 500 },
    )
  }
}
