import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Ruta para cerrar sesión
 * Utiliza el método signOut de Supabase Auth y redirige al usuario a la página de inicio.
 */
export async function POST() {
  try {
    // Crear cliente Supabase para Auth.signOut()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )

    // Cerrar sesión del usuario con alcance global para eliminar todas las sesiones
    await supabase.auth.signOut({ scope: 'global' })
    
    // Script para limpiar localStorage al redirigir
    const cleanupScript = `
      <script>
        // Limpiar cualquier dato de sesión en localStorage
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('supabase') || key.includes('sb-'))) {
              console.log('Eliminando clave de localStorage:', key);
              localStorage.removeItem(key);
            }
          }
          
          // Intentar limpiar cookies relacionadas con Supabase
          const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
          cookiesToClear.forEach(cookieName => {
            document.cookie = cookieName + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          });
        } catch (e) {
          console.error('Error al limpiar datos de sesión:', e);
        }
        
        // Esperar un momento y redirigir a la página de inicio
        setTimeout(function() {
          window.location.href = '/';
        }, 500);
      </script>
    `;
    
    // Devolver HTML con script de limpieza
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="1;url=/" />
          <title>Cerrando sesión...</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f9fafb;
            }
            .message {
              text-align: center;
              padding: 2rem;
              background: white;
              border-radius: 0.5rem;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            .spinner {
              display: inline-block;
              width: 2rem;
              height: 2rem;
              border: 0.25rem solid rgba(59, 130, 246, 0.25);
              border-right-color: rgba(59, 130, 246, 1);
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin-bottom: 1rem;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          </style>
        </head>
        <body>
          <div class="message">
            <div class="spinner"></div>
            <p>Cerrando sesión...</p>
          </div>
          ${cleanupScript}
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    
    // En caso de error, intentar redirigir de todos modos
    return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
      status: 302,
    });
  }
} 