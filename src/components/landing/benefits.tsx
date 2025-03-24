// import Image from "next/image";
import { CheckCircle2, Clock, CreditCard, DollarSign, ThumbsUp, Zap } from "lucide-react";

const benefits = [
  {
    title: "Equipos de alta calidad",
    description:
      "Accede a los mejores equipos médicos y dentales del mercado sin comprometer tu capital.",
    icon: Zap,
  },
  {
    title: "Proceso rápido y sencillo",
    description: "Aprobación en menos de 48 horas y documentación mínima.",
    icon: Clock,
  },
  {
    title: "Financiamiento a tu medida",
    description:
      "Planes flexibles adaptados a tus necesidades y flujo de efectivo.",
    icon: CreditCard,
  },
  {
    title: "Beneficios fiscales",
    description:
      "100% deducible de impuestos como gasto de operación.",
    icon: DollarSign,
  },
  {
    title: "Sin pagos iniciales grandes",
    description:
      "Conserva tu capital para otras inversiones o emergencias.",
    icon: ThumbsUp,
  },
  {
    title: "Servicio técnico incluido",
    description:
      "Mantenimiento incluido durante toda la vigencia de tu contrato.",
    icon: CheckCircle2,
  },
];

export function Benefits() {
  return (
    <div id="benefits" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="container relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ventajas del <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">arrendamiento médico</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Nuestro sistema de arrendamiento te ofrece múltiples beneficios para tu consultorio y tu economía.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="group relative rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                {benefit.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 