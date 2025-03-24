import Image from "next/image";
import { CheckCircle2, Clock, CreditCard, DollarSign, ThumbsUp, Zap } from "lucide-react";

const benefits = [
  {
    name: "Aprobación rápida",
    description:
      "Tu solicitud de arrendamiento se aprueba en menos de 48 horas.",
    icon: Clock,
  },
  {
    name: "Sin aval requerido",
    description:
      "No necesitas presentar un aval para acceder a nuestro arrendamiento.",
    icon: ThumbsUp,
  },
  {
    name: "Deducible de impuestos",
    description:
      "El 100% del arrendamiento es deducible de impuestos para tu consultorio.",
    icon: DollarSign,
  },
  {
    name: "Conserva tu liquidez",
    description:
      "No compres equipo y conserva tu capital para otras inversiones importantes.",
    icon: CreditCard,
  },
  {
    name: "Equipo actualizado",
    description:
      "Siempre tendrás acceso a la tecnología más reciente sin grandes inversiones.",
    icon: Zap,
  },
  {
    name: "Servicio garantizado",
    description:
      "Mantenimiento incluido durante toda la vigencia de tu contrato.",
    icon: CheckCircle2,
  },
];

export function Benefits() {
  return (
    <div id="features" className="py-24 relative overflow-hidden">
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
              key={benefit.name}
              className="group relative rounded-2xl p-6 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <benefit.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-tight text-gray-900 group-hover:text-blue-600 transition-colors">
                {benefit.name}
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