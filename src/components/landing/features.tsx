import { AlertCircle, BookOpen, Clock, Cog, MessageSquare, ShieldCheck } from "lucide-react";

const features = [
  {
    name: "Aprobación rápida",
    description: "Proceso simplificado con respuesta en menos de 48 horas.",
    icon: Clock,
  },
  {
    name: "Documentación mínima",
    description: "Solo necesitamos tu identificación y comprobante de domicilio fiscal.",
    icon: BookOpen,
  },
  {
    name: "Asesoría personalizada",
    description: "Un asesor dedicado te acompaña durante todo el proceso.",
    icon: MessageSquare,
  },
  {
    name: "Seguridad garantizada",
    description: "Tus datos personales están protegidos con los más altos estándares.",
    icon: ShieldCheck,
  },
  {
    name: "Mantenimiento incluido",
    description: "Servicio técnico incluido durante la vigencia del contrato.",
    icon: Cog,
  },
  {
    name: "Sin sorpresas",
    description: "Pagos fijos mensuales sin comisiones ocultas ni cargos adicionales.",
    icon: AlertCircle,
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Características de nuestro <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">servicio</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Diseñado específicamente para profesionales de la salud como tú.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="flex gap-4 p-6 rounded-xl hover:bg-blue-50 transition-colors"
            >
              <div className="mt-1 flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{feature.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 