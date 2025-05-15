"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type Jugador = {
  id: string
  nombre: string
  imagen: string | null
  estadisticas?: {
    goles: number
    asistencias: number
    tarjetas_amarillas: number
    tarjetas_rojas: number
  }
}

type Equipo = {
  id: string
  nombre: string
  jugadores: Jugador[]
}

type Partido = {
  id: string
  fecha: string
  hora: string
  campo: string
  resultado_equipo_a: number | null
  resultado_equipo_b: number | null
  estado: "Pendiente" | "Jugado" | "Cancelado"
  equipos: Equipo[]
}

export default function DetallePartidoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [partido, setPartido] = useState<Partido | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resultadoA, setResultadoA] = useState<number | null>(null)
  const [resultadoB, setResultadoB] = useState<number | null>(null)
  const [estadisticasJugadores, setEstadisticasJugadores] = useState<
    Record<
      string,
      {
        goles: number
        asistencias: number
        tarjetas_amarillas: number
        tarjetas_rojas: number
      }
    >
  >({})

  const partidoId = params.id as string

  useEffect(() => {
    async function cargarPartido() {
      try {
        // Cargar datos del partido
        const { data: partidoData, error: partidoError } = await supabase
          .from("partidos")
          .select("id, fecha, hora, campo, resultado_equipo_a, resultado_equipo_b, estado")
          .eq("id", partidoId)
          .single()

        if (partidoError) throw partidoError

        // Cargar equipos del partido
        const { data: equiposData, error: equiposError } = await supabase
          .from("equipos")
          .select("id, nombre")
          .eq("partido_id", partidoId)

        if (equiposError) throw equiposError

        // Para cada equipo, cargar sus jugadores
        const equiposConJugadores = await Promise.all(
          (equiposData || []).map(async (equipo) => {
            // Obtener IDs de jugadores del equipo
            const { data: jugadoresEquipo, error: jugadoresEquipoError } = await supabase
              .from("jugadores_equipos")
              .select("usuario_id")
              .eq("equipo_id", equipo.id)

            if (jugadoresEquipoError) throw jugadoresEquipoError

            // Obtener detalles de los jugadores
            const jugadoresIds = jugadoresEquipo?.map((je) => je.usuario_id) || []

            if (jugadoresIds.length === 0) {
              return {
                ...equipo,
                jugadores: [],
              }
            }

            const { data: jugadores, error: jugadoresError } = await supabase
              .from("usuarios")
              .select("id, nombre, imagen")
              .in("id", jugadoresIds)

            if (jugadoresError) throw jugadoresError

            // Cargar estadísticas de los jugadores para este partido
            const estadisticasTemp: Record<
              string,
              {
                goles: number
                asistencias: number
                tarjetas_amarillas: number
                tarjetas_rojas: number
              }
            > = {}

            if (partidoData.estado === "Jugado") {
              const { data: estadisticasData, error: estadisticasError } = await supabase
                .from("estadisticas_jugadores")
                .select("usuario_id, goles, asistencias, tarjetas_amarillas, tarjetas_rojas")
                .eq("partido_id", partidoId)
                .in("usuario_id", jugadoresIds)

              if (estadisticasError) throw estadisticasError

              // Organizar estadísticas por jugador
              estadisticasData?.forEach((est) => {
                estadisticasTemp[est.usuario_id] = {
                  goles: est.goles || 0,
                  asistencias: est.asistencias || 0,
                  tarjetas_amarillas: est.tarjetas_amarillas || 0,
                  tarjetas_rojas: est.tarjetas_rojas || 0,
                }
              })

              setEstadisticasJugadores((prev) => ({ ...prev, ...estadisticasTemp }))
            }

            return {
              ...equipo,
              jugadores: (jugadores || []).map((j) => ({
                ...j,
                estadisticas: estadisticasTemp[j.id] || {
                  goles: 0,
                  asistencias: 0,
                  tarjetas_amarillas: 0,
                  tarjetas_rojas: 0,
                },
              })),
            }
          }),
        )

        const partidoCompleto = {
          ...partidoData,
          equipos: equiposConJugadores,
        }

        setPartido(partidoCompleto)
        setResultadoA(partidoData.resultado_equipo_a)
        setResultadoB(partidoData.resultado_equipo_b)
      } catch (error) {
        console.error("Error al cargar partido:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la información del partido",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    cargarPartido()
  }, [partidoId, toast])

  const actualizarEstadisticaJugador = (jugadorId: string, campo: string, valor: number) => {
    setEstadisticasJugadores((prev) => ({
      ...prev,
      [jugadorId]: {
        ...(prev[jugadorId] || {
          goles: 0,
          asistencias: 0,
          tarjetas_amarillas: 0,
          tarjetas_rojas: 0,
        }),
        [campo]: valor,
      },
    }))
  }

  const guardarResultado = async () => {
    if (!partido) return

    try {
      setSaving(true)

      // 1. Actualizar resultado del partido
      const { error: partidoError } = await supabase
        .from("partidos")
        .update({
          resultado_equipo_a: resultadoA,
          resultado_equipo_b: resultadoB,
          estado: "Jugado",
        })
        .eq("id", partidoId)

      if (partidoError) throw partidoError

      // 2. Guardar estadísticas de jugadores
      const estadisticasArray = []

      for (const equipoIndex in partido.equipos) {
        const equipo = partido.equipos[equipoIndex]

        for (const jugador of equipo.jugadores) {
          const estadisticasJugador = estadisticasJugadores[jugador.id] || {
            goles: 0,
            asistencias: 0,
            tarjetas_amarillas: 0,
            tarjetas_rojas: 0,
          }

          // Verificar si ya existen estadísticas para este jugador en este partido
          const { data: existingStats, error: checkError } = await supabase
            .from("estadisticas_jugadores")
            .select("id")
            .eq("partido_id", partidoId)
            .eq("usuario_id", jugador.id)
            .eq("equipo_id", equipo.id)
            .maybeSingle()

          if (checkError) throw checkError

          if (existingStats) {
            // Actualizar estadísticas existentes
            const { error: updateError } = await supabase
              .from("estadisticas_jugadores")
              .update({
                goles: estadisticasJugador.goles,
                asistencias: estadisticasJugador.asistencias,
                tarjetas_amarillas: estadisticasJugador.tarjetas_amarillas,
                tarjetas_rojas: estadisticasJugador.tarjetas_rojas,
              })
              .eq("id", existingStats.id)

            if (updateError) throw updateError
          } else {
            // Crear nuevas estadísticas
            estadisticasArray.push({
              partido_id: partidoId,
              usuario_id: jugador.id,
              equipo_id: equipo.id,
              goles: estadisticasJugador.goles,
              asistencias: estadisticasJugador.asistencias,
              tarjetas_amarillas: estadisticasJugador.tarjetas_amarillas,
              tarjetas_rojas: estadisticasJugador.tarjetas_rojas,
            })
          }
        }
      }

      if (estadisticasArray.length > 0) {
        const { error: estadisticasError } = await supabase.from("estadisticas_jugadores").insert(estadisticasArray)

        if (estadisticasError) throw estadisticasError
      }

      toast({
        title: "Éxito",
        description: "Resultado y estadísticas guardados correctamente",
      })

      // Recargar la página para mostrar los datos actualizados
      router.refresh()
    } catch (error) {
      console.error("Error al guardar resultado:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el resultado",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!partido) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-lg font-medium">Partido no encontrado</p>
            <p className="text-sm text-muted-foreground mb-4">El partido que buscas no existe o ha sido eliminado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Badge
          variant="outline"
          className={
            partido.estado === "Jugado"
              ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900"
              : partido.estado === "Cancelado"
                ? "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-900"
                : "bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-900"
          }
        >
          {partido.estado}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalles del Partido</CardTitle>
          <CardDescription>
            {partido.fecha} - {partido.hora} - {partido.campo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partido.equipos.length === 2 ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-xl font-bold">{partido.equipos[0].nombre}</div>
                <div className="flex items-center gap-4">
                  {partido.estado === "Jugado" ? (
                    <div className="text-2xl font-bold">
                      {partido.resultado_equipo_a} - {partido.resultado_equipo_b}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        className="w-16 text-center"
                        value={resultadoA !== null ? resultadoA : ""}
                        onChange={(e) => setResultadoA(Number.parseInt(e.target.value) || 0)}
                      />
                      <span className="text-xl font-bold">-</span>
                      <Input
                        type="number"
                        min="0"
                        className="w-16 text-center"
                        value={resultadoB !== null ? resultadoB : ""}
                        onChange={(e) => setResultadoB(Number.parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}
                </div>
                <div className="text-xl font-bold">{partido.equipos[1].nombre}</div>
              </div>

              <Tabs defaultValue="equipos">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="equipos">Alineaciones</TabsTrigger>
                  <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
                </TabsList>
                <TabsContent value="equipos" className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{partido.equipos[0].nombre}</h3>
                      <div className="space-y-3">
                        {partido.equipos[0].jugadores.map((jugador) => (
                          <div key={jugador.id} className="flex items-center gap-3 border-b pb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                              <AvatarFallback>
                                {jugador.nombre.charAt(0)}
                                {jugador.nombre.split(" ")[1]?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{jugador.nombre}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{partido.equipos[1].nombre}</h3>
                      <div className="space-y-3">
                        {partido.equipos[1].jugadores.map((jugador) => (
                          <div key={jugador.id} className="flex items-center gap-3 border-b pb-2">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                              <AvatarFallback>
                                {jugador.nombre.charAt(0)}
                                {jugador.nombre.split(" ")[1]?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-medium">{jugador.nombre}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="estadisticas" className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{partido.equipos[0].nombre}</h3>
                      <div className="space-y-3">
                        {partido.equipos[0].jugadores.map((jugador) => (
                          <div key={jugador.id} className="border rounded-md p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                                <AvatarFallback>
                                  {jugador.nombre.charAt(0)}
                                  {jugador.nombre.split(" ")[1]?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{jugador.nombre}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`goles-${jugador.id}`} className="text-xs">
                                  Goles
                                </Label>
                                <Input
                                  id={`goles-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.goles || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "goles",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`asistencias-${jugador.id}`} className="text-xs">
                                  Asistencias
                                </Label>
                                <Input
                                  id={`asistencias-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.asistencias || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "asistencias",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`amarillas-${jugador.id}`} className="text-xs">
                                  T. Amarillas
                                </Label>
                                <Input
                                  id={`amarillas-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.tarjetas_amarillas || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "tarjetas_amarillas",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`rojas-${jugador.id}`} className="text-xs">
                                  T. Rojas
                                </Label>
                                <Input
                                  id={`rojas-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.tarjetas_rojas || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "tarjetas_rojas",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-3">{partido.equipos[1].nombre}</h3>
                      <div className="space-y-3">
                        {partido.equipos[1].jugadores.map((jugador) => (
                          <div key={jugador.id} className="border rounded-md p-3">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                                <AvatarFallback>
                                  {jugador.nombre.charAt(0)}
                                  {jugador.nombre.split(" ")[1]?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">{jugador.nombre}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label htmlFor={`goles-${jugador.id}`} className="text-xs">
                                  Goles
                                </Label>
                                <Input
                                  id={`goles-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.goles || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "goles",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`asistencias-${jugador.id}`} className="text-xs">
                                  Asistencias
                                </Label>
                                <Input
                                  id={`asistencias-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.asistencias || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "asistencias",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`amarillas-${jugador.id}`} className="text-xs">
                                  T. Amarillas
                                </Label>
                                <Input
                                  id={`amarillas-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.tarjetas_amarillas || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "tarjetas_amarillas",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                              <div>
                                <Label htmlFor={`rojas-${jugador.id}`} className="text-xs">
                                  T. Rojas
                                </Label>
                                <Input
                                  id={`rojas-${jugador.id}`}
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={estadisticasJugadores[jugador.id]?.tarjetas_rojas || 0}
                                  onChange={(e) =>
                                    actualizarEstadisticaJugador(
                                      jugador.id,
                                      "tarjetas_rojas",
                                      Number.parseInt(e.target.value) || 0,
                                    )
                                  }
                                  disabled={partido.estado === "Jugado"}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg font-medium">No hay equipos definidos para este partido</p>
              <p className="text-sm text-muted-foreground">
                Utiliza el generador de equipos para crear los equipos para este partido
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          {partido.estado !== "Jugado" && (
            <Button onClick={guardarResultado} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Guardando..." : "Guardar Resultado"}
            </Button>
          )}
          <Button variant="destructive" disabled={saving}>
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Partido
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
