'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Nuevos estados para las solicitudes
  const [pendingApplications, setPendingApplications] = useState<number>(0);
  const [pendingApplicationsLoading, setPendingApplicationsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        // Obtener datos de la sesión
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Usuario en dashboard page:', session.user.id);
          
          // Intentar obtener el nombre del perfil usando maybeSingle en lugar de single
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error al obtener perfil:', profileError);
            setError('No se pudo cargar la información del perfil');
            setUserName(session.user.email || 'Usuario');
          } else if (profile?.full_name) {
            setUserName(profile.full_name);
          } else {
            console.log('No se encontró un perfil para este usuario, creando uno básico...');
            
            // Fecha de nacimiento predeterminada (18 años atrás desde hoy)
            const defaultBirthDate = new Date();
            defaultBirthDate.setFullYear(defaultBirthDate.getFullYear() - 18);
            
            // Usar upsert en lugar de insert para manejar la posibilidad de que el perfil exista
            const { error: upsertError } = await supabase
              .from('profiles')
              .upsert({
                id: session.user.id,
                full_name: session.user.email || 'Usuario',
                birth_date: defaultBirthDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
                curp_rfc: 'XXXX000000XXXXXX00', // Valor temporal, deberá ser actualizado por el usuario
                marital_status: 'soltero', // Valor predeterminado
                dependents: 0, // Valor predeterminado
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id', // Especificar columna de conflicto
                ignoreDuplicates: false // Actualizar en caso de conflicto
              });
              
            if (upsertError) {
              console.error('Error al crear o actualizar perfil básico:', upsertError);
              setError('No se pudo crear un perfil inicial. Por favor actualice sus datos personales.');
            } else {
              // Refrescar el nombre de usuario después de la creación exitosa
              setUserName(session.user.email || 'Usuario');
              console.log('Perfil creado o actualizado exitosamente');
            }
          }
          
          // Consultar solicitudes pendientes
          try {
            setPendingApplicationsLoading(true);
            const { data: applications, error: applicationsError, count } = await supabase
              .from('credit_applications')
              .select('*', { count: 'exact' })
              .eq('user_id', session.user.id)
              .eq('application_status', 'pending');
            
            if (applicationsError) {
              console.error('Error al obtener solicitudes:', applicationsError);
            } else {
              console.log('Solicitudes pendientes:', applications?.length || 0);
              setPendingApplications(applications?.length || 0);
            }
          } catch (appError) {
            console.error('Error al consultar solicitudes:', appError);
          } finally {
            setPendingApplicationsLoading(false);
          }
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        setError('Error al cargar datos del usuario');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">D</div>
              <span className="font-bold text-xl">Druli</span>
            </Link>
            <span className="text-gray-500">|</span>
            <h1 className="text-lg font-medium">Panel de Cliente</h1>
          </div>
          <div>
            <form action="/api/auth/signout" method="post">
              <Button variant="outline" size="sm" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1 py-10">
        <div className="container space-y-8">
          {error && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800 text-sm">
              {error}
            </div>
          )}
          
          <div className="bg-cream rounded-xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-4">
              {isLoading 
                ? 'Cargando...' 
                : `Bienvenido a tu panel de Druli${userName ? ', ' + userName : ''}`}
            </h2>
            <p className="text-gray-600 mb-6">
              Desde aquí podrás gestionar tus solicitudes de arrendamiento, revisar el estado de tus
              equipos y gestionar tus datos personales.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/step/1">
                <Button>
                  Nueva solicitud
                </Button>
              </Link>
              <Button variant="outline">
                Ver mis solicitudes
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Solicitudes en proceso</h3>
              {pendingApplicationsLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary">{pendingApplications}</p>
                  <p className="text-gray-500 mt-2">
                    {pendingApplications > 0 
                      ? `Tienes ${pendingApplications} solicitud${pendingApplications !== 1 ? 'es' : ''} en proceso.` 
                      : 'No tienes solicitudes en proceso actualmente.'}
                  </p>
                </>
              )}
              <Link href="/step/1" className="text-primary hover:underline text-sm block mt-4">
                Crear nueva solicitud
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Equipos arrendados</h3>
              <p className="text-3xl font-bold text-primary">0</p>
              <p className="text-gray-500 mt-2">
                No tienes equipos arrendados actualmente.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Próximos pagos</h3>
              <p className="text-3xl font-bold text-primary">$0.00</p>
              <p className="text-gray-500 mt-2">
                No tienes pagos pendientes por ahora.
              </p>
              <Link href="#" className="text-primary hover:underline text-sm block mt-4">
                Ver historial de pagos
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50 border-t py-6">
        <div className="container">
          <p className="text-sm text-gray-500 text-center">
            &copy; {new Date().getFullYear()} Druli. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
} 