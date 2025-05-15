"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Download, RefreshCw, Save, Shuffle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type Jugador = {
  id: string
  nombre: string
  habilidad: number
  posicion: string | null
  imagen: string | null
}

type EquipoGenerado = {
  nombre: string
  jugadores: Jugador[]
}

export default function EquiposPage() {
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<string[]>([])
  const [equipoA, setEquipoA] = useState<Jugador[]>([])
  const [equipoB, setEquipoB] = useState<Jugador[]>([])
  const [equiposGenerados, setEquiposGenerados] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function cargarJugadores() {
      try {
        const { data, error } = await supabase
          .from("usuarios")
          .select("id, nombre, habilidad, posicion, imagen")
          .order("nombre")

        if (error) {
          throw error
        }

        setJugadores(data || [])
      } catch (error) {
        console.error("Error al cargar jugadores:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los jugadores",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    cargarJugadores()
  }, [toast])

  const toggleJugador = (id: string) => {
    setJugadoresSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((jugadorId) => jugadorId !== id) : [...prev, id],
    )
  }

  const generarEquipos = () => {
    // Obtener solo los jugadores seleccionados
    const jugadoresDisponibles = jugadores.filter((jugador) => jugadoresSeleccionados.includes(jugador.id))

    // Verificar que hay suficientes jugadores (al menos 4 para 2 equipos de 2)
    if (jugadoresDisponibles.length < 4) {
      toast({
        title: "Error",
        description: "Selecciona al menos 4 jugadores para generar equipos",
        variant: "destructive",
      })
      return
    }

    // Ordenar jugadores por habilidad (de mayor a menor)
    const jugadoresOrdenados = [...jugadoresDisponibles].sort((a, b) => b.habilidad - a.habilidad)

    // Inicializar equipos vacíos
    const equipoATemp: Jugador[] = []
    const equipoBTemp: Jugador[] = []

    // Algoritmo de distribución: serpentina para equilibrar habilidades
    // 1, 4, 5, 8, 9... para equipo A
    // 2, 3, 6, 7, 10... para equipo B
    jugadoresOrdenados.forEach((jugador, index) => {
      if (index % 4 === 0 || index % 4 === 3) {
        equipoATemp.push(jugador)
      } else {
        equipoBTemp.push(jugador)
      }
    })

    setEquipoA(equipoATemp)
    setEquipoB(equipoBTemp)
    setEquiposGenerados(true)
    setGuardado(false)
  }

  const guardarEquipos = async () => {
    try {
      setLoading(true)

      // 1. Crear un nuevo partido
      const fechaActual = new Date().toISOString().split("T")[0]
      const { data: partidoData, error: partidoError } = await supabase
        .from("partidos")
        .insert({
          fecha: fechaActual,
          hora: "19:00", // Hora por defecto
          campo: "Campo Municipal", // Campo por defecto
          estado: "Pendiente",
        })
        .select("id")
        .single()

      if (partidoError) throw partidoError

      const partidoId = partidoData.id

      // 2. Crear equipo A
      const { data: equipoAData, error: equipoAError } = await supabase
        .from("equipos")
        .insert({
          partido_id: partidoId,
          nombre: "Equipo A",
        })
        .select("id")
        .single()

      if (equipoAError) throw equipoAError

      // 3. Crear equipo B
      const { data: equipoBData, error: equipoBError } = await supabase
        .from("equipos")
        .insert({
          partido_id: partidoId,
          nombre: "Equipo B",
        })
        .select("id")
        .single()

      if (equipoBError) throw equipoBError

      // 4. Asignar jugadores al equipo A
      const jugadoresEquipoA = equipoA.map((jugador) => ({
        equipo_id: equipoAData.id,
        usuario_id: jugador.id,
      }))

      const { error: jugadoresAError } = await supabase.from("jugadores_equipos").insert(jugadoresEquipoA)

      if (jugadoresAError) throw jugadoresAError

      // 5. Asignar jugadores al equipo B
      const jugadoresEquipoB = equipoB.map((jugador) => ({
        equipo_id: equipoBData.id,
        usuario_id: jugador.id,
      }))

      const { error: jugadoresBError } = await supabase.from("jugadores_equipos").insert(jugadoresEquipoB)

      if (jugadoresBError) throw jugadoresBError

      setGuardado(true)
      toast({
        title: "Éxito",
        description: "Equipos guardados correctamente",
      })
    } catch (error) {
      console.error("Error al guardar equipos:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los equipos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetearSeleccion = () => {
    setJugadoresSeleccionados([])
    setEquipoA([])
    setEquipoB([])
    setEquiposGenerados(false)
    setGuardado(false)
  }

  if (loading && jugadores.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generador de Equipos</h1>
        <p className="text-muted-foreground">
          Selecciona los jugadores disponibles y genera equipos equilibrados automáticamente.
        </p>
      </div>

      <Tabs defaultValue="seleccion">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="seleccion">Selección de Jugadores</TabsTrigger>
          <TabsTrigger value="equipos" disabled={!equiposGenerados}>
            Equipos Generados
          </TabsTrigger>
        </TabsList>
        <TabsContent value="seleccion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jugadores Disponibles</CardTitle>
              <CardDescription>Selecciona los jugadores que participarán en el partido</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {jugadores.map((jugador) => (
                  <div key={jugador.id} className="flex items-center space-x-2 border rounded-md p-3">
                    <Checkbox
                      id={`jugador-${jugador.id}`}
                      checked={jugadoresSeleccionados.includes(jugador.id)}
                      onCheckedChange={() => toggleJugador(jugador.id)}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={jugador.imagen || "/placeholder.svg"} alt={jugador.nombre} />
                        <AvatarFallback>
                          {jugador.nombre.charAt(0)}
                          {jugador.nombre.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Label htmlFor={`jugador-${jugador.id}`} className="font-medium">
                          {jugador.nombre}
                        </Label>
                        <p className="text-xs text-muted-foreground">{jugador.posicion || "Sin posición"}</p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">{jugador.habilidad}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={resetearSeleccion}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Resetear
              </Button>
              <Button onClick={generarEquipos} disabled={jugadoresSeleccionados.length < 4 || loading}>
                <Shuffle className="mr-2 h-4 w-4" />
                Generar Equipos
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="equipos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Equipo A</CardTitle>
                <CardDescription>
                  Habilidad media:{" "}
                  {equipoA.length > 0
                    ? Math.round(equipoA.reduce((sum, j) => sum + j.habilidad, 0) / equipoA.length)
                    : 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {equipoA.map((jugador) => (
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
                        <p className="text-xs text-muted-foreground">{jugador.posicion || "Sin posición"}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                        {jugador.habilidad}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Equipo B</CardTitle>
                <CardDescription>
                  Habilidad media:{" "}
                  {equipoB.length > 0
                    ? Math.round(equipoB.reduce((sum, j) => sum + j.habilidad, 0) / equipoB.length)
                    : 0}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {equipoB.map((jugador) => (
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
                        <p className="text-xs text-muted-foreground">{jugador.posicion || "Sin posición"}</p>
                      </div>
                      <div className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                        {jugador.habilidad}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setEquiposGenerados(false)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerar
            </Button>
            <Button onClick={guardarEquipos} disabled={guardado || loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Guardando..." : guardado ? "Guardado" : "Guardar Equipos"}
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
