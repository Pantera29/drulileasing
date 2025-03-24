import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Crear cliente Supabase con cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Obtener la sesión actual
  const { data: { session } } = await supabase.auth.getSession()
  const url = new URL(request.url)
  const path = url.pathname

  // Rutas protegidas que requieren autenticación
  const protectedRoutes = ['/dashboard']

  // Rutas de autenticación (login, registro, etc)
  const authRoutes = ['/login', '/register', '/reset-password', '/verify']

  // Redirigir usuarios autenticados que intentan acceder a rutas de autenticación
  if (session && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirigir usuarios no autenticados que intentan acceder a rutas protegidas
  if (!session && protectedRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

// Especificar las rutas en las que se ejecutará el middleware
export const config = {
  matcher: [
    // Rutas protegidas (requieren autenticación)
    '/dashboard/:path*',
    // Rutas de autenticación
    '/login',
    '/register',
    '/reset-password/:path*',
    '/verify',
  ],
} 