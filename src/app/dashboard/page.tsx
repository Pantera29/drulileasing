'use client';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from '@supabase/ssr';

// Definir interfaces para tipado
interface Application {
  id: string;
  application_status: string;
  created_at: string;
  updated_at: string;
  approved_amount?: number;
  rejection_reason?: string;
}

export default function DashboardPage() {
  const [userName, setUserName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para las solicitudes
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  
  // Contadores por estado
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [inReviewCount, setInReviewCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

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
          
          // Consultar TODAS las solicitudes del usuario
          try {
            setApplicationsLoading(true);
            const { data: allApplications, error: applicationsError } = await supabase
              .from('credit_applications')
              .select('*')
              .eq('user_id', session.user.id)
              .order('updated_at', { ascending: false });
            
            if (applicationsError) {
              console.error('Error al obtener solicitudes:', applicationsError);
            } else {
              console.log('Total de solicitudes:', allApplications?.length || 0);
              
              if (allApplications) {
                setApplications(allApplications);
                
                // Contar solicitudes por estado
                const pending = allApplications.filter(app => 
                  app.application_status === 'pending_nip' || 
                  app.application_status === 'incomplete'
                ).length;
                const approved = allApplications.filter(app => app.application_status === 'approved').length;
                const inReview = allApplications.filter(app => app.application_status === 'in_review').length;
                const rejected = allApplications.filter(app => app.application_status === 'rejected').length;
                
                setPendingCount(pending);
                setApprovedCount(approved);
                setInReviewCount(inReview);
                setRejectedCount(rejected);
              }
            }
          } catch (appError) {
            console.error('Error al consultar solicitudes:', appError);
          } finally {
            setApplicationsLoading(false);
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

  // Función para obtener la URL de detalle según el estado
  const getApplicationDetailUrl = (app: Application) => {
    switch (app.application_status) {
      case 'approved':
        return `/result/approved/${app.id}`;
      case 'in_review':
        return `/result/reviewing/${app.id}`;
      case 'rejected':
        return `/result/rejected/${app.id}`;
      case 'pending_nip':
      case 'incomplete':
      default:
        return `/application/step/1?edit=${app.id}`;
    }
  };

  // Función para mostrar el estado en español
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobada';
      case 'in_review':
        return 'En revisión';
      case 'rejected':
        return 'Rechazada';
      case 'pending_nip':
        return 'Pendiente de NIP';
      case 'incomplete':
        return 'Incompleta';
      default:
        return status;
    }
  };

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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Crear una función para manejar el cierre de sesión
                const signOut = async () => {
                  try {
                    // Hacer la solicitud POST a la API
                    const response = await fetch('/api/auth/signout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    });
                    
                    // Si la respuesta es exitosa, redirigir a la página de login
                    if (response.ok) {
                      window.location.href = '/login?msg=signed_out';
                    }
                  } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                  }
                };
                
                // Llamar a la función
                signOut();
              }}
            >
              Cerrar sesión
            </Button>
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
              <Link href="/application/step/1">
                <Button>
                  Nueva solicitud
                </Button>
              </Link>
              <Button variant="outline" onClick={() => {
                // Scroll al listado de solicitudes
                document.getElementById('solicitudes')?.scrollIntoView({behavior: 'smooth'});
              }}>
                Ver mis solicitudes
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Solicitudes pendientes</h3>
              {applicationsLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary">{pendingCount}</p>
                  <p className="text-gray-500 mt-2">
                    {pendingCount > 0 
                      ? `Tienes ${pendingCount} solicitud${pendingCount !== 1 ? 'es' : ''} pendiente${pendingCount !== 1 ? 's' : ''}.` 
                      : 'No tienes solicitudes pendientes.'}
                  </p>
                </>
              )}
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Solicitudes aprobadas</h3>
              {applicationsLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                  <p className="text-gray-500 mt-2">
                    {approvedCount > 0 
                      ? `Tienes ${approvedCount} solicitud${approvedCount !== 1 ? 'es' : ''} aprobada${approvedCount !== 1 ? 's' : ''}.` 
                      : 'No tienes solicitudes aprobadas.'}
                  </p>
                </>
              )}
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">En revisión</h3>
              {applicationsLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-amber-600">{inReviewCount}</p>
                  <p className="text-gray-500 mt-2">
                    {inReviewCount > 0 
                      ? `Tienes ${inReviewCount} solicitud${inReviewCount !== 1 ? 'es' : ''} en revisión.` 
                      : 'No tienes solicitudes en revisión.'}
                  </p>
                </>
              )}
            </div>
            
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-xl font-bold mb-2">Rechazadas</h3>
              {applicationsLoading ? (
                <p className="text-gray-500">Cargando...</p>
              ) : (
                <>
                  <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                  <p className="text-gray-500 mt-2">
                    {rejectedCount > 0 
                      ? `Tienes ${rejectedCount} solicitud${rejectedCount !== 1 ? 'es' : ''} rechazada${rejectedCount !== 1 ? 's' : ''}.` 
                      : 'No tienes solicitudes rechazadas.'}
                  </p>
                </>
              )}
            </div>
          </div>
          
          {/* Listado de solicitudes */}
          <div id="solicitudes" className="bg-white rounded-xl p-6 border shadow-sm">
            <h3 className="text-xl font-bold mb-4">Mis solicitudes</h3>
            
            {applicationsLoading ? (
              <p className="text-gray-500">Cargando solicitudes...</p>
            ) : applications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <tr key={app.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {app.id.substring(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${app.application_status === 'approved' ? 'bg-green-100 text-green-800' : 
                              app.application_status === 'in_review' ? 'bg-amber-100 text-amber-800' :
                              app.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {getStatusLabel(app.application_status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.updated_at).toLocaleDateString('es-MX')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Link href={getApplicationDetailUrl(app)} className="text-primary hover:underline">
                            Ver detalles
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No tienes solicitudes. ¡Crea una nueva para comenzar!</p>
            )}
            
            <div className="mt-4">
              <Link href="/application/step/1">
                <Button variant="outline" size="sm">
                  Crear nueva solicitud
                </Button>
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