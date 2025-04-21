import Link from "next/link";
import { Facebook, Instagram, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-50 border-t py-12 md:py-16">
      <div className="container grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {/* Logo y descripción */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded-full bg-primary"></div>
            <span className="font-bold text-xl">Druli</span>
          </div>
          <p className="text-sm text-gray-600 max-w-xs">
            Arrendadora de equipos dentales y médicos. Empoderando a profesionales de la salud en México.
          </p>
          <div className="flex space-x-4 pt-2">
            <Link href="#" className="text-gray-500 hover:text-primary transition-colors">
              <Facebook size={20} />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-primary transition-colors">
              <Instagram size={20} />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-gray-500 hover:text-primary transition-colors">
              <Twitter size={20} />
              <span className="sr-only">Twitter</span>
            </Link>
          </div>
        </div>
        
        {/* Enlaces rápidos */}
        <div>
          <h3 className="font-medium text-base mb-4">Enlaces rápidos</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Inicio
              </Link>
            </li>
            <li>
              <Link href="/#simulator" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Simular arrendamiento
              </Link>
            </li>
            <li>
              <Link href="/#testimonios" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Testimonios
              </Link>
            </li>
            <li>
              <Link href="/#contacto" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Contacto
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Contacto */}
        <div>
          <h3 className="font-medium text-base mb-4">Contacto</h3>
          <address className="not-italic space-y-2 text-sm text-gray-600">
            <p>Av. Paseo de la Reforma 222</p>
            <p>Col. Juárez, Cuauhtémoc</p>
            <p>Ciudad de México, 06600</p>
            <p className="pt-2">
              <a href="tel:+525555555555" className="hover:text-primary transition-colors">
                +52 (55) 5555-5555
              </a>
            </p>
            <p>
              <a href="mailto:info@drulileasing.mx" className="hover:text-primary transition-colors">
                info@drulileasing.mx
              </a>
            </p>
          </address>
        </div>
        
        {/* Legal */}
        <div>
          <h3 className="font-medium text-base mb-4">Legal</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/privacy" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Aviso de privacidad
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-sm text-gray-600 hover:text-primary transition-colors">
                Términos y condiciones
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="container mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Druli. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
} 