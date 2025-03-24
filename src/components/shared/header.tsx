'use client';

import { Menu, ChevronRight, Zap, Headset, Calculator, Star, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";

const navigation = [
  { name: "Beneficios", href: "/#benefits", icon: Zap },
  { name: "Simulador", href: "/#simulator", icon: Calculator },
  { name: "Proceso", href: "/#howItWorks", icon: Headset },
  { name: "Testimonios", href: "/#testimonials", icon: Star },
  { name: "Contacto", href: "/#contacto", icon: MessageSquare },
];

export function Header() {
  const router = useRouter();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.replace('/#', '');
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">D</div>
              <span className="font-bold text-xl">Druli</span>
            </Link>
            
            <nav className="hidden md:flex gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-500 hover:text-blue-600">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md text-white">
                  Nueva Solicitud
                </Button>
              </Link>
            </div>
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" aria-label="Menu" className="border-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col bg-white p-0 max-w-[320px] w-full">
                <SheetHeader className="border-b border-gray-100 p-4">
                  <SheetTitle>
                    <Link href="/" className="inline-flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">D</div>
                      <span className="font-bold text-xl">Druli</span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>
                
                <div className="flex-1">
                  <nav className="flex flex-col p-4">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={(e) => handleNavClick(e, item.href)}
                          className="flex items-center justify-between py-4 border-b border-gray-100 hover:text-blue-600"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-gray-400" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                
                <div className="p-6 space-y-4">
                  <Link href="/login" className="w-full block">
                    <Button variant="outline" className="w-full border border-gray-200 hover:border-blue-200 hover:text-blue-600 h-12">
                      Iniciar Sesión
                    </Button>
                  </Link>
                  <Link href="/register" className="w-full block">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12">
                      Nueva Solicitud
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
} 