"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClubIcon as Soccer } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/auth-provider"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export default function JoinPenaPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const { user, checkUserPena } = useAuth()
  const router = useRouter()

  // Unirse a una peña
  const [penaId, setPenaId] = useState("")
  const [penaPassword, setPenaPassword] = useState("")

  // Crear una peña
  const [nombrePena, setNombrePena] = useState("")
  const [localizacion, setLocalizacion] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    // Verificar si el usuario ya pertenece a una peña
    const checkUserPenaStatus = async () => {
      try {
        if (user) {
          const penaId = await checkUserPena()
          if (penaId) {
            setRedirecting(true)
            // El usuario ya pertenece a una peña, redirigir al dashboard
            router.push("/dashboard")
          }
        }
      } catch (err) {
        console.error("Error al verificar peña:", err)
      }
    }

    checkUserPenaStatus()
  }, [user, router, checkUserPena])

  // Si el usuario no está autenticado, redirigir al login
  useEffect(() => {
    if (!user && !loading) {
      router.push("/login?redirect=/join-pena")
    }
  }, [user, loading, router])

  const handleJoinPena = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!user) {
      setError("Debes iniciar sesión para unirte a una peña")
      return
    }

    if (!penaId || !penaPassword) {
      setError("Por favor completa todos los campos")
      return
    }

    try {
      setLoading(true)
      console.log("Iniciando proceso de unión a peña...", { penaId })

      // Verificar que la peña existe y la contraseña es correcta
      console.log("Verificando existencia de la peña...")
      const { data: penaData, error: penaError } = await supabase
        .from("penas")
        .select("id, nombre, password")
        .eq("id", penaId)
        .single()

      if (penaError) {
        console.error("Error al buscar peña:", penaError)
        if (penaError.code === "PGRST116") {
          throw new Error("Peña no encontrada. Verifica el ID proporcionado.")
        } else {
          throw new Error(`Error al buscar la peña: ${penaError.message}`)
        }
      }

      if (!penaData) {
        throw new Error("Peña no encontrada. Verifica el ID proporcionado.")
      }

      console.log("Peña encontrada, verificando contraseña...")
      if (penaData.password !== penaPassword) {
        throw new Error("Contraseña incorrecta. Verifica e intenta de nuevo.")
      }

      console.log("Contraseña correcta, actualizando el usuario...")
      // Actualizar el usuario con la peña seleccionada
      const { data: updateData, error: updateError } = await supabase
        .from("usuarios")
        .update({ 
          pena_id: penaId, 
          rol: "miembro",
          updated_at: new Date().toISOString() 
        })
        .eq("id", user.id)
        .select()

      if (updateError) {
        console.error("Error al actualizar usuario:", updateError)
        throw new Error(`Error al unirte a la peña: ${updateError.message}`)
      }

      console.log("Usuario actualizado correctamente:", updateData)
      // Refrescar el estado del usuario para actualizar la peña_id
      await checkUserPena()

      setSuccess(`¡Te has unido a la peña "${penaData.nombre}" correctamente!`)

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        setRedirecting(true)
        console.log("Redirigiendo al dashboard...")
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error("Error completo:", err)
      setError(err instanceof Error ? err.message : "Error al unirse a la peña")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePena = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!user) {
      setError("Debes iniciar sesión para crear una peña")
      return
    }

    if (!nombrePena || !password || !confirmPassword) {
      setError("Por favor completa los campos obligatorios")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      setLoading(true)
      console.log("Iniciando creación de peña...")

      // Crear la peña
      const { data: penaData, error: penaError } = await supabase
        .from("penas")
        .insert({
          nombre: nombrePena,
          localizacion: localizacion || null,
          descripcion: descripcion || null,
          password,
          creador_id: user.id,
        })
        .select("id")
        .single()

      if (penaError) {
        console.error("Error al crear peña:", penaError)
        throw new Error(`Error al crear la peña: ${penaError.message}`)
      }

      if (!penaData) {
        throw new Error("Error al obtener ID de la peña creada")
      }

      console.log("Peña creada con ID:", penaData.id)
      console.log("Actualizando usuario como administrador...")

      // Actualizar el usuario como administrador de la peña
      const { data: updateData, error: updateError } = await supabase
        .from("usuarios")
        .update({
          pena_id: penaData.id,
          rol: "administrador",
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)
        .select()

      if (updateError) {
        // Intentar eliminar la peña creada si hubo error al actualizar usuario
        await supabase.from("penas").delete().eq("id", penaData.id)
        console.error("Error al actualizar rol de usuario:", updateError)
        throw new Error(`Error al asignarte como administrador: ${updateError.message}`)
      }

      console.log("Usuario actualizado como administrador:", updateData)
      
      // Refrescar el estado del usuario para actualizar la peña_id
      console.log("Actualizando estado del usuario en la aplicación...")
      await checkUserPena()

      setSuccess(`¡Peña "${nombrePena}" creada correctamente!`)

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        setRedirecting(true)
        console.log("Redirigiendo al dashboard...")
        router.push("/dashboard")
      }, 2000)
    } catch (err) {
      console.error("Error completo:", err)
      setError(err instanceof Error ? err.message : "Error al crear la peña")
    } finally {
      setLoading(false)
    }
  }

  if (redirecting) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Soccer className="h-16 w-16 text-primary animate-pulse" />
        <h1 className="text-2xl font-bold">Redirigiendo...</h1>
        <p className="text-muted-foreground">Por favor espera mientras te llevamos al dashboard</p>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] md:w-[550px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Soccer className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Mi Peña Futbolera</h1>
          <p className="text-sm text-muted-foreground">
            Únete o crea una peña para gestionar partidos, equipos y estadísticas
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Únete o Crea una Peña</CardTitle>
            <CardDescription className="text-center">
              Para continuar, únete a una peña existente o crea una nueva
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-50">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="join">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="join">Unirse a una Peña</TabsTrigger>
                <TabsTrigger value="create">Crear Peña</TabsTrigger>
              </TabsList>

              <TabsContent value="join">
                <form onSubmit={handleJoinPena} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="pena-id">ID de la Peña</Label>
                    <Input
                      id="pena-id"
                      value={penaId}
                      onChange={(e) => setPenaId(e.target.value)}
                      placeholder="Introduce el ID de la peña"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      El ID de la peña lo proporciona el administrador
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pena-password">Contraseña de la Peña</Label>
                    <Input
                      id="pena-password"
                      type="password"
                      value={penaPassword}
                      onChange={(e) => setPenaPassword(e.target.value)}
                      placeholder="Introduce la contraseña de la peña"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      La contraseña la proporciona el administrador de la peña
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Unirse a la Peña"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="create">
                <form onSubmit={handleCreatePena} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre-pena">Nombre de la Peña</Label>
                    <Input
                      id="nombre-pena"
                      value={nombrePena}
                      onChange={(e) => setNombrePena(e.target.value)}
                      placeholder="Ej: Peña Madridista"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="localizacion">Localización (Opcional)</Label>
                    <Input
                      id="localizacion"
                      value={localizacion}
                      onChange={(e) => setLocalizacion(e.target.value)}
                      placeholder="Ej: Madrid, España"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción (Opcional)</Label>
                    <Textarea
                      id="descripcion"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Breve descripción de la peña..."
                      disabled={loading}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña de Acceso</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Contraseña para unirse a la peña"
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Esta contraseña la necesitarán los miembros para unirse
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la contraseña"
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando Peña...
                      </>
                    ) : (
                      "Crear Peña"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
