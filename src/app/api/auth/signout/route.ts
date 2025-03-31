import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic'
// Indicar que usamos Node.js
export const runtime = 'nodejs'

/**
 * Ruta para cerrar sesión
 * Utiliza el método signOut de Supabase Auth y redirige al usuario a la página de inicio.
 */
export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  // Redirigir a la página de login en lugar de devolver JSON
  return NextResponse.redirect(new URL('/login?msg=signed_out', 
    process.env.NODE_ENV === 'production' 
      ? 'https://drulileasing.vercel.app' 
      : 'http://localhost:3000'
  ))
} 