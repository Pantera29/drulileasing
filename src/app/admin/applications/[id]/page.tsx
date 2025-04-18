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

// Forzar que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export const fetchCache = 'force-no-store';

export default async function ApplicationDetailPage({
  params
}: {
  params: { id: string }
}) {
  try {
    const { id } = params;
    
    if (!id || typeof id !== 'string') {
      console.error('ID de solicitud inválido:', id);
      redirect('/admin/applications?error=invalid_application_id');
    }
    
    const supabase = await createClient();
    
    // Verificar autenticación y rol
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      redirect('/login?error=session_expired');
    }
    
    // Verificar si es analista o admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id);
      
    const roles = userRoles?.map(ur => ur.role) || [];
    const isAnalyst = roles.includes('analyst');
    const isAdmin = roles.includes('admin');
    
    if (!isAnalyst && !isAdmin) {
      redirect('/admin/dashboard?error=unauthorized');
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
        return; // Para evitar que siga la ejecución
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
        decisionsResult
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
        app.analyst_id ? supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('id', app.analyst_id)
          .maybeSingle() : Promise.resolve({ data: null, error: null }),
          
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
          .order('created_at', { ascending: false })
      ]);
      
      // Extraer datos de los resultados
      const profiles = profilesResult.data;
      const contact = contactResult.data;
      const financial = financialResult.data;
      const equipment = equipmentResult.data;
      const analystInfo = analystResult.data;
      const creditBureauDetails = bureauResult.data;
      const previousDecisions = decisionsResult.data;
      
      // Verificar si alguna consulta falló
      if (profilesResult.error) console.error('Error al obtener perfil:', profilesResult.error);
      if (contactResult.error) console.error('Error al obtener contacto:', contactResult.error);
      if (financialResult.error) console.error('Error al obtener financiero:', financialResult.error);
      if (equipmentResult.error) console.error('Error al obtener equipo:', equipmentResult.error);
      if (analystResult.error) console.error('Error al obtener analista:', analystResult.error);
      if (bureauResult.error) console.error('Error al obtener buró:', bureauResult.error);
      
      // Verificar si la solicitud está asignada al usuario actual
      const isAssignedToMe = app.analyst_id === session.user.id;
      
      // Verificar si la solicitud está en análisis
      const isPendingAnalysis = app.application_status === 'pending_analysis';
      
      // Obtener lista de analistas para reasignación (solo para administradores)
      let analysts = [];
      try {
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
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
            analysts = analystList || [];
          }
        }
      } catch (roleError) {
        console.error('Error al consultar roles:', roleError);
      }
      
      // Función para asignar al analista actual
      async function assignToCurrentAnalyst(formData: FormData) {
        'use server';
        
        try {
          // Crear el cliente de supabase dentro de la función del servidor
          const supabaseServer = await createClient();
          
          // Obtener de nuevo la sesión dentro de la función del servidor
          const { data: { session } } = await supabaseServer.auth.getSession();
          
          if (!session) {
            console.error('Sesión no encontrada al intentar asignar analista');
            redirect(`/admin/applications?error=session_expired`);
            return;
          }
          
          console.log(`Asignando solicitud ${id} al analista actual ${session.user.id}`);
          
          const { error } = await supabaseServer
            .from('credit_applications')
            .update({ 
              analyst_id: session.user.id,
              analyst_assigned_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (error) {
            console.error('Error al asignar analista:', error);
            redirect(`/admin/applications/${id}?error=assignment_failed`);
            return;
          }
          
          // Redirigir a la misma página para refrescar los datos
          redirect(`/admin/applications/${id}?success=assigned`);
        } catch (err) {
          console.error('Error al asignar solicitud al analista actual:', err);
          redirect(`/admin/applications/${id}?error=assignment_failed`);
        }
      }
      
      // Función para iniciar análisis
      async function startAnalysis(formData: FormData) {
        'use server';
        
        try {
          // Crear el cliente de supabase dentro de la función del servidor
          const supabaseServer = await createClient();
          
          // Obtener de nuevo la sesión dentro de la función del servidor
          const { data: { session } } = await supabaseServer.auth.getSession();
          
          if (!session) {
            console.error('Sesión no encontrada al intentar iniciar análisis');
            redirect(`/admin/applications?error=session_expired`);
            return;
          }
          
          console.log(`Iniciando análisis para solicitud ${id}`);
          
          const { error } = await supabaseServer
            .from('credit_applications')
            .update({ 
              analysis_start_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
          
          if (error) {
            console.error('Error al iniciar análisis:', error);
            redirect(`/admin/applications/${id}?error=analysis_start_failed`);
            return;
          }
          
          // Redirigir a la misma página para refrescar los datos
          redirect(`/admin/applications/${id}?success=analysis_started`);
        } catch (err) {
          console.error('Error al actualizar fecha de inicio de análisis:', err);
          redirect(`/admin/applications/${id}?error=analysis_start_failed`);
        }
      }
      
      // Obtener nombre del analista
      const analystName = analystInfo?.full_name || analystInfo?.email || 'No asignado';
      
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
      const canStartAnalysis = isPendingAnalysis && isAssignedToMe && !app.analysis_start_date;
      const canTakeDecision = isPendingAnalysis && isAssignedToMe && !!app.analysis_start_date;
      
      return (
        <div className="space-y-6">
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
              
              {/* Asignar analista si no hay uno asignado */}
              {!app.analyst_id && (
                <form action={assignToCurrentAnalyst}>
                  <Button type="submit" size="sm" className="inline-flex items-center">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Asignarme
                  </Button>
                </form>
              )}
              
              {/* Iniciar análisis si no se ha iniciado */}
              {isAssignedToMe && !app.analysis_start_date && (
                <form action={startAnalysis}>
                  <Button type="submit" size="sm" className="inline-flex items-center">
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar análisis
                  </Button>
                </form>
              )}
              
              {/* Botón para tomar decisión */}
              {isAssignedToMe && app.analysis_start_date && (
                <Button size="sm" className="inline-flex items-center" asChild>
                  <Link href={`/admin/applications/${id}/decision`}>
                    <Check className="h-4 w-4 mr-1" />
                    Tomar decisión
                  </Link>
                </Button>
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
                  {app.analysis_start_date && (
                    <div>
                      <p className="text-sm text-gray-500">Análisis iniciado:</p>
                      <p className="font-medium">{formatDate(app.analysis_start_date)}</p>
                    </div>
                  )}
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
                        <p className="text-sm text-gray-500">Edad</p>
                        <p className="font-medium">{calculateAge(profiles?.date_of_birth)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Género</p>
                        <p className="font-medium">{profiles?.gender || 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estado civil</p>
                        <p className="font-medium">{profiles?.marital_status || 'No disponible'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Dependientes</p>
                        <p className="font-medium">{profiles?.number_of_dependents || '0'}</p>
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
                    {contact ? (
                      <div className="grid grid-cols-1 gap-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Dirección completa</p>
                          <p className="font-medium">
                            {[
                              contact.street,
                              contact.street_number,
                              contact.neighborhood,
                              contact.city,
                              contact.state,
                              contact.zip_code ? `CP ${contact.zip_code}` : ''
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Teléfono móvil</p>
                          <p className="font-medium">{contact.mobile_phone || 'No disponible'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Correo electrónico</p>
                          <p className="font-medium">{contact.email || 'No disponible'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500">No hay información de contacto disponible</p>
                      </div>
                    )}
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
                          <p className="font-medium">{financial.occupation || 'No disponible'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tipo de empleo</p>
                          <p className="font-medium">{financial.employment_type || 'No disponible'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Empleador</p>
                          <p className="font-medium">{financial.employer_name || 'No disponible'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha de inicio</p>
                          <p className="font-medium">{formatDate(financial.employment_start_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Ingreso mensual</p>
                          <p className="font-medium">{formatCurrency(financial.monthly_income || 0)}</p>
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
                            {app.analyst_assigned_date 
                              ? formatDate(app.analyst_assigned_date) 
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
          
          {/* Acciones */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {!isAssignedToMe && app.analyst_id && (
                  <Button variant="outline" size="sm" className="inline-flex items-center" disabled>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Asignado a otro analista
                  </Button>
                )}
                
                {!isAssignedToMe && !app.analyst_id && (
                  <form action={assignToCurrentAnalyst}>
                    <Button type="submit" size="sm" className="inline-flex items-center">
                      <UserPlus className="h-4 w-4 mr-1" />
                      Asignarme esta solicitud
                    </Button>
                  </form>
                )}
                
                {isAssignedToMe && !app.analysis_start_date && (
                  <form action={startAnalysis}>
                    <Button type="submit" size="sm" className="inline-flex items-center">
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar análisis
                    </Button>
                  </form>
                )}
                
                {isAssignedToMe && app.analysis_start_date && !app.analysis_complete_date && (
                  <Button size="sm" className="inline-flex items-center" asChild>
                    <Link href={`/admin/applications/${id}/decision`}>
                      <Check className="h-4 w-4 mr-1" />
                      Tomar decisión
                    </Link>
                  </Button>
                )}
                
                {app.analysis_complete_date && (
                  <Button variant="outline" size="sm" className="inline-flex items-center" disabled>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Análisis completado
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    } catch (error) {
      console.error('Error al obtener detalles de la solicitud:', error);
      redirect('/admin/applications?error=application_not_found');
    }
  } catch (error) {
    console.error('Error al obtener detalles de la solicitud:', error);
    redirect('/admin/applications?error=application_not_found');
  }
} 