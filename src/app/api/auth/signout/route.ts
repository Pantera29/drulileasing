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
  
  return NextResponse.json({
    success: true
  })
} 