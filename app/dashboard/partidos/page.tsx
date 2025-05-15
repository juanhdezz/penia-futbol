"use client"

import { AvatarFallback } from "@/components/ui/avatar"
import { AvatarImage } from "@/components/ui/avatar"
import { Avatar } from "@/components/ui/avatar"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/context/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Partido = {
  id: string
  fecha: string
  hora: string
  campo: string
  resultado_equipo_a: number | null
  resultado_equipo_b: number | null
  estado: "Pendiente" | "Jugado" | "Cancelado"
  equipos: {
    id: string
    nombre: string
    jugadores: {
      id: string
      nombre: string
      imagen: string | null
    }[]
  }[]
}

export default function PartidosPage() {
  const [partidosPendientes, setPartidosPendientes] = useState<Partido[]>([])
  const [partidosJugados, setPartidosJugados] = useState<Partido[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function cargarPartidos() {
      // Establecer un límite de tiempo para la carga
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false)
          setError("La carga está tardando demasiado. Por favor, verifica tu conexión o inténtalo más tarde.")
        }
      }, 10000) // 10 segundos de tiempo máximo de carga

      try {
        if (!user) {
          // Si después de 5 segundos no hay usuario, mostramos un mensaje apropiado
          setTimeout(() => {
            if (!user) {
              setLoading(false)
              setError("No se pudo cargar la información del usuario.")
            }
          }, 5000)
          return
        }

        // Verificar si el usuario pertenece a una peña
        if (!user.pena_id) {
          setLoading(false)
          return // No mostraremos error aquí, mostraremos una UI adecuada
        }

        // Cargar partidos pendientes de la peña actual
        const { data: pendientes, error: errorPendientes } = await supabase
          .from("partidos")
          .select(`
            id, fecha, hora, campo, resultado_equipo_a, resultado_equipo_b, estado
          `)
          .eq("estado", "Pendiente")
          .eq("pena_id", user.pena_id)
          .order("fecha", { ascending: true })

        if (errorPendientes) {
          console.error("Error al cargar partidos pendientes:", errorPendientes)
          setError("No se pudieron cargar los partidos pendientes")
          setLoading(false)
          return
        }

        // Cargar partidos jugados de la peña actual
        const { data: jugados, error: errorJugados } = await supabase
          .from("partidos")
          .select(`
            id, fecha, hora, campo, resultado_equipo_a, resultado_equipo_b, estado
          `)
          .eq("estado", "Jugado")
          .eq("pena_id", user.pena_id)
          .order("fecha", { ascending: false })

        if (errorJugados) {
          console.error("Error al cargar partidos jugados:", errorJugados)
          setError("No se pudieron cargar los partidos jugados")
          setLoading(false)
          return
        }

        // Para cada partido, cargar sus equipos y jugadores
        const partidosPendientesCompletos = await Promise.all(
          (pendientes || []).map(async (partido) => {
            try {
              return await cargarEquiposYJugadores(partido)
            } catch (error) {
              console.error(`Error al procesar partido pendiente ${partido.id}:`, error)
              // Devolver el partido sin equipos completos en caso de error
              return {
                ...partido,
                equipos: [],
              }
            }
          }),
        )

        const partidosJugadosCompletos = await Promise.all(
          (jugados || []).map(async (partido) => {
            try {
              return await cargarEquiposYJugadores(partido)
            } catch (error) {
              console.error(`Error al procesar partido jugado ${partido.id}:`, error)
              // Devolver el partido sin equipos completos en caso de error
              return {
                ...partido,
                equipos: [],
              }
            }
          }),
        )

        setPartidosPendientes(partidosPendientesCompletos)
        setPartidosJugados(partidosJugadosCompletos)
      } catch (error) {
        console.error("Error al cargar partidos:", error)
        setError("No se pudieron cargar los partidos")
      } finally {
        setLoading(false)
        clearTimeout(timeoutId) // Limpiar el timeout cuando termine la carga
      }
    }

    cargarPartidos()
  }, [toast, user])

  async function cargarEquiposYJugadores(partido: any): Promise<Partido> {
    // Cargar equipos del partido
    const { data: equipos, error: errorEquipos } = await supabase
      .from("equipos")
      .select("id, nombre")
      .eq("partido_id", partido.id)

    if (errorEquipos) throw errorEquipos

    // Para cada equipo, cargar sus jugadores
    const equiposConJugadores = await Promise.all(
      (equipos || []).map(async (equipo) => {
        try {
          // Obtener IDs de jugadores del equipo
          const { data: jugadoresEquipo, error: errorJugadoresEquipo } = await supabase
            .from("jugadores_equipos")
            .select("usuario_id")
            .eq("equipo_id", equipo.id)

          if (errorJugadoresEquipo) throw errorJugadoresEquipo

          // Obtener detalles de los jugadores
          const jugadoresIds = jugadoresEquipo?.map((je) => je.usuario_id) || []

          if (jugadoresIds.length === 0) {
            return {
              ...equipo,
              jugadores: [],
            }
          }

          const { data: jugadores, error: errorJugadores } = await supabase
            .from("usuarios")
            .select("id, nombre, imagen")
            .in("id", jugadoresIds)

          if (errorJugadores) throw errorJugadores

          return {
            ...equipo,
            jugadores: jugadores || [],
          }
        } catch (error) {
          console.error(`Error al procesar equipo ${equipo.id}:`, error)
          return {
            ...equipo,
            jugadores: [],
          }
        }
      }),
    )

    return {
      ...partido,
      equipos: equiposConJugadores,
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando partidos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
          <p className="text-muted-foreground">Gestiona los partidos de tu peña futbolera.</p>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    )
  }

  // Si el usuario no está en una peña, mostrar mensaje apropiado
  if (!user?.pena_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold">No perteneces a ninguna peña</h1>
        <p className="text-muted-foreground">Para gestionar partidos, primero debes unirte o crear una peña.</p>
        <div className="flex gap-4">
          <Link href="/join-pena">
            <Button>Unirse a una peña</Button>
          </Link>
          <Link href="/setup">
            <Button variant="outline">Crear peña</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partidos</h1>
          <p className="text-muted-foreground">Gestiona los partidos de tu peña futbolera.</p>
        </div>
        <Link href="/dashboard/partidos/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Partido
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="proximos">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proximos">Próximos Partidos</TabsTrigger>
          <TabsTrigger value="pasados">Partidos Jugados</TabsTrigger>
        </TabsList>
        <TabsContent value="proximos" className="space-y-4">
          {partidosPendientes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No hay partidos programados</p>
                <p className="text-sm text-muted-foreground mb-4">Programa tu próximo partido para verlo aquí</p>
                <Link href="/dashboard/partidos/nuevo">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Partido
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partidosPendientes.map((partido) => (
                <Link href={`/dashboard/partidos/${partido.id}`} key={partido.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{partido.fecha}</CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-900"
                        >
                          {partido.hora}
                        </Badge>
                      </div>
                      <CardDescription>{partido.campo}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {partido.equipos.length === 2 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{partido.equipos[0].nombre}</div>
                            <div className="text-center font-bold">VS</div>
                            <div className="font-medium text-right">{partido.equipos[1].nombre}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs font-medium mb-1">Jugadores:</p>
                              <div className="flex flex-wrap gap-1">
                                {partido.equipos[0].jugadores.slice(0, 3).map((jugador) => (
                                  <Avatar key={jugador.id} className="h-6 w-6">
                                    <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                                    <AvatarFallback className="text-xs">{jugador.nombre.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {partido.equipos[0].jugadores.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    +{partido.equipos[0].jugadores.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium mb-1">Jugadores:</p>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {partido.equipos[1].jugadores.slice(0, 3).map((jugador) => (
                                  <Avatar key={jugador.id} className="h-6 w-6">
                                    <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                                    <AvatarFallback className="text-xs">{jugador.nombre.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {partido.equipos[1].jugadores.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    +{partido.equipos[1].jugadores.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          Equipos pendientes de generar
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="pasados" className="space-y-4">
          {partidosJugados.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No hay partidos jugados registrados</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Los partidos disputados aparecerán aquí una vez registres su resultado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {partidosJugados.map((partido) => (
                <Link href={`/dashboard/partidos/${partido.id}`} key={partido.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{partido.fecha}</CardTitle>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900"
                        >
                          Jugado
                        </Badge>
                      </div>
                      <CardDescription>{partido.campo}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {partido.equipos.length === 2 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{partido.equipos[0].nombre}</div>
                            <div className="text-center font-bold text-xl">
                              {partido.resultado_equipo_a} - {partido.resultado_equipo_b}
                            </div>
                            <div className="font-medium text-right">{partido.equipos[1].nombre}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-xs font-medium mb-1">Jugadores:</p>
                              <div className="flex flex-wrap gap-1">
                                {partido.equipos[0].jugadores.slice(0, 3).map((jugador) => (
                                  <Avatar key={jugador.id} className="h-6 w-6">
                                    <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                                    <AvatarFallback className="text-xs">{jugador.nombre.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {partido.equipos[0].jugadores.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    +{partido.equipos[0].jugadores.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-medium mb-1">Jugadores:</p>
                              <div className="flex flex-wrap gap-1 justify-end">
                                {partido.equipos[1].jugadores.slice(0, 3).map((jugador) => (
                                  <Avatar key={jugador.id} className="h-6 w-6">
                                    <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                                    <AvatarFallback className="text-xs">{jugador.nombre.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {partido.equipos[1].jugadores.length > 3 && (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                    +{partido.equipos[1].jugadores.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-muted-foreground py-2">
                          Información de equipos no disponible
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
