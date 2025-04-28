import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Home, 
  DollarSign, 
  Laptop, 
  FileBarChart, 
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  UserPlus,
  Play,
  Check,
  Briefcase,
  FileText,
  History,
  CreditCard,
  UserCheck,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

// Forzar que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

interface Analyst {
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
    email: string;
  } | null;
}

// Función para asignar al analista actual
async function assignToCurrentAnalyst(formData: FormData): Promise<void> {
  'use server';
  
  console.log('Iniciando función assignToCurrentAnalyst');
  
  try {
    const applicationId = formData.get('applicationId') as string;
    console.log('ID de aplicación recibido:', applicationId);
    
    if (!applicationId) {
      console.error('ID de aplicación no proporcionado');
      return;
    }
    
    console.log('Creando cliente de Supabase');
    const supabaseServer = await createClient();
    
    console.log('Verificando autenticación');
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    
    if (userError) {
      console.error('Error al obtener usuario:', userError);
      return;
    }
    
    if (!user) {
      console.error('Usuario no encontrado');
      return;
    }
    
    console.log('Usuario autenticado:', user.id);
    
    console.log('Verificando roles del usuario');
    const { data: userRoles, error: rolesError } = await supabaseServer
      .from('user_roles')
      .select('user_id')
      .eq('user_id', user.id)
      .eq('role', 'analyst')
      .single();
      
    if (rolesError) {
      console.error('Error al verificar roles:', rolesError);
      return;
    }
    
    console.log('Verificando estado de la solicitud');
    const { data: existingApp, error: checkError } = await supabaseServer
      .from('credit_applications')
      .select('analyst_id')
      .eq('id', applicationId)
      .single();
      
    if (checkError) {
      console.error('Error al verificar solicitud:', checkError);
      return;
    }
    
    console.log('Estado actual de la solicitud:', existingApp);
    
    if (existingApp.analyst_id) {
      console.error('La solicitud ya está asignada');
      return;
    }
    
    console.log('Actualizando solicitud con analyst_id:', user.id);
    const { error: updateError } = await supabaseServer
      .from('credit_applications')
      .update({
        analyst_id: user.id,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);
      
    if (updateError) {
      console.error('Error al actualizar solicitud:', updateError);
      return;
    }
    
    console.log('Solicitud actualizada exitosamente');
    revalidatePath(`/admin/applications/${applicationId}`);
    
  } catch (error) {
    console.error('Error en assignToCurrentAnalyst:', error);
  }
}

// Función para iniciar análisis
async function startAnalysis(formData: FormData) {
  'use server';
  
  console.log('Iniciando función startAnalysis');
  
  try {
    // Obtener el ID de la aplicación del formulario
    const applicationId = formData.get('applicationId') as string;
    
    console.log('ID de aplicación recibido:', applicationId);
    
    if (!applicationId) {
      console.error('ID de aplicación no proporcionado');
      redirect('/admin/applications?error=missing_application_id');
      return;
    }
    
    // Crear el cliente de supabase dentro de la función del servidor
    console.log('Creando cliente de Supabase');
    const supabaseServer = await createClient();
    
    // Obtener de nuevo la sesión dentro de la función del servidor
    console.log('Verificando autenticación');
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();
    
    if (userError) {
      console.error('Error al obtener usuario:', userError);
      redirect(`/admin/applications?error=session_expired`);
      return;
    }
    
    if (!user) {
      console.error('Sesión no encontrada al intentar iniciar análisis');
      redirect(`/admin/applications?error=session_expired`);
      return;
    }
    
    console.log('Usuario autenticado:', user.id);
    
    // Verificar que el usuario sea analista o admin
    console.log('Verificando roles del usuario');
    const { data: userRoles, error: rolesError } = await supabaseServer
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
      
    if (rolesError) {
      console.error('Error al verificar roles:', rolesError);
      redirect('/admin/applications?error=role_verification_error');
      return;
    }
    
    const roles = userRoles?.map(ur => ur.role) || [];
    const isAnalyst = roles.includes('analyst');
    const isAdmin = roles.includes('admin');
    
    console.log('Roles del usuario:', roles, '¿Es analista?', isAnalyst, '¿Es admin?', isAdmin);
    
    if (!isAnalyst && !isAdmin) {
      console.error('Usuario no autorizado');
      redirect('/admin/applications?error=unauthorized');
      return;
    }
    
    // Verificar que la solicitud existe y está asignada al usuario actual
    console.log('Verificando estado de la solicitud');
    const { data: existingApp, error: checkError } = await supabaseServer
      .from('credit_applications')
      .select('analyst_id, analysis_started_at')
      .eq('id', applicationId)
      .single();
      
    if (checkError) {
      console.error('Error al verificar solicitud:', checkError);
      redirect('/admin/applications?error=application_not_found');
      return;
    }
    
    console.log('Estado actual de la solicitud:', existingApp);
    
    if (!existingApp.analyst_id) {
      console.error('La solicitud no está asignada');
      redirect('/admin/applications?error=not_assigned');
      return;
    }
    
    if (existingApp.analyst_id !== user.id) {
      console.error('La solicitud está asignada a otro analista');
      redirect('/admin/applications?error=assigned_to_other');
      return;
    }
    
    if (existingApp.analysis_started_at) {
      console.error('El análisis ya ha sido iniciado');
      redirect('/admin/applications?error=analysis_already_started');
      return;
    }
    
    // Actualizar la solicitud
    console.log('Actualizando solicitud con analysis_started_at');
    const { error: updateError } = await supabaseServer
      .from('credit_applications')
      .update({
        analysis_started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId);
      
    if (updateError) {
      console.error('Error al actualizar solicitud:', updateError);
      redirect('/admin/applications?error=update_failed');
      return;
    }
    
    console.log('Solicitud actualizada exitosamente');
    
    // Redirigir a la página de listado de solicitudes con un mensaje de éxito
    console.log('Redirigiendo a:', '/admin/applications?success=analysis_started');
    redirect('/admin/applications?success=analysis_started');
  } catch (error) {
    console.error('Error en startAnalysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    redirect('/admin/applications?error=' + encodeURIComponent(errorMessage));
  }
}

// Función para obtener los datos de la aplicación
async function getApplicationData(id: string) {
  const supabase = await createClient();
  
  // Verificar autenticación y rol usando getUser() en lugar de getSession()
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    console.error('Error de autenticación:', userError);
    redirect('/login?error=session_expired');
    return null;
  }
  
  // Verificar si es analista o admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
    
  const roles = userRoles?.map(ur => ur.role) || [];
  const isAnalyst = roles.includes('analyst');
  const isAdmin = roles.includes('admin');
  
  if (!isAnalyst && !isAdmin) {
    redirect('/admin/dashboard?error=unauthorized');
    return null;
  }
  
  // Obtener información de la solicitud
  try {
    console.log("Obteniendo detalles de la aplicación ID:", id);
    
    // Obtener primero los datos básicos de la aplicación
    const { data: app, error: appError } = await supabase
      .from('credit_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (appError) {
      console.error('Error al obtener datos de la solicitud:', appError);
      throw new Error(`Error al consultar la aplicación: ${appError.message}`);
    }
    
    if (!app) {
      console.error('No se encontró la solicitud con ID:', id);
      redirect('/admin/applications?error=application_not_found');
      return null;
    }
    
    console.log("Aplicación encontrada:", app.id);
    
    // Obtener datos relacionados con consultas individuales
    const [
      profilesResult, 
      contactResult, 
      financialResult, 
      equipmentResult, 
      analystResult, 
      bureauResult,
      decisionsResult,
      userEmailResult
    ] = await Promise.all([
      // Obtener perfil del usuario
      supabase
        .from('profiles')
        .select('*')
        .eq('id', app.user_id)
        .maybeSingle(),
        
      // Obtener información de contacto
      supabase
        .from('contact_info')
        .select('*')
        .eq('id', app.contact_id || '')
        .maybeSingle(),
        
      // Obtener información financiera
      supabase
        .from('financial_info')
        .select('*') 
        .eq('id', app.financial_id || '')
        .maybeSingle(),
        
      // Obtener información de equipo
      supabase
        .from('equipment_requests')
        .select('*')
        .eq('id', app.equipment_id || '')
        .maybeSingle(),
        
      // Obtener información del analista si existe
      app.analyst_id ? (async () => {
        console.log('Consultando información del analista:', app.analyst_id);
        
        // Verificamos que el usuario sea un analista
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_id', app.analyst_id)
          .eq('role', 'analyst')
          .single();
          
        if (roleError) {
          console.error('Error al consultar rol del analista:', roleError);
          return { data: null, error: roleError };
        }

        if (!roleData) {
          console.error('No se encontró el rol de analista para:', app.analyst_id);
          return { data: null, error: new Error('Rol de analista no encontrado') };
        }

        // Obtener información del usuario usando la función RPC
        const { data: userData, error: userError } = await supabase
          .rpc('get_user_info', { user_id: roleData.user_id });

        if (userError) {
          console.error('Error al obtener información del usuario:', userError);
          return { data: null, error: userError };
        }

        console.log('Información del analista encontrada:', userData);
        
        return { 
          data: {
            full_name: userData.display_name || userData.email,
            email: userData.email
          }, 
          error: null 
        };
      })() : Promise.resolve({ data: null, error: null }),
      
      // Obtener detalles del buró de crédito
      supabase
        .from('credit_bureau_details')
        .select('*')
        .eq('application_id', id)
        .maybeSingle(),
        
      // Obtener decisiones anteriores si existen
      supabase
        .from('analyst_decisions')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false }),
      
      // Obtener email del usuario dueño de la solicitud
      supabase
        .from('user_emails')
        .select('email')
        .eq('id', app.user_id)
        .maybeSingle()
    ]);
    
    // Extraer datos de los resultados
    const profiles = profilesResult.data;
    const contact = contactResult.data;
    const financial = financialResult.data;
    const equipment = equipmentResult.data;
    const analystInfo = analystResult.data;
    const creditBureauDetails = bureauResult.data;
    const previousDecisions = decisionsResult.data;
    const userEmail = userEmailResult.data?.email;
    
    // Verificar si alguna consulta falló
    if (profilesResult.error) console.error('Error al obtener perfil:', profilesResult.error);
    if (contactResult.error) console.error('Error al obtener contacto:', contactResult.error);
    if (financialResult.error) console.error('Error al obtener financiero:', financialResult.error);
    if (equipmentResult.error) console.error('Error al obtener equipo:', equipmentResult.error);
    if (analystResult.error) {
      console.error('Error al obtener analista:', {
        error: analystResult.error,
        analyst_id: app.analyst_id
      });
    }
    if (bureauResult.error) console.error('Error al obtener buró:', bureauResult.error);
    
    // Verificar si la solicitud está asignada al usuario actual
    const isAssignedToMe = app.analyst_id === user.id;
    
    // Verificar si la solicitud está en análisis
    const isPendingAnalysis = app.application_status === 'pending_analysis';
    
    // Obtener lista de analistas para reasignación (solo para administradores)
    let analysts: Analyst[] = [];
    try {
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (roleError) {
        console.error('Error al verificar rol del usuario:', roleError);
      } else if (userRole?.role === 'admin') {
        const { data: analystList, error: analystsError } = await supabase
          .from('user_roles')
          .select('user_id, profiles:user_id(id, full_name, email)')
          .in('role', ['analyst', 'admin']);
        
        if (analystsError) {
          console.error('Error al obtener lista de analistas:', analystsError);
        } else {
          analysts = (analystList || []).map(analyst => ({
            user_id: analyst.user_id,
            profiles: analyst.profiles?.[0] || null
          }));
        }
      }
    } catch (roleError) {
      console.error('Error al consultar roles:', roleError);
    }
    
    return {
      app,
      profiles,
      contact,
      financial,
      equipment,
      analystInfo,
      creditBureauDetails,
      previousDecisions,
      isAssignedToMe,
      isPendingAnalysis,
      analysts,
      user,
      userEmail
    };
  } catch (error) {
    console.error('Error al obtener detalles de la solicitud:', error);
    redirect('/admin/applications?error=application_not_found');
    return null;
  }
}

