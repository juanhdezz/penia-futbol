"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/context/auth-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Miembro = {
  id: string
  nombre: string
  posicion: string | null
  imagen: string | null
  rol: string
  estadisticas: {
    partidos: number
    goles: number
    asistencias: number
    tarjetas_amarillas: number
    tarjetas_rojas: number
  }
}

export default function MiembrosPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    async function cargarMiembros() {
      const timeoutId = setTimeout(() => {
        if (loading) {
          setLoading(false)
          setError("La carga está tardando demasiado. Por favor, verifica tu conexión o inténtalo más tarde.")
        }
      }, 10000)

      try {
        if (!user) {
          setTimeout(() => {
            if (!user) {
              setLoading(false)
              setError("No se pudo cargar la información del usuario.")
            }
          }, 5000)
          return
        }

        if (!user.pena_id) {
          setLoading(false)
          return
        }

        const { data: usuarios, error: errorUsuarios } = await supabase
          .from("usuarios")
          .select("id, nombre, posicion, imagen, rol")
          .eq("pena_id", user.pena_id)
          .order("nombre")

        if (errorUsuarios) {
          console.error("Error al cargar usuarios:", errorUsuarios)
          setError("No se pudieron cargar los miembros de la peña")
          setLoading(false)
          return
        }

        if (!usuarios || usuarios.length === 0) {
          setMiembros([])
          setLoading(false)
          return
        }

        const miembrosConEstadisticas = await Promise.all(
          usuarios.map(async (usuario) => {
            try {
              const { count: partidos, error: errorPartidos } = await supabase
                .from("jugadores_equipos")
                .select("*", { count: "exact", head: true })
                .eq("usuario_id", usuario.id)

              const { data: estadisticas, error: errorEstadisticas } = await supabase
                .from("estadisticas_jugadores")
                .select("goles, asistencias, tarjetas_amarillas, tarjetas_rojas")
                .eq("usuario_id", usuario.id)

              if (errorPartidos || errorEstadisticas) {
                console.warn(`Error al cargar estadísticas para ${usuario.nombre}:`, 
                  errorPartidos || errorEstadisticas)
              }

              const goles = estadisticas?.reduce((sum, est) => sum + (est.goles || 0), 0) || 0
              const asistencias = estadisticas?.reduce((sum, est) => sum + (est.asistencias || 0), 0) || 0
              const tarjetas_amarillas = estadisticas?.reduce((sum, est) => sum + (est.tarjetas_amarillas || 0), 0) || 0
              const tarjetas_rojas = estadisticas?.reduce((sum, est) => sum + (est.tarjetas_rojas || 0), 0) || 0

              return {
                ...usuario,
                estadisticas: {
                  partidos: partidos || 0,
                  goles,
                  asistencias,
                  tarjetas_amarillas,
                  tarjetas_rojas,
                },
              }
            } catch (err) {
              console.error(`Error al procesar estadísticas para ${usuario.nombre}:`, err)
              return {
                ...usuario,
                estadisticas: {
                  partidos: 0,
                  goles: 0,
                  asistencias: 0,
                  tarjetas_amarillas: 0,
                  tarjetas_rojas: 0,
                },
              }
            }
          }),
        )

        setMiembros(miembrosConEstadisticas)
      } catch (error) {
        console.error("Error al cargar miembros:", error)
        setError("No se pudieron cargar los miembros")
      } finally {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    cargarMiembros()
  }, [loading, toast, user])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando miembros...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Miembros</h1>
          <p className="text-muted-foreground">Gestiona los integrantes de tu peña futbolera y sus estadísticas.</p>
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

  if (!user?.pena_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold">No perteneces a ninguna peña</h1>
        <p className="text-muted-foreground">Para gestionar miembros, primero debes unirte o crear una peña.</p>
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

  if (miembros.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Miembros</h1>
            <p className="text-muted-foreground">Gestiona los integrantes de tu peña futbolera y sus estadísticas.</p>
          </div>
          <Link href="/dashboard/miembros/nuevo">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir Miembro
            </Button>
          </Link>
        </div>
        
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <p className="text-lg">No hay miembros registrados en la peña</p>
          <p className="text-muted-foreground">Comienza añadiendo miembros a tu peña</p>
        </div>
      </div>
    )
  }

  const delanteros = miembros.filter((m) => m.posicion === "Delantero")
  const centrocampistas = miembros.filter((m) => m.posicion === "Centrocampista")
  const defensas = miembros.filter((m) => m.posicion === "Defensa" || m.posicion === "Portero")
  const sinPosicion = miembros.filter((m) => !m.posicion)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Miembros</h1>
          <p className="text-muted-foreground">Gestiona los integrantes de tu peña futbolera y sus estadísticas.</p>
        </div>
        <Link href="/dashboard/miembros/nuevo">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Añadir Miembro
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="todos">
        <TabsList className="grid w-full grid-cols-4 md:w-auto md:grid-cols-4">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="delanteros">Delanteros</TabsTrigger>
          <TabsTrigger value="centrocampistas">Centrocampistas</TabsTrigger>
          <TabsTrigger value="defensas">Defensas</TabsTrigger>
        </TabsList>
        <TabsContent value="todos" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {miembros.map((miembro) => (
              <Link href={`/dashboard/miembros/${miembro.id}`} key={miembro.id}>
                <Card className="overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={miembro.imagen || "/placeholder.svg"} alt={miembro.nombre} />
                        <AvatarFallback>
                          {miembro.nombre.charAt(0)}
                          {miembro.nombre.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{miembro.nombre}</CardTitle>
                          {miembro.rol === "admin" && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
                          )}
                        </div>
                        <CardDescription>{miembro.posicion || "Sin posición"}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Partidos:</span>
                        <span className="font-medium">{miembro.estadisticas.partidos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Goles:</span>
                        <span className="font-medium">{miembro.estadisticas.goles}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Asistencias:</span>
                        <span className="font-medium">{miembro.estadisticas.asistencias}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tarjetas:</span>
                        <span className="font-medium">
                          <span className="text-yellow-500">{miembro.estadisticas.tarjetas_amarillas}</span>
                          {" / "}
                          <span className="text-red-500">{miembro.estadisticas.tarjetas_rojas}</span>
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="delanteros" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {delanteros.length > 0 ? (
              delanteros.map((miembro) => (
                <Link href={`/dashboard/miembros/${miembro.id}`} key={miembro.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={miembro.imagen || "/placeholder.svg"} alt={miembro.nombre} />
                          <AvatarFallback>
                            {miembro.nombre.charAt(0)}
                            {miembro.nombre.split(" ")[1]?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{miembro.nombre}</CardTitle>
                          <CardDescription>{miembro.posicion}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Partidos:</span>
                          <span className="font-medium">{miembro.estadisticas.partidos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goles:</span>
                          <span className="font-medium">{miembro.estadisticas.goles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias:</span>
                          <span className="font-medium">{miembro.estadisticas.asistencias}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarjetas:</span>
                          <span className="font-medium">
                            <span className="text-yellow-500">{miembro.estadisticas.tarjetas_amarillas}</span>
                            {" / "}
                            <span className="text-red-500">{miembro.estadisticas.tarjetas_rojas}</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">No hay delanteros registrados</div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="centrocampistas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {centrocampistas.length > 0 ? (
              centrocampistas.map((miembro) => (
                <Link href={`/dashboard/miembros/${miembro.id}`} key={miembro.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={miembro.imagen || "/placeholder.svg"} alt={miembro.nombre} />
                          <AvatarFallback>
                            {miembro.nombre.charAt(0)}
                            {miembro.nombre.split(" ")[1]?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{miembro.nombre}</CardTitle>
                          <CardDescription>{miembro.posicion}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Partidos:</span>
                          <span className="font-medium">{miembro.estadisticas.partidos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goles:</span>
                          <span className="font-medium">{miembro.estadisticas.goles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias:</span>
                          <span className="font-medium">{miembro.estadisticas.asistencias}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarjetas:</span>
                          <span className="font-medium">
                            <span className="text-yellow-500">{miembro.estadisticas.tarjetas_amarillas}</span>
                            {" / "}
                            <span className="text-red-500">{miembro.estadisticas.tarjetas_rojas}</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                No hay centrocampistas registrados
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="defensas" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {defensas.length > 0 ? (
              defensas.map((miembro) => (
                <Link href={`/dashboard/miembros/${miembro.id}`} key={miembro.id}>
                  <Card className="overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={miembro.imagen || "/placeholder.svg"} alt={miembro.nombre} />
                          <AvatarFallback>
                            {miembro.nombre.charAt(0)}
                            {miembro.nombre.split(" ")[1]?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{miembro.nombre}</CardTitle>
                          <CardDescription>{miembro.posicion}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Partidos:</span>
                          <span className="font-medium">{miembro.estadisticas.partidos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goles:</span>
                          <span className="font-medium">{miembro.estadisticas.goles}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Asistencias:</span>
                          <span className="font-medium">{miembro.estadisticas.asistencias}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarjetas:</span>
                          <span className="font-medium">
                            <span className="text-yellow-500">{miembro.estadisticas.tarjetas_amarillas}</span>
                            {" / "}
                            <span className="text-red-500">{miembro.estadisticas.tarjetas_rojas}</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">No hay defensas registrados</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
