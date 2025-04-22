import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// IMPORTANTE: Esta función usa cookies() de next/headers
// Por lo que todas las rutas que la usen deben tener export const dynamic = 'force-dynamic'
// o estar en un layout con esa configuración
export async function createClient() {
  const cookieStore = await cookies();
  
  // Usar la clave de servicio si está disponible, de lo contrario usar la clave anónima
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  console.log(`Usando ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'clave de servicio' : 'clave anónima'} para Supabase`);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // En SSR, esto puede generar un error que se puede ignorar
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // En SSR, esto puede generar un error que se puede ignorar
          }
        },
      },
    }
  );
} 