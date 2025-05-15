import { Suspense } from "react"
import { ClubIcon as Soccer } from "lucide-react"
import LoginForm from "./login-form"

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <Soccer className="h-12 w-12 text-primary" />
          <h1 className="text-2xl font-bold">Mi Peña Futbolera</h1>
          <p className="text-sm text-muted-foreground">
            Inicia sesión para gestionar tu peña futbolera
          </p>
        </div>

        <Suspense fallback={<div className="text-center p-4">Cargando...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
