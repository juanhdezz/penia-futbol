import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus } from "lucide-react"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getCurrentUser } from "@/lib/supabase"
import { format } from "date-fns"

async function getMultas() {
  const supabase = createServerSupabaseClient()
  const user = await getCurrentUser()
  
  if (!user) return []
  
  // Primero obtenemos el pena_id del usuario actual
  const { data: userData } = await supabase
    .from("usuarios")
    .select("pena_id")
    .eq("id", user.id)
    .single()
    
  if (!userData?.pena_id) return []
  
  // Obtenemos las multas de la peña con la información del usuario
  const { data: multas, error } = await supabase
    .from("multas")
    .select(`
      id,
      motivo,
      monto,
      fecha,
      pagado,
      created_at,
      usuario_id,
      usuarios:usuario_id (
        id,
        nombre,
        imagen
      )
    `)
    .eq("pena_id", userData.pena_id)
    .order("fecha", { ascending: false })
  
  if (error) {
    console.error("Error al obtener multas:", error)
    return []
  }
  
  return multas || []
}

export default async function MultasPage() {
  const multas = await getMultas()
  
  // Calcular el total de multas y el total pendiente
  const totalMultas = multas.reduce((sum, multa) => sum + multa.monto, 0)
  const totalPendiente = multas.filter((multa) => !multa.pagado).reduce((sum, multa) => sum + multa.monto, 0)
  const multasPendientes = multas.filter((multa) => !multa.pagado).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Multas</h1>
          <p className="text-muted-foreground">Gestiona las multas de los miembros de tu peña futbolera.</p>
        </div>
        <Link href="/dashboard/multas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Multa
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recaudado</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalMultas}</div>
            <p className="text-xs text-muted-foreground">Acumulado desde el inicio de temporada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendiente de Cobro</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalPendiente}</div>
            <p className="text-xs text-muted-foreground">
              {multasPendientes} multas sin pagar
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Multas</CardTitle>
          <CardDescription>Registro completo de todas las multas impuestas</CardDescription>
        </CardHeader>
        <CardContent>
          {multas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-muted-foreground mb-2">No hay multas registradas actualmente</p>
              <Link href="/dashboard/multas/nueva">
                <Button variant="outline">Crear nueva multa</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {multas.map((multa) => {
                const usuario = multa.usuarios || { nombre: "Usuario Desconocido", imagen: null };
                return (
                  <div key={multa.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={usuario.imagen || "/placeholder-user.jpg"} alt={usuario.nombre} />
                        <AvatarFallback>
                          {usuario.nombre.charAt(0)}
                          {usuario.nombre.split(" ")[1]?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{usuario.nombre}</p>
                        <p className="text-sm text-muted-foreground">{multa.motivo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-medium">€{multa.monto}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(multa.fecha), "dd/MM/yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant={multa.pagado ? "outline" : "destructive"}
                        className={
                          multa.pagado
                            ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100 dark:hover:bg-green-900"
                            : ""
                        }
                      >
                        {multa.pagado ? "Pagado" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
