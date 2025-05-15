"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSetup = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/setup-supabase")
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Error al configurar la base de datos")
      }

      setSuccess(true)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error al configurar la base de datos")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Configuración Inicial</CardTitle>
          <CardDescription className="text-center">Configura la base de datos de Mi Peña Futbolera</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center font-medium">¡Base de datos configurada correctamente!</p>
              <p className="text-center text-sm text-muted-foreground">Ya puedes comenzar a utilizar la aplicación.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este proceso creará todas las tablas necesarias y configurará las políticas de seguridad en tu base de
                datos Supabase.
              </p>
              <p className="text-sm text-muted-foreground">Solo necesitas ejecutar este proceso una vez.</p>
              <Button className="w-full" onClick={handleSetup} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  "Configurar Base de Datos"
                )}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {success && (
            <Link href="/login">
              <Button>Ir a Iniciar Sesión</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
