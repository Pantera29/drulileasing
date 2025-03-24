import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const categories = [
  {
    title: "Equipos dentales",
    description: "Unidades dentales, autoclaves, rayos X, equipos de endodoncia, y más."
  },
  {
    title: "Equipos médicos generales",
    description: "Mesas quirúrgicas, monitores, desfibriladores, electrocardiógrafos, ecógrafos, y más."
  },
  {
    title: "Equipos de imagen diagnóstica",
    description: "Tomógrafos, resonadores, equipos de rayos X, ultrasonidos, y más."
  },
  {
    title: "Equipos estéticos",
    description: "Láseres, equipos de depilación, radiofrecuencia, ultrasonido, y más."
  }
];

export function EquipmentCategories() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-white">
      <div className="container">
        <div className="text-center mb-12">
          <div className="inline-block mb-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            Nuestros equipos
          </div>
          <h2 className="mb-3">Equipos disponibles para arrendamiento</h2>
          <p className="max-w-2xl mx-auto text-gray-600">
            Contamos con una amplia variedad de equipos médicos y dentales de las mejores marcas a nivel mundial.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
          {categories.map((category, index) => (
            <Card key={index} className="text-center transition-custom hover:shadow-lg hover:-translate-y-1 border-t-4 border-t-primary bg-gradient-to-b from-white to-blue-50">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{category.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {category.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="justify-center">
                <Link href="#" className="w-full max-w-xs">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/10">
                    Ver equipos
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
} 