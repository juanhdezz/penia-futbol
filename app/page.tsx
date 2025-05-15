import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ClubIcon as Soccer, Trophy, Users, BellIcon as Whistle } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <Soccer className="h-6 w-6" />
            <span>Mi Peña Futbolera</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="#caracteristicas" className="text-muted-foreground hover:text-foreground transition-colors">
              Características
            </Link>
            <Link href="#equipos" className="text-muted-foreground hover:text-foreground transition-colors">
              Equipos
            </Link>
            <Link href="#estadisticas" className="text-muted-foreground hover:text-foreground transition-colors">
              Estadísticas
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-background">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Gestiona tu peña de fútbol como nunca antes
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Organiza partidos, genera equipos equilibrados, lleva estadísticas y mantén a todos conectados con
                  nuestra plataforma especializada.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      Comenzar Ahora
                    </Button>
                  </Link>
                  <Link href="#caracteristicas">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Ver Características
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative w-full max-w-md aspect-square">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full opacity-20 blur-3xl"></div>
                  <div className="relative h-full flex items-center justify-center">
                    <Soccer className="h-32 w-32 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="caracteristicas" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Todo lo que necesitas</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Nuestra plataforma ofrece todas las herramientas para gestionar tu peña futbolera de manera eficiente
                  y divertida.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Gestión de Miembros</h3>
                <p className="text-center text-muted-foreground">
                  Administra los integrantes de tu peña, con perfiles, fotos y estadísticas personalizadas.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Estadísticas Completas</h3>
                <p className="text-center text-muted-foreground">
                  Lleva un registro detallado de partidos, goles, asistencias y todas las estadísticas relevantes.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/10 p-3">
                  <Whistle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Generador de Equipos</h3>
                <p className="text-center text-muted-foreground">
                  Crea equipos equilibrados automáticamente basados en las habilidades de los jugadores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Generator Preview */}
        <section id="equipos" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Generador de Equipos Inteligente
                </h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Nuestro algoritmo avanzado crea equipos equilibrados basados en las habilidades y estadísticas de cada
                  jugador.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Selección de jugadores disponibles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Equipos equilibrados automáticamente</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                    <span>Guarda y comparte las alineaciones</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-lg border bg-background p-6 shadow-lg">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">Generador de Equipos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-md border p-4">
                      <h4 className="font-semibold text-primary mb-2">Equipo A</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">JR</div>
                          <span>Juan Rodríguez</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">PG</div>
                          <span>Pedro Gómez</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">MS</div>
                          <span>Miguel Sánchez</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">AL</div>
                          <span>Antonio López</span>
                        </li>
                      </ul>
                    </div>
                    <div className="rounded-md border p-4">
                      <h4 className="font-semibold text-primary mb-2">Equipo B</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">CM</div>
                          <span>Carlos Martínez</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">JF</div>
                          <span>Javier Fernández</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">RD</div>
                          <span>Raúl Díaz</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">DM</div>
                          <span>David Moreno</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <Button className="w-full">Generar Nuevos Equipos</Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section id="estadisticas" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Estadísticas Detalladas</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Lleva un control completo de todas las estadísticas de tu peña futbolera.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
              <div className="rounded-lg border bg-background p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Ranking de Goleadores</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">1</div>
                      <span>Carlos Martínez</span>
                    </div>
                    <span className="font-bold">24 goles</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">2</div>
                      <span>Juan Rodríguez</span>
                    </div>
                    <span className="font-bold">18 goles</span>
                  </div>
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">3</div>
                      <span>Pedro Gómez</span>
                    </div>
                    <span className="font-bold">15 goles</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">4</div>
                      <span>Miguel Sánchez</span>
                    </div>
                    <span className="font-bold">12 goles</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-background p-6 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Últimos Partidos</h3>
                <div className="space-y-4">
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">12/05/2025</span>
                      <span className="text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-0.5 rounded">
                        Victoria
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mi Peña</span>
                      <span className="font-bold">3 - 1</span>
                      <span>Los Tigres</span>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">05/05/2025</span>
                      <span className="text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 px-2 py-0.5 rounded">
                        Derrota
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Deportivo FC</span>
                      <span className="font-bold">2 - 0</span>
                      <span>Mi Peña</span>
                    </div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">28/04/2025</span>
                      <span className="text-sm font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100 px-2 py-0.5 rounded">
                        Empate
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Mi Peña</span>
                      <span className="font-bold">2 - 2</span>
                      <span>Real Atlético</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  ¿Listo para mejorar tu peña?
                </h2>
                <p className="max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Únete ahora y lleva tu peña futbolera al siguiente nivel con todas nuestras herramientas.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" variant="secondary">
                    Registrarse Gratis
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-6 md:py-0">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
          <div className="flex items-center gap-2 text-primary">
            <Soccer className="h-5 w-5" />
            <span className="font-semibold">Mi Peña Futbolera</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Mi Peña Futbolera. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
