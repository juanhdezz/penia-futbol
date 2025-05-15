export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string
          nombre: string
          email: string
          imagen: string | null
          posicion: string | null
          habilidad: number
          created_at: string
          pena_id: string | null
          rol: string
        }
        Insert: {
          id: string
          nombre: string
          email: string
          imagen?: string | null
          posicion?: string | null
          habilidad?: number
          created_at?: string
          pena_id?: string | null
          rol?: string
        }
        Update: {
          id?: string
          nombre?: string
          email?: string
          imagen?: string | null
          posicion?: string | null
          habilidad?: number
          created_at?: string
          pena_id?: string | null
          rol?: string
        }
      }
      penas: {
        Row: {
          id: string
          nombre: string
          localizacion: string | null
          descripcion: string | null
          password: string
          logo: string | null
          fecha_creacion: string
          creador_id: string | null
          configuracion: Json
        }
        Insert: {
          id?: string
          nombre: string
          localizacion?: string | null
          descripcion?: string | null
          password: string
          logo?: string | null
          fecha_creacion?: string
          creador_id?: string | null
          configuracion?: Json
        }
        Update: {
          id?: string
          nombre?: string
          localizacion?: string | null
          descripcion?: string | null
          password?: string
          logo?: string | null
          fecha_creacion?: string
          creador_id?: string | null
          configuracion?: Json
        }
      }
      partidos: {
        Row: {
          id: string
          fecha: string
          hora: string
          campo: string
          resultado_equipo_a: number | null
          resultado_equipo_b: number | null
          estado: "Pendiente" | "Jugado" | "Cancelado"
          created_at: string
          pena_id: string | null
        }
        Insert: {
          id?: string
          fecha: string
          hora: string
          campo: string
          resultado_equipo_a?: number | null
          resultado_equipo_b?: number | null
          estado?: "Pendiente" | "Jugado" | "Cancelado"
          created_at?: string
          pena_id?: string | null
        }
        Update: {
          id?: string
          fecha?: string
          hora?: string
          campo?: string
          resultado_equipo_a?: number | null
          resultado_equipo_b?: number | null
          estado?: "Pendiente" | "Jugado" | "Cancelado"
          created_at?: string
          pena_id?: string | null
        }
      }
      equipos: {
        Row: {
          id: string
          partido_id: string
          nombre: string
          created_at: string
          pena_id: string | null
        }
        Insert: {
          id?: string
          partido_id: string
          nombre: string
          created_at?: string
          pena_id?: string | null
        }
        Update: {
          id?: string
          partido_id?: string
          nombre?: string
          created_at?: string
          pena_id?: string | null
        }
      }
      jugadores_equipos: {
        Row: {
          id: string
          equipo_id: string
          usuario_id: string
          created_at: string
        }
        Insert: {
          id?: string
          equipo_id: string
          usuario_id: string
          created_at?: string
        }
        Update: {
          id?: string
          equipo_id?: string
          usuario_id?: string
          created_at?: string
        }
      }
      estadisticas_jugadores: {
        Row: {
          id: string
          usuario_id: string
          partido_id: string
          equipo_id: string
          goles: number
          asistencias: number
          tarjetas_amarillas: number
          tarjetas_rojas: number
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id: string
          partido_id: string
          equipo_id: string
          goles?: number
          asistencias?: number
          tarjetas_amarillas?: number
          tarjetas_rojas?: number
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string
          partido_id?: string
          equipo_id?: string
          goles?: number
          asistencias?: number
          tarjetas_amarillas?: number
          tarjetas_rojas?: number
          created_at?: string
        }
      }
      multas: {
        Row: {
          id: string
          usuario_id: string
          motivo: string
          monto: number
          fecha: string
          pagado: boolean
          created_at: string
          pena_id: string | null
        }
        Insert: {
          id?: string
          usuario_id: string
          motivo: string
          monto: number
          fecha: string
          pagado?: boolean
          created_at?: string
          pena_id?: string | null
        }
        Update: {
          id?: string
          usuario_id?: string
          motivo?: string
          monto?: number
          fecha?: string
          pagado?: boolean
          created_at?: string
          pena_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
