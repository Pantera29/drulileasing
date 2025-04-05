import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { 
  Users, 
  ClipboardCheck, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Forzar que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: {
    status?: string;
    search?: string;
    scoreMin?: string;
    scoreMax?: string;
    amountMin?: string;
    amountMax?: string;
    page?: string;
  };
}) {
  const supabase = await createClient();

  // Obtener estadísticas de solicitudes - usando enfoque del portal del cliente
  const { data: allStatusData } = await supabase
    .from('credit_applications')
    .select('application_status');

  // Crear un objeto con las estadísticas por estado usando conteo manual
  const statsMap: Record<string, number> = {
    pending_analysis: 0,
    approved: 0, 
    rejected: 0,
    in_review: 0,
    pending_nip: 0,
    incomplete: 0
  };
  
  // Contar manualmente como en el portal del cliente
  if (allStatusData && allStatusData.length > 0) {
    allStatusData.forEach(item => {
      const status = item.application_status;
      if (statsMap.hasOwnProperty(status)) {
        statsMap[status]++;
      }
    });
  }

  // Obtener solicitudes pendientes de análisis recientes - usando enfoque del portal del cliente
  const { data: pendingApplications, error: pendingError } = await supabase
    .from('credit_applications')
    .select('*')  // Usar SELECT * como en el portal del cliente
    .eq('application_status', 'pending_analysis')
    .order('created_at', { ascending: false })
    .limit(5);
    
  // Verificar si hay errores en la consulta
  if (pendingError) {
    console.error("Error al obtener solicitudes pendientes:", pendingError);
  }
  
  // Obtener perfiles y solicitudes de equipos relacionados si hay aplicaciones
  let profiles: any[] = [];
  let equipmentRequests: any[] = [];
  
  if (pendingApplications && pendingApplications.length > 0) {
    // Obtener los perfiles relacionados
    const profileIds = pendingApplications.map(app => app.profile_id).filter(Boolean);
    if (profileIds.length > 0) {
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds);
      
      profiles = profilesData || [];
    }
    
    // Obtener las solicitudes de equipo relacionadas
    const equipmentIds = pendingApplications.map(app => app.equipment_id).filter(Boolean);
    if (equipmentIds.length > 0) {
      const { data: equipmentData } = await supabase
        .from('equipment_requests')
        .select('id, approximate_amount')
        .in('id', equipmentIds);
      
      equipmentRequests = equipmentData || [];
    }
  }
  
  // Enriquecer las solicitudes con sus relaciones
  const enrichedApplications = pendingApplications?.map(app => ({
    ...app,
    profiles: profiles.filter(p => p.id === app.profile_id),
    equipment_requests: equipmentRequests.filter(e => e.id === app.equipment_id)
  })) || [];

  // Obtener métricas de rendimiento - mismo enfoque sin group
  const { data: allDecisionsData } = await supabase
    .from('analyst_decisions')
    .select('decision_type, created_at');

  // Calcular métricas usando el enfoque manual
  const decisionCounts: Record<string, number> = {
    approved: 0,
    rejected: 0
  };

  if (allDecisionsData && allDecisionsData.length > 0) {
    allDecisionsData.forEach(item => {
      const type = item.decision_type;
      if (decisionCounts.hasOwnProperty(type)) {
        decisionCounts[type]++;
      }
    });
  }

  // Simplificar las métricas
  const approvalRate = calculateApprovalRate(decisionCounts);
  
  // Obtener el tiempo promedio de análisis
  const { data: timeData, error: timeError } = await supabase.rpc('get_average_analysis_time');
  const averageAnalysisTime = timeData || 0;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard de Analista</h1>
      
      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Solicitudes pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">
                {statsMap.pending_analysis}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Solicitudes que requieren análisis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">
                {approvalRate}%
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              De solicitudes revisadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tiempo promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-500 mr-2" />
              <div className="text-2xl font-bold">
                {formatHours(averageAnalysisTime)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Para completar un análisis
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ClipboardCheck className="h-5 w-5 text-indigo-500 mr-2" />
              <div className="text-2xl font-bold">
                {Object.values(statsMap).reduce((a: number, b: number) => a + b, 0)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              En todos los estados
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Distribución de estados */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución por estado</CardTitle>
          <CardDescription>
            Resumen de todas las solicitudes de crédito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatusCard 
              label="Pendientes de análisis"
              count={statsMap.pending_analysis}
              icon={<Clock className="h-5 w-5 text-amber-500" />}
              color="bg-amber-100 text-amber-800"
            />
            <StatusCard 
              label="Aprobadas"
              count={statsMap.approved}
              icon={<CheckCircle className="h-5 w-5 text-green-500" />}
              color="bg-green-100 text-green-800"
            />
            <StatusCard 
              label="Rechazadas"
              count={statsMap.rejected}
              icon={<XCircle className="h-5 w-5 text-red-500" />}
              color="bg-red-100 text-red-800"
            />
            <StatusCard 
              label="En revisión"
              count={statsMap.in_review}
              icon={<Clock className="h-5 w-5 text-indigo-500" />}
              color="bg-indigo-100 text-indigo-800"
            />
            <StatusCard 
              label="Pendientes de NIP"
              count={statsMap.pending_nip}
              icon={<Clock className="h-5 w-5 text-blue-500" />}
              color="bg-blue-100 text-blue-800"
            />
            <StatusCard 
              label="Incompletas"
              count={statsMap.incomplete}
              icon={<AlertTriangle className="h-5 w-5 text-gray-500" />}
              color="bg-gray-100 text-gray-800"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Solicitudes pendientes de análisis */}
      <Card>
        <CardHeader>
          <CardTitle>Solicitudes pendientes de análisis</CardTitle>
          <CardDescription>
            Las solicitudes más recientes que necesitan revisión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">ID</th>
                  <th className="text-left py-3 px-2 font-medium">Cliente</th>
                  <th className="text-left py-3 px-2 font-medium">Monto</th>
                  <th className="text-left py-3 px-2 font-medium">Score</th>
                  <th className="text-left py-3 px-2 font-medium">Fecha</th>
                  <th className="text-right py-3 px-2 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {enrichedApplications?.map((app) => (
                  <tr key={app.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2">{app.id.substring(0, 8)}</td>
                    <td className="py-3 px-2">{app.profiles?.[0]?.full_name || 'No disponible'}</td>
                    <td className="py-3 px-2">${app.equipment_requests?.[0]?.approximate_amount?.toLocaleString('es-MX') || '0'}</td>
                    <td className="py-3 px-2">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getScoreColor(app.credit_score)}`}>
                        {app.credit_score || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3 px-2">{new Date(app.created_at).toLocaleDateString('es-MX')}</td>
                    <td className="py-3 px-2 text-right">
                      <a 
                        href={`/admin/applications/${app.id}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        Revisar
                      </a>
                    </td>
                  </tr>
                ))}
                
                {(!enrichedApplications || enrichedApplications.length === 0) && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-500">
                      No hay solicitudes pendientes de análisis
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-right">
            <a 
              href="/admin/applications" 
              className="text-indigo-600 hover:text-indigo-900 font-medium text-sm"
            >
              Ver todas las solicitudes
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente para tarjetas de estado
function StatusCard({ 
  label, 
  count, 
  icon, 
  color 
}: { 
  label: string; 
  count: number; 
  icon: React.ReactNode; 
  color: string;
}) {
  return (
    <div className={`p-4 rounded-lg flex flex-col items-center justify-center ${color}`}>
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <span className="font-bold text-2xl">{count}</span>
      <span className="text-xs mt-1 text-center">{label}</span>
    </div>
  );
}

// Función para calcular la tasa de aprobación
function calculateApprovalRate(decisionCounts: Record<string, number>): number {
  if (!decisionCounts) return 0;
  
  const approved = decisionCounts.approved || 0;
  const total = Object.values(decisionCounts).reduce((sum: number, count: number) => sum + count, 0);
  
  return total > 0 ? Math.round((approved / total) * 100) : 0;
}

// Función para formatear horas
function formatHours(hours: number): string {
  if (!hours) return '0h';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Función para determinar el color del score
function getScoreColor(score: number | null): string {
  if (!score) return 'bg-gray-100 text-gray-800';
  if (score >= 700) return 'bg-green-100 text-green-800';
  if (score >= 600) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
} 