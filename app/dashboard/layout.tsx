"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  BarChart3,
  Calendar,
  CreditCard,
  Home,
  LogOut,
  Menu,
  Settings,
  ClubIcon as Soccer,
  Trophy,
  Users,
  UserCircle,
} from "lucide-react"
import { useAuth } from "@/app/context/auth-provider"
import { supabase } from "@/lib/supabase"

type Pena = {
  id: string
  nombre: string
  localizacion: string | null
  logo: string | null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [pena, setPena] = useState<Pena | null>(null)
  const { user, logout, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)

    // Redirigir al login si no hay usuario autenticado
    if (!loading && !user && mounted) {
      router.push("/login")
      return
    }

    // Si el usuario no tiene peña, redirigir a la página de unirse
    if (!loading && user && !user.pena_id && mounted) {
      router.push("/join-pena")
      return
    }

    // Cargar información de la peña
    const loadPenaInfo = async () => {
      if (user?.pena_id) {
        const { data, error } = await supabase
          .from("penas")
          .select("id, nombre, localizacion, logo")
          .eq("id", user.pena_id)
          .single()

        if (!error && data) {
          setPena(data)
        }
      }
    }

    loadPenaInfo()
  }, [user, loading, router, mounted])

  // No renderizar nada hasta que sepamos si el usuario está autenticado
  if (loading || !mounted || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Soccer className="h-6 w-6" />
                <span>Mi Peña Futbolera</span>
              </Link>
              {pena && (
                <div className="flex flex-col items-center gap-2 py-4 border-y">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={pena.logo || "/placeholder.svg"} alt={pena.nombre} />
                    <AvatarFallback>{pena.nombre.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <p className="font-bold">{pena.nombre}</p>
                    {pena.localizacion && <p className="text-sm text-muted-foreground">{pena.localizacion}</p>}
                  </div>
                </div>
              )}
              <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Home className="h-5 w-5" />
                Inicio
              </Link>
              <Link
                href="/dashboard/perfil"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <UserCircle className="h-5 w-5" />
                Mi Perfil
              </Link>
              <Link
                href="/dashboard/miembros"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Users className="h-5 w-5" />
                Miembros
              </Link>
              <Link
                href="/dashboard/partidos"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Calendar className="h-5 w-5" />
                Partidos
              </Link>
              <Link
                href="/dashboard/estadisticas"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <BarChart3 className="h-5 w-5" />
                Estadísticas
              </Link>
              <Link
                href="/dashboard/equipos"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Trophy className="h-5 w-5" />
                Generador de Equipos
              </Link>
              <Link
                href="/dashboard/multas"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <CreditCard className="h-5 w-5" />
                Multas
              </Link>
              <Link
                href="/dashboard/configuracion"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-5 w-5" />
                Configuración
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary md:text-xl">
          <Soccer className="h-6 w-6" />
          <span className="hidden md:inline">Mi Peña Futbolera</span>
        </Link>
        {pena && (
          <div className="ml-auto mr-4 hidden md:flex items-center gap-2">
            <span className="font-medium">{pena.nombre}</span>
            {user.rol === "admin" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
            )}
          </div>
        )}
        <nav className="ml-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Cerrar sesión" onClick={() => logout()}>
            <LogOut className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt={user?.name || "Usuario"} />
            <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </nav>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <nav className="grid gap-6 p-6 text-lg font-medium">
            {pena && (
              <div className="flex flex-col items-center gap-2 py-4 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={pena.logo || "/placeholder.svg"} alt={pena.nombre} />
                  <AvatarFallback>{pena.nombre.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <p className="font-bold">{pena.nombre}</p>
                  {pena.localizacion && <p className="text-sm text-muted-foreground">{pena.localizacion}</p>}
                  {user.rol === "admin" && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
                  )}
                </div>
              </div>
            )}
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <Home className="h-5 w-5" />
              Inicio
            </Link>
            <Link
              href="/dashboard/perfil"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <UserCircle className="h-5 w-5" />
              Mi Perfil
            </Link>
            <Link
              href="/dashboard/miembros"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Users className="h-5 w-5" />
              Miembros
            </Link>
            <Link
              href="/dashboard/partidos"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Calendar className="h-5 w-5" />
              Partidos
            </Link>
            <Link
              href="/dashboard/estadisticas"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-5 w-5" />
              Estadísticas
            </Link>
            <Link
              href="/dashboard/equipos"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Trophy className="h-5 w-5" />
              Generador de Equipos
            </Link>
            <Link
              href="/dashboard/multas"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <CreditCard className="h-5 w-5" />
              Multas
            </Link>
            <Link
              href="/dashboard/configuracion"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-5 w-5" />
              Configuración
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
