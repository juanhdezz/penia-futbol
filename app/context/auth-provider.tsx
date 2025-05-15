"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

type UserWithPena = User & {
  pena_id?: string | null
  rol?: string | null
}

type AuthContextType = {
  user: UserWithPena | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  checkUserPena: () => Promise<string | null>
  updateUserProfile: (data: Partial<{ nombre: string, imagen: string }>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserWithPena | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Función para obtener información adicional del usuario desde la tabla 'usuarios'
  const getUserInfo = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("pena_id, rol")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error al obtener información del usuario:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error inesperado al obtener información del usuario:", error)
      return null
    }
  }

  // Verificar si hay una sesión activa al cargar la aplicación
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          throw error
        }

        if (session?.user) {
          // Obtener información adicional del usuario
          const userInfo = await getUserInfo(session.user.id)
          
          // Combinar la información de autenticación con la información adicional
          setUser({
            ...session.user,
            pena_id: userInfo?.pena_id || null,
            rol: userInfo?.rol || null,
          })
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Suscribirse a cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Obtener información adicional del usuario
        const userInfo = await getUserInfo(session.user.id)
        
        // Combinar la información de autenticación con la información adicional
        setUser({
          ...session.user,
          pena_id: userInfo?.pena_id || null,
          rol: userInfo?.rol || null,
        })
        
        // Redireccionamiento inteligente
        const currentPath = window.location.pathname
        
        // Si el usuario inicia sesión pero no tiene peña y no está en la página de unirse
        if (!userInfo?.pena_id && 
            currentPath !== "/join-pena" && 
            !currentPath.includes("/setup") && 
            !currentPath.includes("/register") &&
            !currentPath.includes("/login")) {
          router.push("/join-pena")
        } 
        // Si el usuario inicia sesión, tiene peña y está en una página de autenticación
        else if (userInfo?.pena_id && 
                (currentPath === "/login" || 
                 currentPath === "/register" || 
                 currentPath === "/" || 
                 currentPath === "/join-pena")) {
          router.push("/dashboard")
        }
      } else {
        setUser(null)
        
        // Si el usuario cierra sesión y está en una página protegida, redirigir al inicio
        const currentPath = window.location.pathname
        if (currentPath.startsWith("/dashboard") || currentPath === "/join-pena") {
          router.push("/login")
        }
      }
    })

    // Limpiar la suscripción al desmontar el componente
    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Verificar si un usuario pertenece a una peña
  const checkUserPena = async (): Promise<string | null> => {
    try {
      if (!user) {
        console.log("checkUserPena: No hay usuario autenticado");
        return null;
      }
      
      console.log(`checkUserPena: Verificando peña para usuario ${user.id}...`);
      const { data, error } = await supabase
        .from("usuarios")
        .select("pena_id, rol")
        .eq("id", user.id)
        .single();
      
      if (error) {
        console.error("checkUserPena: Error al consultar información de usuario:", error);
        throw error;
      }
      
      console.log("checkUserPena: Datos obtenidos:", data);
      
      // Actualizar el estado local del usuario con la información actualizada
      if (data) {
        const needsUpdate = data.pena_id !== user.pena_id || data.rol !== user.rol;
        if (needsUpdate) {
          console.log("checkUserPena: Actualizando estado local del usuario con nueva información");
          setUser(prev => {
            if (!prev) return null;
            return {
              ...prev,
              pena_id: data.pena_id,
              rol: data.rol
            };
          });
          
          // Forzar refresco de la sesión si hay cambios
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const sessionUser = session.user;
            console.log("checkUserPena: Sesión refrescada con usuario:", sessionUser?.id);
          }
        } else {
          console.log("checkUserPena: No se requieren cambios en el estado del usuario");
        }
      }
      
      return data?.pena_id || null;
    } catch (error) {
      console.error("checkUserPena: Error al verificar peña del usuario:", error);
      return null;
    }
  };

  // Login con email y contraseña
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Obtener información de la peña del usuario
      if (data.user) {
        const userInfo = await getUserInfo(data.user.id)
        
        // Actualizar el estado con la información completa del usuario
        setUser({
          ...data.user,
          pena_id: userInfo?.pena_id || null,
          rol: userInfo?.rol || null,
        })
        
        // Redirigir según corresponda
        if (userInfo?.pena_id) {
          router.push("/dashboard")
        } else {
          router.push("/join-pena")
        }
      }
    } catch (error) {
      console.error("Error en login:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Registro de usuario
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true)
      
      // Llamar a nuestra API de registro en lugar de usar signUp directamente
      // Esto garantiza que el registro en auth y en la tabla usuarios estén sincronizados
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Mostrar información más detallada del error
        if (data.details) {
          console.error("Detalles del error:", data.details);
          throw new Error(data.error + (data.details ? `: ${data.details}` : ""));
        } else {
          throw new Error(data.error || "Error al registrar usuario");
        }
      }
      
      if (data.success) {
        // Iniciar sesión automáticamente después del registro
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          throw signInError;
        }
        
        if (signInData.user) {
          // Obtener información adicional del usuario
          const userInfo = await getUserInfo(signInData.user.id);
          
          // Actualizar el estado local con el usuario recién registrado e iniciado sesión
          setUser({
            ...signInData.user,
            pena_id: null,
            rol: null,
          });
          
          // Redirigir al usuario a la página de unirse a una peña
          router.push("/join-pena");
        }
      }
    } catch (error) {
      console.error("Error en registro:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setLoading(true)
      
      // Primero establecer el usuario como null en el estado para evitar redirecciones no deseadas
      setUser(null)
      
      // Usar la opción scope: 'global' para asegurar que se eliminan todas las sesiones
      const { error } = await supabase.auth.signOut({ scope: 'global' })
      
      if (error) {
        console.error("Error en signOut de Supabase:", error)
        throw error
      }
      
      // Forzar limpieza de localStorage
      localStorage.removeItem('supabase.auth.token')
      
      // Redirigir al usuario a la página de inicio
      router.push("/")
      
      // Forzar un refresco de la página para asegurar que todos los estados se limpian
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Enviar email para restablecer contraseña
  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-confirm`,
      })
      
      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error de restablecimiento:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Actualizar perfil de usuario
  const updateUserProfile = async (data: Partial<{ nombre: string, imagen: string }>) => {
    try {
      setLoading(true)
      
      if (!user) {
        throw new Error("No hay usuario autenticado")
      }
      
      // Actualizar el perfil en la tabla usuarios
      const { error } = await supabase
        .from("usuarios")
        .update(data)
        .eq("id", user.id)
      
      if (error) {
        throw error
      }
      
      // Actualizar el estado local
      setUser(prev => {
        if (!prev) return null
        return {
          ...prev,
          user_metadata: {
            ...prev.user_metadata,
            ...data
          }
        }
      })
    } catch (error) {
      console.error("Error al actualizar perfil:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        resetPassword, 
        checkUserPena,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
