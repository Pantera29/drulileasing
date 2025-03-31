import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/**
 * Ruta para cerrar sesión
 * Utiliza el método signOut de Supabase Auth y redirige al usuario a la página de inicio.
 */
export async function POST(request: NextRequest) {
  // Obtener la URL base para cookies
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin
  
  // Crear el cliente de Supabase
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      }
    }
  )
  
  // Cerrar sesión en Supabase
  await supabase.auth.signOut()
  
  // Redirigir a la página de inicio de sesión
  return NextResponse.redirect(`${origin}/login?error=signed_out`, {
    status: 302,
  })
} 