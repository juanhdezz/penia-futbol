"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/app/context/auth-provider"
import { supabase } from "@/lib/supabase"

export default function NuevoMiembroPage() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [posicion, setPosicion] = useState("")
  const [habilidad, setHabilidad] = useState("50")
  const [rol, setRol] = useState("miembro")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nombre || !email) {
      setError("Por favor completa los campos obligatorios")
      return
    }

    if (!user?.pena_id) {
      setError("No se pudo determinar la peña actual")
      return
    }

    try {
      setLoading(true)

      // Generar una contraseña temporal
      const tempPassword = Math.random().toString(36).slice(-8)

      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { nombre },
      })

      if (authError) {
        throw authError
      }

      // Crear perfil de usuario
      const { error: profileError } = await supabase.from("usuarios").insert({
        id: authData.user.id,
        nombre,
        email,
        posicion: posicion || null,
        habilidad: Number.parseInt(habilidad),
        pena_id: user.pena_id,
        rol,
      })

      if (profileError) {
        // Si hay error al crear el perfil, intentar eliminar el usuario de auth
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
      }

      toast({
        title: "Éxito",
        description: "Miembro creado correctamente",
      })

      router.push("/dashboard/miembros")
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error al crear miembro")
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
          <CardTitle>Añadir Nuevo Miembro</CardTitle>
          <CardDescription>Completa la información para añadir un nuevo miembro a la peña</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo *</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <p className="text-xs text-muted-foreground">Se enviará un correo con instrucciones para acceder</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="posicion">Posición</Label>
              <Select value={posicion} onValueChange={setPosicion}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una posición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sin_posicion">Sin posición</SelectItem>
                  <SelectItem value="Portero">Portero</SelectItem>
                  <SelectItem value="Defensa">Defensa</SelectItem>
                  <SelectItem value="Centrocampista">Centrocampista</SelectItem>
                  <SelectItem value="Delantero">Delantero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="habilidad">Nivel de Habilidad (1-100)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="habilidad"
                  type="range"
                  min="1"
                  max="100"
                  value={habilidad}
                  onChange={(e) => setHabilidad(e.target.value)}
                  className="flex-1"
                />
                <span className="w-10 text-center font-medium">{habilidad}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Select value={rol} onValueChange={setRol}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miembro">Miembro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Los administradores pueden modificar la configuración de la peña
              </p>
            </div>
            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creando..." : "Crear Miembro"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">* Campos obligatorios</p>
        </CardFooter>
      </Card>
    </div>
  )
}
