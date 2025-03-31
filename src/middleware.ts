import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Crear el cliente de Supabase con las cookies de la solicitud
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Este método es necesario pero no lo usaremos aquí
        },
        remove(name: string, options: any) {
          // Este método es necesario pero no lo usaremos aquí
        },
      },
    }
  );

  // Verificar si hay una sesión activa
  const { data: { session }, error } = await supabase.auth.getSession();

  // Obtener la URL actual
  const url = new URL(request.url);
  const isProtectedRoute = 
    url.pathname.startsWith('/dashboard') || 
    url.pathname.startsWith('/step/');
  
  const isAuthRoute = 
    url.pathname.startsWith('/login') || 
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/reset-password');

  console.log(`Middleware: Verificando ruta ${url.pathname}, protegida: ${isProtectedRoute}, auth: ${isAuthRoute}`);
  
  // Si hay una sesión activa y el usuario está en una ruta de autenticación, redirigir al dashboard
  if (session && isAuthRoute) {
    console.log('Middleware: Usuario autenticado intentando acceder a ruta de autenticación, redirigiendo a dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Si no hay una sesión activa y la ruta es protegida, redirigir a login
  if (!session && isProtectedRoute) {
    console.log('Middleware: Usuario no autenticado intentando acceder a ruta protegida, redirigiendo a login');
    // Añadir la URL de donde venía como parámetro para poder redirigir después del login
    return NextResponse.redirect(
      new URL(`/login?returnUrl=${encodeURIComponent(url.pathname)}`, request.url)
    );
  }

  // Agregar redirección desde /application a /step/1
  if (url.pathname === '/application') {
    console.log('Middleware: Redirigiendo /application a /step/1');
    // La URL debe ser completa, no solo el pathname
    return NextResponse.redirect(new URL('/step/1', request.url));
  }

  // En cualquier otro caso, continuar con la solicitud
  return NextResponse.next();
}

// Especificar las rutas que deben ser procesadas por el middleware
export const config = {
  matcher: [
    /*
     * Configuración de matcher:
     * - Correspondencia con todas las rutas de dashboard
     * - Correspondencia con todas las rutas de step
     * - Correspondencia con las rutas de autenticación
     * - Correspondencia con la ruta de application
     * - Correspondencia con la ruta de app-routes
     */
    '/dashboard/:path*',
    '/step/:path*',
    '/login',
    '/register',
    '/reset-password',
    '/application',
    '/app-routes',
  ],
}; 