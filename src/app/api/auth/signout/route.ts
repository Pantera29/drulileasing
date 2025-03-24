import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Ruta para cerrar sesión
 * Utiliza el método signOut de Supabase Auth y redirige al usuario a la página de inicio.
 */
export async function POST() {
  // Crear cliente Supabase sin cookies para auth.signOut()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Cerrar sesión del usuario
  await supabase.auth.signOut()
  
  // Redirigir al usuario a la página de inicio
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    status: 302,
  })
} 