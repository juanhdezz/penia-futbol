"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BarChart3, Calendar, CreditCard, Trophy, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/app/context/auth-provider"
import { useEffect, useState } from "react"

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userData, setUserData] = useState<any>(null)
  const [dashboardData, setDashboardData] = useState<any>({
    miembros: [],
    partidos: [],
    partidosPendientes: [],
    ultimosPartidos: [],
    multas: [],
    estadisticas: []
  })

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) {
        // Si después de 5 segundos no hay usuario, mostramos un error
        const timeout = setTimeout(() => {
          if (!user) {
            setError("No se pudo cargar la info del usuario. Por favor, recarga la página.")
            setLoading(false)
          }
        }, 5000)
        
        return () => clearTimeout(timeout)
      }
      
      try {
        // Obtener información del usuario con su peña
        const { data: userInfo, error: userError } = await supabase
          .from("usuarios")
          .select("*, pena:penas(*)")
          .eq("id", user.id)
          .single()
        
        if (userError) {
          console.error("Error al cargar datos del usuario:", userError)
          setError("No pudimos cargar tu información personal")
          setLoading(false)
          return
        }
        
        setUserData(userInfo)
        
        const penaId = userInfo?.pena_id
        
        // Si no tiene peña, terminamos
        if (!penaId) {
          setLoading(false)
          return
        }
        
        // Cargar datos del dashboard
        const [
          miembrosResult,
          partidosResult,
          partidosPendientesResult,
          ultimosPartidosResult,
          multasResult,
          estadisticasResult
        ] = await Promise.all([
          // Total de miembros de la peña
          supabase.from("usuarios").select("id").eq("pena_id", penaId),
          
          // Partidos de la peña
          supabase.from("partidos").select("*").eq("pena_id", penaId),
          
          // Próximos partidos
          supabase.from("partidos")
            .select("*")
            .eq("pena_id", penaId)
            .eq("estado", "Pendiente")
            .order("fecha", { ascending: true })
            .limit(3),
          
          // Últimos partidos
          supabase.from("partidos")
            .select("*")
            .eq("pena_id", penaId)
            .eq("estado", "Jugado")
            .order("fecha", { ascending: false })
            .limit(3),
          
          // Multas de la peña
          supabase.from("multas").select("*").eq("pena_id", penaId),
          
          // Estadísticas de jugadores
          supabase.from("estadisticas_jugadores")
            .select("*, usuario:usuarios(nombre)")
            .eq("usuarios.pena_id", penaId)
        ])
        
        setDashboardData({
          miembros: miembrosResult.data || [],
          partidos: partidosResult.data || [],
          partidosPendientes: partidosPendientesResult.data || [],
          ultimosPartidos: ultimosPartidosResult.data || [],
          multas: multasResult.data || [],
          estadisticas: estadisticasResult.data || []
        })
        
      } catch (err) {
        console.error("Error al cargar el dashboard:", err)
        setError("Ocurrió un error al cargar el dashboard")
      } finally {
        setLoading(false)
      }
    }
    
    loadDashboardData()
  }, [user])
  
  // Mostrar estado de carga, pero con tiempo límite
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold">Cargando dashboard...</h1>
        <p className="text-muted-foreground">Obteniendo información de tu peña</p>
        <div className="space-y-2 w-[400px]">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    )
  }
  
  // Mostrar error si ocurrió alguno
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Recargar</Button>
      </div>
    )
  }
  
  // Si no hay usuario logueado o no se pudo cargar
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold">Sesión no iniciada</h1>
        <p className="text-muted-foreground">Debes iniciar sesión para ver el dashboard</p>
        <Link href="/login">
          <Button>Iniciar sesión</Button>
        </Link>
      </div>
    )
  }
  
  // Si el usuario no pertenece a ninguna peña
  if (!userData?.pena_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <h1 className="text-2xl font-bold">No perteneces a ninguna peña futbolera</h1>
        <p className="text-muted-foreground">Para acceder al dashboard, debes unirte o crear una peña</p>
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
  
  // Datos para las tarjetas
  const totalMiembros = dashboardData.miembros.length || 0
  const totalPartidos = dashboardData.partidos.length || 0
  const partidosPendientes = dashboardData.partidosPendientes || []
  const ultimosPartidos = dashboardData.ultimosPartidos || []
  
  // Calcular victorias de la peña (suponemos que equipo_a es la peña)
  const victorias = dashboardData.partidos ? dashboardData.partidos.filter(
    (p: any) => p.estado === "Jugado" && p.resultado_equipo_a > p.resultado_equipo_b
  ).length : 0
  
  // Calcular fondos de multas
  const fondoMultas = dashboardData.multas ? dashboardData.multas.reduce(
    (acc: number, multa: any) => acc + (multa.pagado ? multa.monto : 0), 0
  ) : 0
  
  // Calcular estadísticas destacadas
  let maxGoleador = { nombre: '-', goles: 0 }
  let maxAsistente = { nombre: '-', asistencias: 0 }
  let maxMultado = { nombre: '-', monto: 0 }
  
  if (dashboardData.estadisticas && dashboardData.estadisticas.length > 0) {
    // Agrupar estadísticas por usuario
    const estadisticasPorUsuario = dashboardData.estadisticas.reduce((acc: any, est: any) => {
      const userId = est.usuario_id
      if (!acc[userId]) {
        acc[userId] = { 
          nombre: est.usuario?.nombre || 'Desconocido', 
          goles: 0, 
          asistencias: 0
        }
      }
      acc[userId].goles += est.goles || 0
      acc[userId].asistencias += est.asistencias || 0
      return acc
    }, {})
    
    // Encontrar máximo goleador y asistente
    Object.values(estadisticasPorUsuario).forEach((est: any) => {
      if (est.goles > maxGoleador.goles) {
        maxGoleador = { nombre: est.nombre, goles: est.goles }
      }
      if (est.asistencias > maxAsistente.asistencias) {
        maxAsistente = { nombre: est.nombre, asistencias: est.asistencias }
      }
    })
  }
  
  // Buscar el usuario más multado
  if (dashboardData.multas && dashboardData.multas.length > 0) {
    const multasPorUsuario = dashboardData.multas.reduce((acc: any, multa: any) => {
      const userId = multa.usuario_id
      if (!acc[userId]) {
        acc[userId] = { userId, total: 0, nombre: 'Desconocido' }
      }
      acc[userId].total += multa.monto || 0
      return acc
    }, {})
    
    const multasOrdenadas = Object.values(multasPorUsuario).sort((a: any, b: any) => 
      b.total - a.total
    )
    
    if (multasOrdenadas.length > 0) {
      const masMultado = multasOrdenadas[0] as any
      maxMultado = { nombre: masMultado.nombre || 'Desconocido', monto: masMultado.total }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido a {userData?.pena?.nombre || 'tu peña futbolera'}. Aquí tienes un resumen de toda la actividad.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMiembros}</div>
            <p className="text-xs text-muted-foreground">
              {totalMiembros === 0 ? 'No hay miembros aún' : 'Miembros activos'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartidos}</div>
            <p className="text-xs text-muted-foreground">
              {totalPartidos === 0 ? 'No hay partidos aún' : 'Partidos registrados'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Victorias</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{victorias}</div>
            <p className="text-xs text-muted-foreground">
              {totalPartidos > 0 ? `${Math.round(victorias / totalPartidos * 100)}% de efectividad` : 'Sin partidos'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fondo de Multas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{fondoMultas}</div>
            <p className="text-xs text-muted-foreground">
              {fondoMultas === 0 ? 'No hay multas pagadas' : 'Fondos recaudados'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Próximos Partidos</CardTitle>
            <CardDescription>Calendario de los próximos encuentros programados</CardDescription>
          </CardHeader>
          <CardContent>
            {partidosPendientes.length > 0 ? (
              <div className="space-y-4">
                {partidosPendientes.map((partido: any) => (
                  <div key={partido.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">Campo: {partido.campo}</p>
                      <p className="text-sm text-muted-foreground">{partido.ubicacion}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{new Date(partido.fecha).toLocaleDateString('es-ES')}</p>
                      <p className="text-sm text-muted-foreground">{partido.hora}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay partidos pendientes programados
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Estadísticas Destacadas</CardTitle>
            <CardDescription>Resumen de las principales estadísticas</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData.estadisticas.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Máximo Goleador</p>
                    <p className="text-sm text-muted-foreground">{maxGoleador.nombre}</p>
                  </div>
                  <div className="font-bold">{maxGoleador.goles} goles</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Máximo Asistente</p>
                    <p className="text-sm text-muted-foreground">{maxAsistente.nombre}</p>
                  </div>
                  <div className="font-bold">{maxAsistente.asistencias} asistencias</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Más Multado</p>
                    <p className="text-sm text-muted-foreground">{maxMultado.nombre}</p>
                  </div>
                  <div className="font-bold">€{maxMultado.monto}</div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay estadísticas disponibles
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Últimos Resultados</CardTitle>
            <CardDescription>Resultados de los últimos partidos disputados</CardDescription>
          </CardHeader>
          <CardContent>
            {ultimosPartidos.length > 0 ? (
              <div className="space-y-4">
                {ultimosPartidos.map((partido: any) => {
                  const resultado = partido.resultado_equipo_a > partido.resultado_equipo_b ? 
                    'Victoria' : partido.resultado_equipo_a < partido.resultado_equipo_b ? 
                    'Derrota' : 'Empate';
                  
                  const colorClass = resultado === 'Victoria' ? 
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                    resultado === 'Derrota' ? 
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
                    
                  return (
                    <div key={partido.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 text-center font-medium">
                          {new Date(partido.fecha).toLocaleDateString('es-ES')}
                        </div>
                        <div>
                          <p className="font-medium">Campo: {partido.campo}</p>
                          <p className="text-sm text-muted-foreground">{partido.ubicacion}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold">{partido.resultado_equipo_a} - {partido.resultado_equipo_b}</div>
                        <div className={`rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}>
                          {resultado}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No hay resultados de partidos anteriores
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Accede rápidamente a las funciones principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Link href="/dashboard/equipos">
                <Button className="w-full">
                  <Trophy className="mr-2 h-4 w-4" />
                  Generar Equipos
                </Button>
              </Link>
              <Link href="/dashboard/partidos/nuevo">
                <Button variant="outline" className="w-full">
                  <Calendar className="mr-2 h-4 w-4" />
                  Programar Partido
                </Button>
              </Link>
              <Link href="/dashboard/estadisticas">
                <Button variant="outline" className="w-full">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Ver Estadísticas
                </Button>
              </Link>
              <Link href="/dashboard/multas">
                <Button variant="outline" className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Registrar Multa
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
