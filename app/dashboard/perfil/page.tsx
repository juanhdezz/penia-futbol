"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Edit, User, Mail, Calendar, MapPin } from "lucide-react"
import { useAuth } from "@/app/context/auth-provider"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type UserStats = {
  partidos: number
  goles: number
  asistencias: number
  tarjetas_amarillas: number
  tarjetas_rojas: number
  valoracion: number
}

type PartidoJugado = {
  id: string
  fecha: string
  rival: string
  resultado: {
    golesAFavor: number
    golesEnContra: number
  }
  estado: "Victoria" | "Derrota" | "Empate"
  estadisticas?: {
    goles: number
    asistencias: number
    tarjetas_amarillas: number
    tarjetas_rojas: number
  }
}

export default function PerfilPage() {
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userStats, setUserStats] = useState<UserStats>({
    partidos: 0,
    goles: 0,
    asistencias: 0,
    tarjetas_amarillas: 0,
    tarjetas_rojas: 0,
    valoracion: 0
  })
  const [ultimosPartidos, setUltimosPartidos] = useState<PartidoJugado[]>([])
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function cargarPerfilUsuario() {
      if (!user) return

      try {
        // Cargar información detallada del perfil del usuario
        const { data: profileData, error: profileError } = await supabase
          .from("usuarios")
          .select("*, pena:penas(nombre, localizacion)")
          .eq("id", user.id)
          .single()

        if (profileError) {
          throw profileError
        }

        setUserProfile(profileData)

        // Obtener equipos en los que ha participado el usuario
        const { data: equiposParticipados, error: equiposError } = await supabase
          .from("jugadores_equipos")
          .select("equipo_id")
          .eq("usuario_id", user.id)

        if (equiposError) {
          throw equiposError
        }

        if (!equiposParticipados || equiposParticipados.length === 0) {
          setLoading(false)
          return // El usuario no ha participado en ningún partido
        }

        const equipoIds = equiposParticipados.map(e => e.equipo_id)

        // Obtener partidos de esos equipos
        const { data: equipos, error: equiposPartidosError } = await supabase
          .from("equipos")
          .select("partido_id")
          .in("id", equipoIds)

        if (equiposPartidosError) {
          throw equiposPartidosError
        }

        if (!equipos || equipos.length === 0) {
          setLoading(false)
          return
        }

        const partidoIds = equipos.map(e => e.partido_id)

        // Obtener estadísticas de los partidos jugados
        const { data: estadisticas, error: estadisticasError } = await supabase
          .from("estadisticas_jugadores")
          .select("*")
          .eq("usuario_id", user.id)
          .in("partido_id", partidoIds)

        if (estadisticasError) {
          throw estadisticasError
        }

        // Calcular estadísticas totales
        const totalStats = {
          partidos: partidoIds.length,
          goles: 0,
          asistencias: 0,
          tarjetas_amarillas: 0,
          tarjetas_rojas: 0,
          valoracion: 0
        }

        if (estadisticas && estadisticas.length > 0) {
          estadisticas.forEach(est => {
            totalStats.goles += est.goles || 0
            totalStats.asistencias += est.asistencias || 0
            totalStats.tarjetas_amarillas += est.tarjetas_amarillas || 0
            totalStats.tarjetas_rojas += est.tarjetas_rojas || 0
          })
        }

        // Calcular valoración (ejemplo)
        totalStats.valoracion = Math.round((totalStats.goles * 3 + totalStats.asistencias * 2) / Math.max(1, totalStats.partidos))

        setUserStats(totalStats)

        // Obtener los últimos 5 partidos
        const { data: partidos, error: partidosError } = await supabase
          .from("partidos")
          .select("*")
          .in("id", partidoIds)
          .eq("estado", "Jugado")
          .order("fecha", { ascending: false })
          .limit(5)

        if (partidosError) {
          throw partidosError
        }

        if (partidos && partidos.length > 0) {
          // Transformar los datos de partidos al formato necesario
          const partidosFormateados = partidos.map(partido => {
            // Encontrar estadísticas del usuario para este partido
            const estadisticasPartido = estadisticas?.find(est => est.partido_id === partido.id) || {
              goles: 0,
              asistencias: 0,
              tarjetas_amarillas: 0,
              tarjetas_rojas: 0
            }

            // Determinar si fue victoria, derrota o empate
            let estado: "Victoria" | "Derrota" | "Empate"
            if (partido.resultado_equipo_a > partido.resultado_equipo_b) {
              estado = "Victoria"
            } else if (partido.resultado_equipo_a < partido.resultado_equipo_b) {
              estado = "Derrota"
            } else {
              estado = "Empate"
            }

            return {
              id: partido.id,
              fecha: new Date(partido.fecha).toLocaleDateString(),
              rival: "Rival", // En un caso real, obtendrías el nombre del rival
              resultado: {
                golesAFavor: partido.resultado_equipo_a,
                golesEnContra: partido.resultado_equipo_b
              },
              estado,
              estadisticas: {
                goles: estadisticasPartido.goles || 0,
                asistencias: estadisticasPartido.asistencias || 0,
                tarjetas_amarillas: estadisticasPartido.tarjetas_amarillas || 0,
                tarjetas_rojas: estadisticasPartido.tarjetas_rojas || 0
              }
            }
          })

          setUltimosPartidos(partidosFormateados)
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err)
        setError("No se pudo cargar la información del perfil")
      } finally {
        setLoading(false)
      }
    }

    cargarPerfilUsuario()
  }, [user, toast])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando información de perfil...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">Error al cargar el perfil: {error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
          <p className="text-muted-foreground">No se encontró información del perfil</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-muted-foreground">Consulta y gestiona tu información personal y estadísticas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Columna izquierda - Información personal */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="relative">
              <div className="absolute right-4 top-4">
                <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/configuracion")}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={userProfile.imagen || "/placeholder.svg"} alt={userProfile.nombre} />
                  <AvatarFallback className="text-2xl">
                    {userProfile.nombre.charAt(0)}
                    {userProfile.nombre.split(" ")[1]?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-center">{userProfile.nombre}</CardTitle>
                <CardDescription className="text-center">
                  {userProfile.rol === "administrador" ? "Administrador" : "Miembro"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Posición</p>
                    <p className="font-medium">{userProfile.posicion || "No especificada"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{userProfile.email}</p>
                  </div>
                </div>
                {userProfile.created_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Miembro desde</p>
                      <p className="font-medium">{new Date(userProfile.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {userProfile.pena && userProfile.pena.nombre && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Peña</p>
                      <p className="font-medium">{userProfile.pena.nombre}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nivel de habilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full"
                    style={{ width: `${userProfile.habilidad || 50}%` }}
                  ></div>
                </div>
                <p className="text-center font-medium">{userProfile.habilidad || 50}/100</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha - Estadísticas y partidos */}
        <div className="md:col-span-5 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Partidos jugados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.partidos}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Goles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.goles}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.partidos > 0
                    ? `${(userStats.goles / userStats.partidos).toFixed(2)} por partido`
                    : "Sin partidos"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Asistencias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.asistencias}</div>
                <p className="text-xs text-muted-foreground">
                  {userStats.partidos > 0
                    ? `${(userStats.asistencias / userStats.partidos).toFixed(2)} por partido`
                    : "Sin partidos"}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas detalladas</CardTitle>
              <CardDescription>
                Resumen de tu rendimiento en la temporada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Valoración media</p>
                    <div className="flex items-center">
                      <span className="font-bold text-lg">{userStats.valoracion}</span>
                      <span className="text-xs text-muted-foreground ml-1">/10</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Goles por partido</p>
                    <span className="font-medium">
                      {userStats.partidos > 0
                        ? (userStats.goles / userStats.partidos).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Asistencias por partido</p>
                    <span className="font-medium">
                      {userStats.partidos > 0
                        ? (userStats.asistencias / userStats.partidos).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                  <Separator />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Tarjetas amarillas</p>
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        {userStats.tarjetas_amarillas} 🟨
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Tarjetas rojas</p>
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                        {userStats.tarjetas_rojas} 🟥
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <p className="text-muted-foreground">Contribución total</p>
                    <span className="font-medium">
                      {userStats.goles + userStats.asistencias} acciones
                    </span>
                  </div>
                  <Separator />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimos partidos</CardTitle>
              <CardDescription>
                Resultados de tus últimos partidos disputados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ultimosPartidos.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No has participado en ningún partido todavía</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ultimosPartidos.map((partido) => (
                    <div key={partido.id} className="flex items-center justify-between border-b pb-4">
                      <div>
                        <p className="font-medium">
                          Mi Peña vs {partido.rival}
                        </p>
                        <p className="text-sm text-muted-foreground">{partido.fecha}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="font-bold">
                          {partido.resultado.golesAFavor} - {partido.resultado.golesEnContra}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            partido.estado === "Victoria"
                              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900"
                              : partido.estado === "Empate"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-900"
                                : "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-900"
                          }
                        >
                          {partido.estado}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" onClick={() => router.push("/dashboard/partidos")}>
                Ver todos los partidos
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}