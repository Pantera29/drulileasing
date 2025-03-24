import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardCheck, FileText, Truck, UserCheck } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    id: "01",
    name: "Llena el formulario",
    description: "Completa un formulario simple con tus datos básicos y el equipo que necesitas.",
    icon: FileText,
  },
  {
    id: "02",
    name: "Aprobación rápida",
    description: "Nuestro equipo revisa tu solicitud y te da respuesta en menos de 48 horas.",
    icon: UserCheck,
  },
  {
    id: "03",
    name: "Firma tu contrato",
    description: "Firma electrónicamente tu contrato de arrendamiento sin desplazamientos.",
    icon: ClipboardCheck,
  },
  {
    id: "04",
    name: "Recibe tu equipo",
    description: "Recibe e instala tu equipo médico o dental en tu consultorio.",
    icon: Truck,
  },
];

export function HowItWorks() {
  return (
    <section id="plans" className="py-24 relative bg-gradient-to-b from-white to-blue-50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Cómo funciona <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">nuestro proceso</span>
          </h2>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Obtén tu equipo médico o dental en 4 sencillos pasos
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-8 left-12 right-12 hidden md:block">
            <div className="h-0.5 w-full bg-blue-100 z-0"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.id} className="relative">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100 relative z-10 h-full">
                  <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 mx-auto md:mx-0">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center text-sm">
                    {step.id}
                  </div>
                  <h3 className="text-xl font-semibold text-center md:text-left mb-2">{step.name}</h3>
                  <p className="text-gray-500 text-center md:text-left">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 