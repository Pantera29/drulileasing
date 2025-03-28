import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-24 pb-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-blue-50 rounded-bl-[100px] opacity-60"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-50 rounded-tr-[100px] opacity-60"></div>
      
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            ¡Servicios de arrendamiento de nueva generación!
          </div>
          
          <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Equipamiento médico, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500"></span> 
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">a tu alcance</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Druli es una arrendadora de equipos dentales y médicos. Nuestra misión es empoderar a los dentistas y médicos mexicanos para seguir creciendo, cumplir sus sueños y darles oportunidades únicas.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6">
            <Link href="/#simulator" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold shadow-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:shadow-blue-500/25 rounded-full flex items-center justify-center gap-2 group text-white">
                Comenzar ahora
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#benefits" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-full border-2 border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50">
                Ver beneficios
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 