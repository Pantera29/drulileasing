import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-6 w-6 rounded-full bg-primary"></div>
              <span className="font-bold text-xl">Druli</span>
            </Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-lg font-medium">Panel de Cliente</h1>
          </div>
          <div>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container space-y-8">
          <div className="bg-cream rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">Bienvenido a tu panel de Druli</h2>
            <p className="text-gray-600 mb-6">
              Desde aquí podrás gestionar tus solicitudes de arrendamiento, revisar el estado de tus
              equipos y gestionar tus datos personales.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button>
                Nueva solicitud
              </Button>
              <Button variant="outline">
                Ver mis solicitudes
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Solicitudes en proceso</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-gray-500 mt-2">
                No tienes solicitudes en proceso actualmente.
              </p>
              <Link href="#" className="text-primary hover:underline text-sm block mt-4">
                Crear nueva solicitud
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Equipos arrendados</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-gray-500 mt-2">
                No tienes equipos arrendados actualmente.
              </p>
              <Link href="#" className="text-primary hover:underline text-sm block mt-4">
                Ver catálogo de equipos
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Próximos pagos</h3>
              <p className="text-3xl font-bold text-primary">$0.00</p>
              <p className="text-gray-500 mt-2">
                No tienes pagos pendientes por ahora.
              </p>
              <Link href="#" className="text-primary hover:underline text-sm block mt-4">
                Ver historial de pagos
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t py-6">
        <div className="container">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Druli. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
} 