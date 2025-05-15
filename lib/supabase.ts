import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Singleton pattern para el cliente de Supabase en el lado del cliente
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

// Cliente para el lado del servidor
export const createServerSupabaseClient = () => {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ceiflugymggbwszugmcr.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaWZsdWd5bWdnYndzenVnbWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzMyMzgwMSwiZXhwIjoyMDYyODk5ODAxfQ.NuUYN53m8ChWMbEa6vqEHxj2U43fWQh-LyLh4dFASu8",
  )
}

// Cliente para el lado del cliente (singleton para evitar múltiples instancias)
export const getSupabaseClient = () => {
  if (supabaseClient) return supabaseClient

  supabaseClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ceiflugymggbwszugmcr.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaWZsdWd5bWdnYndzenVnbWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjM4MDEsImV4cCI6MjA2Mjg5OTgwMX0.16z-5WjMUpmAY89wQl7XClhgE6isKbfEBrayRce0V_8",
  )

  return supabaseClient
}

// Exportar el cliente de Supabase para uso general
export const supabase = getSupabaseClient()

// Función para obtener el usuario actual
export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user
}
