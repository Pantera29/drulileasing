'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [supabaseClient] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // Función para verificar la autenticación
  const checkAuth = async () => {
    try {
      console.log('Verificando autenticación en dashboard layout...');
      
      // Forzar una renovación de la sesión para verificar que sea válida
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      console.log('Resultado de getSession:', session ? 'Sesión encontrada' : 'No hay sesión', error ? `Error: ${error.message}` : 'Sin errores');
      
      if (error) {
        console.error('Error al obtener sesión en dashboard:', error);
        setIsAuthenticated(false);
        redirectToLogin('session_error');
        return;
      }

      if (!session) {
        console.log('No hay sesión en dashboard layout');
        setIsAuthenticated(false);
        redirectToLogin('no_session');
        return;
      }
      
      // Verificación adicional: comprobar que el usuario existe
      try {
        const { data: user, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError || !user) {
          console.error('Error al verificar usuario:', userError);
          setIsAuthenticated(false);
          redirectToLogin('invalid_user');
          return;
        }
        
        console.log('Usuario verificado:', user.user?.id);
        setIsAuthenticated(true);
        setIsLoading(false);
      } catch (userCheckError) {
        console.error('Error en verificación de usuario:', userCheckError);
        setIsAuthenticated(false);
        redirectToLogin('user_check_error');
      }
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setIsAuthenticated(false);
      redirectToLogin('check_auth_error');
    }
  };
  
  // Función para redirigir al login con un código de error
  const redirectToLogin = (reason: string) => {
    // Limpiar cualquier dato de sesión en localStorage antes de redirigir
    try {
      if (typeof window !== 'undefined') {
        // Intentar limpiar datos relacionados con Supabase
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            console.log('Eliminando clave de localStorage:', key);
            localStorage.removeItem(key);
          }
        }
      }
    } catch (e) {
      console.error('Error al limpiar localStorage:', e);
    }
    
    // Forzar el cierre de sesión antes de redirigir
    supabaseClient.auth.signOut().then(() => {
      console.log(`Redirigiendo a login (${reason})`);
      router.replace(`/login?error=${reason}`);
    });
  };

  // Verificación inmediata (ejecutada al renderizar el componente)
  useEffect(() => {
    // Verificar autenticación en cada renderizado
    checkAuth();
    
    // Añadir un intervalo para verificar la sesión periódicamente
    const intervalId = setInterval(checkAuth, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Efecto para escuchar cambios en la autenticación
  useEffect(() => {
    // Suscribirse a cambios en la autenticación
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log('Evento de autenticación en dashboard:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('Usuario ha iniciado sesión');
        setIsAuthenticated(true);
        setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('Usuario ha cerrado sesión');
        setIsAuthenticated(false);
        redirectToLogin('signed_out');
      } else if (!session) {
        console.log('No hay sesión después de evento:', event);
        setIsAuthenticated(false);
        redirectToLogin('event_no_session');
      }
    });

    return () => {
      console.log('Limpiando suscripción de autenticación');
      subscription.unsubscribe();
    };
  }, [router, supabaseClient]);

  // Si está cargando o no está autenticado, mostrar pantalla de carga
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Solo mostrar el contenido si el usuario está autenticado
  return <>{children}</>;
} 