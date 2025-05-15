"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/context/auth-provider"

export default function NuevoPartidoPage() {
  const [fecha, setFecha] = useState("")
  const [hora, setHora] = useState("")
  const [campo, setCampo] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!fecha || !hora || !campo) {
      setError("Por favor completa todos los campos")
      return
    }

    if (!user?.pena_id) {
      setError("No se pudo determinar la peña actual")
      return
    }

    try {
      setLoading(true)

      const { data, error: supabaseError } = await supabase
        .from("partidos")
        .insert({
          fecha,
          hora,
          campo,
          estado: "Pendiente",
          pena_id: user.pena_id,
        })
        .select("id")
        .single()

      if (supabaseError) {
        throw supabaseError
      }

      toast({
        title: "Éxito",
        description: "Partido creado correctamente",
      })

      router.push(`/dashboard/partidos/${data.id}`)
    } catch (err) {
      console.error("Error:", err)
      setError("Error al crear partido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Programar Nuevo Partido</CardTitle>
          <CardDescription>Completa la información para programar un nuevo partido</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora</Label>
              <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campo">Campo</Label>
              <Input
                id="campo"
                value={campo}
                onChange={(e) => setCampo(e.target.value)}
                placeholder="Nombre del campo"
                required
              />
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Programar Partido"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-muted-foreground">
            Después de crear el partido, podrás generar los equipos desde la sección de Equipos.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
