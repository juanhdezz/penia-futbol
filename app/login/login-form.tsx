"use client"
import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ClubIcon as Soccer } from "lucide-react"
import { Loader2 } from "lucide-react" 
import { useAuth } from "@/app/context/auth-provider"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const { login, loading, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"
  
  // Si el usuario ya está autenticado y ya tiene peña, redirigir al dashboard
  useEffect(() => {
    if (user && user.pena_id) {
      router.push("/dashboard")
    } else if (user && !user.pena_id && redirect !== "/join-pena") {
      // Si está autenticado pero no tiene peña, redirigir a unirse a una peña
      router.push("/join-pena")
    }
  }, [user, router, redirect])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email || !password) {
      setError("Por favor, completa todos los campos")
      return
    }

    try {
      await login(email, password)
      // El redireccionamiento se maneja en el AuthProvider
    } catch (err) {
      console.error("Error al iniciar sesión:", err)
      
      // Manejar errores específicos para dar mensajes más claros al usuario
      if (err instanceof Error) {
        if (err.message.includes("Invalid login")) {
          setError("Credenciales incorrectas. Verifica tu email y contraseña.")
        } else if (err.message.includes("Email not confirmed")) {
          setError("Tu email no ha sido confirmado. Por favor, revisa tu bandeja de entrada.")
        } else {
          setError(`Error al iniciar sesión: ${err.message}`)
        }
      } else {
        setError("Error al iniciar sesión. Por favor, intenta de nuevo.")
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus datos para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email" 
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Contraseña</Label>
              <Link
                href="/reset-password"
                className="text-xs text-primary hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="text-sm text-muted-foreground text-center w-full">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="text-primary hover:underline"
          >
            Regístrate
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}