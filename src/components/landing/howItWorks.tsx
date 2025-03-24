import { ArrowRight, ClipboardCheck, FileText, Truck, UserCheck } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      title: "Solicitud en línea",
      description: "Completa nuestro formulario en menos de 5 minutos y recibe una respuesta rápida.",
      icon: ClipboardCheck,
    },
    {
      title: "Aprobación de crédito",
      description: "Evaluamos tu solicitud y emitimos una aprobación en menos de 48 horas.",
      icon: FileText,
    },
    {
      title: "Selección de equipo",
      description: "Elige el equipo que necesitas de nuestro catálogo o de tu proveedor preferido.",
      icon: UserCheck,
    },
    {
      title: "Entrega e instalación",
      description: "Recibe tu equipo e inicia operaciones mientras nosotros gestionamos los pagos.",
      icon: Truck,
    },
  ];

  return (
    <section id="howItWorks" className="py-24 bg-gray-50">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Proceso simple, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">resultados rápidos</span></h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg">
            Obtén tu equipo médico o dental en cuatro simples pasos, sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 mb-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="absolute top-8 left-[calc(50%+2rem)] right-0 h-0.5 bg-blue-200 hidden lg:block" 
                       style={{display: index === steps.length - 1 ? 'none' : ''}}></div>
                  <div className="mb-2 text-xl font-bold">{step.title}</div>
                  <p className="text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex justify-center mt-6 lg:hidden">
                    <ArrowRight className="w-6 h-6 text-blue-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
} 