import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="contacto" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent" />
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Impulsa tu <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">consultorio</span> hoy
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Comienza tu proceso de arrendamiento en minutos y accede al equipo médico que necesitas sin comprometer tu capital.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-lg hover:shadow-blue-500/25 group">
                Comenzar ahora
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#simulator">
              <Button size="lg" variant="outline" className="rounded-full border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700">
                Simular arrendamiento
              </Button>
            </Link>
          </div>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <div className="flex space-x-2 text-sm text-gray-500">
              <span className="inline-flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                Aprobación en 48h
              </span>
              <span className="inline-flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                Sin aval requerido
              </span>
              <span className="inline-flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" />
                100% deducible
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 