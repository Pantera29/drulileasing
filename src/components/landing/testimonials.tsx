import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Dra. Mariana Guzmán",
    title: "Odontóloga Especialista",
    image: "/doctors/doctor-1.jpg",
    content:
      "Gracias a Druli pude equipar completamente mi consultorio dental sin descapitalizarme. El proceso fue sencillo y la aprobación muy rápida.",
  },
  {
    name: "Dr. Carlos Mendoza",
    title: "Médico Internista",
    image: "/doctors/doctor-2.jpg",
    content:
      "La flexibilidad de los planes de Druli me permitió adquirir un equipo de ultrasonido de última generación que hubiera sido imposible comprar de contado.",
  },
  {
    name: "Dra. Ana Sofía Ruiz",
    title: "Oftalmóloga",
    image: "/doctors/doctor-3.jpg",
    content:
      "El servicio de mantenimiento incluido en mi contrato de arrendamiento me da tranquilidad. Siempre tengo mi equipo funcionando perfectamente.",
  },
];

export function Testimonials() {
  return (
    <section id="testimonios" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 to-purple-50/30 pointer-events-none" />
      <div className="container relative">
        <div className="text-center mb-16">
          <span className="inline-block mb-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
            Testimonios
          </span>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Lo que dicen nuestros <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">clientes</span>
          </h2>
          <p className="mt-2 text-lg text-gray-500 max-w-2xl mx-auto">
            Profesionales de la salud confían en nuestro sistema de arrendamiento.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 mt-12">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border border-blue-100 bg-white/50 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-blue-400"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-blue-500 text-blue-500" />
                  ))}
                </div>
                <p className="text-gray-700">{testimonial.content}</p>
              </CardHeader>
              <CardFooter className="pt-4 border-t mt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-blue-100">
                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                    <AvatarFallback className="bg-blue-50 text-blue-600">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.title}</p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 