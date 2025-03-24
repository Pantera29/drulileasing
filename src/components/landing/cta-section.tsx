import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <section id="contacto" className="bg-primary text-white py-16 md:py-20">
      <div className="container text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-white">¿Listo para hacer crecer tu consultorio?</h2>
          <p className="text-white/90 text-lg md:text-xl">
            Da el primer paso hoy, sin complicaciones ni largas esperas
          </p>
          <div className="pt-4">
            <Link href="/register">
              <Button 
                size="lg" 
                variant="secondary" 
                className="hover-lift px-8 text-base"
              >
                Solicitar arrendamiento ahora
              </Button>
            </Link>
          </div>
          <p className="text-white/70 text-sm pt-2">
            Sin compromiso, respuesta en 24 horas
          </p>
        </div>
      </div>
    </section>
  );
} 