export default async function ApplicationDetailPage({
  params,
  searchParams
}: {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Asegurarse de que params y searchParams se manejen de forma asíncrona
  const resolvedParams = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const id = resolvedParams.id;
  
  // Validar que el ID existe
  if (!id) {
    console.error('ID de solicitud no proporcionado');
    return redirect('/admin/applications?error=missing_application_id');
  }

  // Obtener los datos de la aplicación
  const data = await getApplicationData(id);
  
  // Si no hay datos, redirigir
  if (!data) {
    return redirect('/admin/applications?error=application_not_found');
  }
  
  // Extraer los datos
  const { 
    app, 
    profiles, 
    contact, 
    financial, 
    equipment, 
    analystInfo, 
    creditBureauDetails, 
    previousDecisions, 
    isAssignedToMe, 
    isPendingAnalysis, 
    analysts,
    user,
    userEmail
  } = data;
  
  // Obtener nombre del analista
  const analystName = analystInfo?.full_name || analystInfo?.email || 'No asignado';
  
  // Verificar si hay un mensaje de éxito
  const successMessage = resolvedSearchParams?.success;
  
  // Formatear fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES');
  };
  
  // Mapear estado a texto legible
  const statusMap: Record<string, string> = {
    'pending_analysis': 'En análisis',
    'approved': 'Aprobado',
    'rejected': 'Rechazado',
    'pending': 'Pendiente',
    'cancelled': 'Cancelado',
    'incomplete': 'Incompleto'
  };
  
  // Determinar el estado a partir de application_status o status
  const statusText = statusMap[app.application_status] || app.application_status;
  
  // Calcular la edad a partir de la fecha de nacimiento
  const calculateAge = (dateOfBirth: string | null | undefined) => {
    if (!dateOfBirth) return 'No disponible';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age} años`;
  };
  
  // Verificar acciones disponibles para el analista actual
  const canStartAnalysis = isPendingAnalysis && isAssignedToMe && !app.analysis_started_at;
  const canTakeDecision = isPendingAnalysis && isAssignedToMe && !!app.analysis_started_at;

  // LOG DE DEPURACIÓN PARA VISIBILIDAD DE BOTONES
  console.log('[DEBUG] Visibilidad de botones:', {
    isAssignedToMe,
    isPendingAnalysis,
    analysis_started_at: app.analysis_started_at,
    application_status: app.application_status,
    canStartAnalysis,
    canTakeDecision
  });
  
  return (
    <div className="space-y-6">
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50">
          {successMessage === 'assigned' && (
            <p>La solicitud ha sido asignada correctamente.</p>
          )}
          {successMessage === 'analysis_started' && (
            <p>El análisis ha sido iniciado correctamente.</p>
          )}
        </div>
      )}
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/admin/applications" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a solicitudes
          </Link>
          <h1 className="text-2xl font-bold">Solicitud #{app.id.substring(0, 8)}</h1>
          <p className="text-gray-500">
            Creada el {formatDate(app.created_at)}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Estado de la solicitud */}
          <div className={`
            px-3 py-1 rounded-full text-sm inline-flex items-center
            ${app.status === 'pending_analysis' ? 'bg-amber-100 text-amber-800' : 
              app.status === 'approved' ? 'bg-green-100 text-green-800' :
              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }
          `}>
            <Clock className="h-4 w-4 mr-1" />
            {statusText}
          </div>
          
          {/* Botón de asignación si no está asignada */}
          {!isAssignedToMe && (
            <form action={assignToCurrentAnalyst}>
              <input type="hidden" name="applicationId" value={app.id} />
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow inline-flex items-center">
                <UserPlus className="h-4 w-4 mr-1" />
                Asignarme
              </Button>
            </form>
          )}
          
          {/* Iniciar análisis si no se ha iniciado */}
          {isAssignedToMe && !app.analysis_started_at && (
            <form action={async (formData) => {
              'use server';
              console.log('Formulario de inicio de análisis enviado');
              try {
                console.log('Llamando a startAnalysis');
                await startAnalysis(formData);
                console.log('startAnalysis completado sin errores');
              } catch (error) {
                console.error('Error al iniciar análisis:', error);
              }
            }}>
              <input type="hidden" name="applicationId" value={app.id} />
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow inline-flex items-center">
                <Play className="h-4 w-4 mr-1" />
                Iniciar análisis
              </Button>
            </form>
          )}
          
          {/* Botón para tomar decisión */}
          {isAssignedToMe && app.analysis_started_at && (
            <div className="flex gap-2">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow inline-flex items-center" asChild>
                <Link href={`/admin/applications/${id}/approve`}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprobar
                </Link>
              </Button>
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow inline-flex items-center" asChild>
                <Link href={`/admin/applications/${id}/reject`}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Rechazar
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Información de asignación */}
      {app.analyst_id && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-2">
              <User className="h-5 w-5 text-primary" />
              <h3 className="font-medium">Analista asignado</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre:</p>
                <p className="font-medium">{analystName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Asignado el: {app.assigned_at
                    ? formatDate(app.assigned_at)
                    : 'No asignado'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Análisis iniciado: {app.analysis_started_at
                    ? formatDate(app.analysis_started_at)
                    : 'No iniciado'}
                </p>
              </div>
              {app.analysis_complete_date && (
                <div>
                  <p className="text-sm text-gray-500">Análisis completado:</p>
                  <p className="font-medium">{formatDate(app.analysis_complete_date)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Pestañas principales */}
      <Tabs defaultValue="client" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="client">Información del Cliente</TabsTrigger>
          <TabsTrigger value="bureau">Buró de Crédito</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>
        
        {/* Pestaña de información del cliente */}
        <TabsContent value="client">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Información personal */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Información Personal</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Nombre completo</p>
                    <p className="font-medium">{profiles?.full_name || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CURP/RFC</p>
                    <p className="font-medium">{profiles?.curp_rfc || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de nacimiento</p>
                    <p className="font-medium">{profiles?.birth_date ? new Date(profiles.birth_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }) : 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Edad</p>
                    <p className="font-medium">{profiles?.birth_date ? calculateAge(profiles.birth_date) : 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado civil</p>
                    <p className="font-medium">{
                      profiles?.marital_status === 'soltero' ? 'Soltero/a' :
                      profiles?.marital_status === 'casado' ? 'Casado/a' :
                      profiles?.marital_status === 'union_libre' ? 'Unión libre' :
                      profiles?.marital_status === 'divorciado' ? 'Divorciado/a' :
                      profiles?.marital_status === 'viudo' ? 'Viudo/a' :
                      profiles?.marital_status || 'No disponible'
                    }</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dependientes económicos</p>
                    <p className="font-medium">{profiles?.dependents ?? '0'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Información de contacto */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Home className="h-5 w-5 text-primary" />
                  <CardTitle>Información de Contacto</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Correo electrónico</p>
                    <p className="font-medium">{userEmail}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Teléfono móvil</p>
                    <p className="font-medium">{contact?.mobile_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Calle y número</p>
                    <p className="font-medium">{contact ? `${contact.street} ${contact.street_number}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Colonia</p>
                    <p className="font-medium">{contact?.neighborhood}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ciudad</p>
                    <p className="font-medium">{contact?.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estado</p>
                    <p className="font-medium">{contact?.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Código postal</p>
                    <p className="font-medium">{contact?.zip_code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Información financiera */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle>Información Financiera</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {financial ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Ocupación</p>
                      <p className="font-medium">{financial.occupation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Compañía</p>
                      <p className="font-medium">{financial.company_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Antigüedad Laboral</p>
                      <p className="font-medium">{financial.employment_time}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ingreso mensual</p>
                      <p className="font-medium">{formatCurrency(financial.monthly_income)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ingreso adicional</p>
                      <p className="font-medium">{formatCurrency(financial.additional_income || 0)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No hay información financiera disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Información del equipo */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Laptop className="h-5 w-5 text-primary" />
                  <CardTitle>Equipo Solicitado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {equipment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Tipo de equipo</p>
                      <p className="font-medium">{equipment.equipment_type || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Marca</p>
                      <p className="font-medium">{equipment.equipment_brand || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Modelo</p>
                      <p className="font-medium">{equipment.equipment_model || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Monto aproximado</p>
                      <p className="font-medium">{formatCurrency(equipment.approximate_amount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Plazo deseado</p>
                      <p className="font-medium">{equipment.desired_term || 0} meses</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500">No hay información de equipo disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Pestaña de buró de crédito */}
        <TabsContent value="bureau">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-1">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle>Reporte del buró de crédito</CardTitle>
              </div>
              <CardDescription>
                {app.credit_bureau_queried_at 
                  ? `Consultado el ${formatDate(app.credit_bureau_queried_at)}`
                  : 'No se ha consultado el buró de crédito'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!app.credit_bureau_queried_at && (
                <div className="text-center py-6">
                  <p className="text-gray-500">No hay información disponible del buró de crédito</p>
                  {isAssignedToMe && (
                    <Button variant="outline" size="sm" className="mt-4">
                      Consultar buró
                    </Button>
                  )}
                </div>
              )}
              
              {app.credit_bureau_queried_at && !creditBureauDetails && (
                <div className="text-center py-6">
                  <p className="text-gray-500">La consulta al buró se realizó pero no hay detalles disponibles</p>
                </div>
              )}
              
              {creditBureauDetails && (
                <div>
                  {/* Score */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Score de crédito</h3>
                      <div className={`
                        px-2 py-0.5 rounded-full text-xs
                        ${creditBureauDetails.score >= 700 ? 'bg-green-100 text-green-800' :
                          creditBureauDetails.score >= 600 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }
                      `}>
                        {creditBureauDetails.score || 'N/A'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {creditBureauDetails.score_name || 'Score'}: {creditBureauDetails.score || 'No disponible'}
                    </p>
                  </div>
                  
                  {/* Cuentas */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Cuentas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="font-medium">{creditBureauDetails.total_accounts || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Abiertas</p>
                        <p className="font-medium">{creditBureauDetails.open_accounts || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Cerradas</p>
                        <p className="font-medium">{creditBureauDetails.closed_accounts || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Negativas</p>
                        <p className="font-medium">{creditBureauDetails.negative_accounts || 0}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Saldos */}
                  <div className="mb-6">
                    <h3 className="font-medium mb-2">Saldos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Saldo actual total</p>
                        <p className="font-medium">{formatCurrency(creditBureauDetails.total_current_balance || 0)}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Límite de crédito total</p>
                        <p className="font-medium">{formatCurrency(creditBureauDetails.total_credit_limit || 0)}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3">
                        <p className="text-sm text-gray-500">Saldo vencido total</p>
                        <p className="font-medium">{formatCurrency(creditBureauDetails.total_past_due || 0)}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Alertas */}
                  {creditBureauDetails.has_hawk_alerts && (
                    <div className="mb-6">
                      <h3 className="font-medium mb-2">Alertas</h3>
                      <div className="bg-red-50 text-red-800 rounded p-3">
                        <p className="font-medium">Se detectaron alertas en el buró</p>
                        <p className="text-sm">Códigos: {creditBureauDetails.hawk_alert_codes?.join(', ') || 'No especificado'}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pestaña de documentos */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-1">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle>Documentos</CardTitle>
              </div>
              <CardDescription>Documentos proporcionados por el cliente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-gray-500">No hay documentos disponibles</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Pestaña de historial */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2 mb-1">
                <History className="h-5 w-5 text-primary" />
                <CardTitle>Historial de la solicitud</CardTitle>
              </div>
              <CardDescription>Registro de actividades y cambios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex">
                  <div className="w-10 flex-shrink-0 text-center">
                    <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                    <div className="w-px h-full bg-gray-200 mx-auto"></div>
                  </div>
                  <div className="flex-grow pb-4">
                    <p className="text-sm text-gray-500">{formatDate(app.created_at)}</p>
                    <p className="font-medium">Solicitud creada</p>
                    <p className="text-sm text-gray-500">
                      ID: {app.id.substring(0, 8)}
                    </p>
                  </div>
                </div>
                
                {app.analyst_id && (
                  <div className="flex">
                    <div className="w-10 flex-shrink-0 text-center">
                      <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                      <div className="w-px h-full bg-gray-200 mx-auto"></div>
                    </div>
                    <div className="flex-grow pb-4">
                      <p className="text-sm text-gray-500">
                        {app.analysis_started_at 
                          ? formatDate(app.analysis_started_at) 
                          : formatDate(app.updated_at)}
                      </p>
                      <p className="font-medium">Analista asignado: {analystName}</p>
                    </div>
                  </div>
                )}
                
                {app.analysis_start_date && (
                  <div className="flex">
                    <div className="w-10 flex-shrink-0 text-center">
                      <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                      <div className="w-px h-full bg-gray-200 mx-auto"></div>
                    </div>
                    <div className="flex-grow pb-4">
                      <p className="text-sm text-gray-500">{formatDate(app.analysis_start_date)}</p>
                      <p className="font-medium">Análisis iniciado</p>
                    </div>
                  </div>
                )}
                
                {app.credit_bureau_queried_at && (
                  <div className="flex">
                    <div className="w-10 flex-shrink-0 text-center">
                      <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                      <div className="w-px h-full bg-gray-200 mx-auto"></div>
                    </div>
                    <div className="flex-grow pb-4">
                      <p className="text-sm text-gray-500">{formatDate(app.credit_bureau_queried_at)}</p>
                      <p className="font-medium">Buró de crédito consultado</p>
                      {app.credit_score && (
                        <p className="text-sm">
                          Score: <span className={`font-medium ${app.credit_score >= 700 ? 'text-green-600' : app.credit_score >= 600 ? 'text-amber-600' : 'text-red-600'}`}>
                            {app.credit_score}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
                {app.analysis_complete_date && (
                  <div className="flex">
                    <div className="w-10 flex-shrink-0 text-center">
                      <div className="w-2 h-2 bg-primary rounded-full mx-auto"></div>
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-500">{formatDate(app.analysis_complete_date)}</p>
                      <p className="font-medium">Análisis completado</p>
                      <p className="text-sm text-gray-700">Resultado: {statusText}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 