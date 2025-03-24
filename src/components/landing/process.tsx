import { Calculator, ClipboardCheck, Package, Truck, UserCheck } from "lucide-react";

const steps = [
  {
    icon: Calculator,
    title: "Simula tu arrendamiento",
    description: "Utiliza nuestro simulador para calcular cuotas y condiciones aproximadas.",
  },
  {
    icon: UserCheck,
    title: "Regístrate y solicita",
    description: "Completa el formulario con tus datos básicos y adjunta la documentación requerida.",
  },
  {
    icon: ClipboardCheck,
    title: "Evaluación rápida",
    description: "Nuestro equipo evalúa tu solicitud en menos de 24 horas.",
  },
  {
    icon: Package,
    title: "Aprobación y firma",
    description: "Firma digital de contratos y documentos sin necesidad de desplazarte.",
  },
  {
    icon: Truck,
    title: "¡Recibe tu equipo!",
    description: "Coordinamos la entrega e instalación con el proveedor que elijas.",
  },
];

export function Process() {
  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="mb-3">Proceso simple en 5 pasos</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Nuestro proceso está diseñado para ser rápido y sin complicaciones, permitiéndote focalizarte en lo importante: tu práctica profesional.
          </p>
        </div>

        <div className="relative">
          {/* Línea de conexión horizontal (solo visible en desktop) */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-primary/20"></div>

          {/* Pasos */}
          <div className="grid gap-8 lg:grid-cols-5">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                {/* Ícono con número */}
                <div className="relative mb-6">
                  <div className="bg-cream h-16 w-16 rounded-full flex items-center justify-center z-10 relative border-2 border-primary shadow-md">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-primary text-white h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Título y descripción */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 