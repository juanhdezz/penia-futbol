import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Datos de ejemplo para las estadísticas
const goleadoresEjemplo = [
  { id: 1, nombre: "Carlos Martínez", foto: "", goles: 24 },
  { id: 2, nombre: "Raúl Díaz", foto: "", goles: 15 },
  { id: 3, nombre: "Juan Rodríguez", foto: "", goles: 12 },
  { id: 4, nombre: "Javier Fernández", foto: "", goles: 8 },
  { id: 5, nombre: "Pedro Gómez", foto: "", goles: 2 },
]

const asistentesEjemplo = [
  { id: 1, nombre: "Juan Rodríguez", foto: "", asistencias: 18 },
  { id: 2, nombre: "Javier Fernández", foto: "", asistencias: 12 },
  { id: 3, nombre: "Carlos Martínez", foto: "", asistencias: 8 },
  { id: 4, nombre: "Raúl Díaz", foto: "", asistencias: 5 },
  { id: 5, nombre: "Pedro Gómez", foto: "", asistencias: 4 },
]

const tarjetasEjemplo = [
  { id: 1, nombre: "Pedro Gómez", foto: "", amarillas: 7, rojas: 0 },
  { id: 2, nombre: "David Moreno", foto: "", amarillas: 6, rojas: 1 },
  { id: 3, nombre: "Juan Rodríguez", foto: "", amarillas: 5, rojas: 1 },
  { id: 4, nombre: "Antonio López", foto: "", amarillas: 4, rojas: 0 },
  { id: 5, nombre: "Carlos Martínez", foto: "", amarillas: 3, rojas: 0 },
]

const partidosEjemplo = [
  {
    id: 1,
    fecha: "12/05/2025",
    rival: "Los Tigres",
    local: true,
    resultado: { golesAFavor: 3, golesEnContra: 1 },
    estado: "Victoria",
  },
  {
    id: 2,
    fecha: "05/05/2025",
    rival: "Deportivo FC",
    local: false,
    resultado: { golesAFavor: 0, golesEnContra: 2 },
    estado: "Derrota",
  },
  {
    id: 3,
    fecha: "28/04/2025",
    rival: "Real Atlético",
    local: true,
    resultado: { golesAFavor: 2, golesEnContra: 2 },
    estado: "Empate",
  },
  {
    id: 4,
    fecha: "21/04/2025",
    rival: "Sporting Club",
    local: false,
    resultado: { golesAFavor: 3, golesEnContra: 0 },
    estado: "Victoria",
  },
  {
    id: 5,
    fecha: "14/04/2025",
    rival: "Atlético Central",
    local: true,
    resultado: { golesAFavor: 1, golesEnContra: 1 },
    estado: "Empate",
  },
]

export default function EstadisticasPage() {
  // Calcular estadísticas generales
  const totalPartidos = partidosEjemplo.length
  const victorias = partidosEjemplo.filter((p) => p.estado === "Victoria").length
  const empates = partidosEjemplo.filter((p) => p.estado === "Empate").length
  const derrotas = partidosEjemplo.filter((p) => p.estado === "Derrota").length

  const golesMarcados = partidosEjemplo.reduce((sum, p) => sum + p.resultado.golesAFavor, 0)
  const golesRecibidos = partidosEjemplo.reduce((sum, p) => sum + p.resultado.golesEnContra, 0)

  const efectividad = Math.round(((victorias * 3 + empates) / (totalPartidos * 3)) * 100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
        <p className="text-muted-foreground">Consulta todas las estadísticas de tu peña futbolera.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartidos}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-green-600 font-medium">{victorias}V</span>
              <span className="text-yellow-600 font-medium">{empates}E</span>
              <span className="text-red-600 font-medium">{derrotas}D</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efectividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{efectividad}%</div>
            <p className="text-xs text-muted-foreground">
              {victorias * 3 + empates} de {totalPartidos * 3} puntos posibles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Marcados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{golesMarcados}</div>
            <p className="text-xs text-muted-foreground">{(golesMarcados / totalPartidos).toFixed(1)} por partido</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goles Recibidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{golesRecibidos}</div>
            <p className="text-xs text-muted-foreground">{(golesRecibidos / totalPartidos).toFixed(1)} por partido</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goleadores">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="goleadores">Goleadores</TabsTrigger>
          <TabsTrigger value="asistentes">Asistentes</TabsTrigger>
          <TabsTrigger value="tarjetas">Tarjetas</TabsTrigger>
        </TabsList>
        <TabsContent value="goleadores">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Goleadores</CardTitle>
              <CardDescription>Los jugadores con más goles en la temporada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goleadoresEjemplo.map((jugador, index) => (
                  <div key={jugador.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={jugador.foto || "/placeholder.svg"} alt={jugador.nombre} />
                        <AvatarFallback>
                          {jugador.nombre.charAt(0)}
                          {jugador.nombre.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{jugador.nombre}</p>
                      </div>
                    </div>
                    <div className="font-bold">{jugador.goles} goles</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="asistentes">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Asistentes</CardTitle>
              <CardDescription>Los jugadores con más asistencias en la temporada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {asistentesEjemplo.map((jugador, index) => (
                  <div key={jugador.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={jugador.foto || "/placeholder.svg"} alt={jugador.nombre} />
                        <AvatarFallback>
                          {jugador.nombre.charAt(0)}
                          {jugador.nombre.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{jugador.nombre}</p>
                      </div>
                    </div>
                    <div className="font-bold">{jugador.asistencias} asistencias</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tarjetas">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Tarjetas</CardTitle>
              <CardDescription>Los jugadores con más tarjetas en la temporada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tarjetasEjemplo.map((jugador, index) => (
                  <div key={jugador.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={jugador.foto || "/placeholder.svg"} alt={jugador.nombre} />
                        <AvatarFallback>
                          {jugador.nombre.charAt(0)}
                          {jugador.nombre.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{jugador.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-100 dark:hover:bg-yellow-900"
                      >
                        {jugador.amarillas} 🟨
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-900"
                      >
                        {jugador.rojas} 🟥
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Partidos</CardTitle>
          <CardDescription>Resultados de todos los partidos disputados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {partidosEjemplo.map((partido) => (
              <div key={partido.id} className="flex items-center justify-between border-b pb-4">
                <div>
                  <p className="font-medium">
                    {partido.local ? "Mi Peña" : partido.rival} vs {partido.local ? partido.rival : "Mi Peña"}
                  </p>
                  <p className="text-sm text-muted-foreground">{partido.fecha}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-bold">
                    {partido.local ? partido.resultado.golesAFavor : partido.resultado.golesEnContra} -{" "}
                    {partido.local ? partido.resultado.golesEnContra : partido.resultado.golesAFavor}
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
        </CardContent>
      </Card>
    </div>
  )
}
