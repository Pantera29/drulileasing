import { Menu } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navigation = [
  { name: "Características", href: "/#features" },
  { name: "Equipos", href: "/#equipment" },
  { name: "Planes", href: "/#plans" },
  { name: "Testimonios", href: "/#testimonios" },
  { name: "Contacto", href: "/#contacto" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">D</div>
            <span className="font-bold text-xl">Druli</span>
          </Link>
          
          <nav className="hidden md:flex gap-8 mx-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-500 transition-colors hover:text-blue-600"
              >
                {item.name}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-500 hover:text-blue-600">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-md text-white">
                  Registrarse
                </Button>
              </Link>
            </div>
            <Sheet>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="icon" aria-label="Menu" className="border-0">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col">
                <nav className="grid gap-6 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium transition-colors hover:text-blue-600"
                    >
                      {item.name}
                    </Link>
                  ))}
                  <div className="flex flex-col gap-4 mt-4">
                    <Link href="/login">
                      <Button variant="ghost" className="w-full">
                        Iniciar Sesión
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white">
                        Registrarse
                      </Button>
                    </Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
} 