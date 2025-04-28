import React from 'react';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Search, Filter, ChevronDown, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Forzar que la ruta sea dinámica
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// Valores por defecto para searchParams
const defaultSearchParams = {
  status: 'all',
  search: '',
  scoreMin: '0',
  scoreMax: '999',
  amountMin: '0',
  amountMax: '999999999',
  page: '1'
};

// La función principal del componente debe ser async para manejar searchParams
export default async function ApplicationsPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  // Creamos el cliente de Supabase
  const supabase = await createClient();
  
  // Resolvemos los parámetros de búsqueda de forma segura
  const resolvedSearchParams = await Promise.resolve(searchParams);
  
  // Extraemos los parámetros del objeto searchParams de forma segura (Next.js 14)
  const status = Array.isArray(resolvedSearchParams?.status) ? resolvedSearchParams.status[0] : resolvedSearchParams?.status || defaultSearchParams.status;
  const search = Array.isArray(resolvedSearchParams?.search) ? resolvedSearchParams.search[0] : resolvedSearchParams?.search || defaultSearchParams.search;
  const scoreMin = parseInt(Array.isArray(resolvedSearchParams?.scoreMin) ? resolvedSearchParams.scoreMin[0] : resolvedSearchParams?.scoreMin || defaultSearchParams.scoreMin);
  const scoreMax = parseInt(Array.isArray(resolvedSearchParams?.scoreMax) ? resolvedSearchParams.scoreMax[0] : resolvedSearchParams?.scoreMax || defaultSearchParams.scoreMax);
  const amountMin = parseInt(Array.isArray(resolvedSearchParams?.amountMin) ? resolvedSearchParams.amountMin[0] : resolvedSearchParams?.amountMin || defaultSearchParams.amountMin);
  const amountMax = parseInt(Array.isArray(resolvedSearchParams?.amountMax) ? resolvedSearchParams.amountMax[0] : resolvedSearchParams?.amountMax || defaultSearchParams.amountMax);
  const page = parseInt(Array.isArray(resolvedSearchParams?.page) ? resolvedSearchParams.page[0] : resolvedSearchParams?.page || defaultSearchParams.page);
  const errorMsg = Array.isArray(resolvedSearchParams?.error) ? resolvedSearchParams.error[0] : resolvedSearchParams?.error;
  
  const pageSize = 25;
  const offset = (page - 1) * pageSize;
  
  console.log(`Buscando solicitudes con estado: "${status}"`);
  
  try {
    // Obtener estadísticas de estado para los contadores
    const { data: allStatusData } = await supabase
      .from('credit_applications')
      .select('application_status');
    
    // Convertir estadísticas a objeto para fácil acceso
    const statusCounts: Record<string, number> = {
      pending_analysis: 0,
      approved: 0,
      rejected: 0,
      in_review: 0,
      pending_nip: 0,
      incomplete: 0,
      all: 0
    };
    
    // Contar manualmente
    if (allStatusData && allStatusData.length > 0) {
      statusCounts.all = allStatusData.length;
      allStatusData.forEach(item => {
        const status = item.application_status;
        if (statusCounts.hasOwnProperty(status)) {
          statusCounts[status]++;
        }
      });
    }
    
    console.log("Conteo de estados:", JSON.stringify(statusCounts, null, 2));
    
    // Consultar solicitudes de crédito con filtros y join con tablas relacionadas
    let { data: applications, error } = await supabase
      .from('credit_applications')
      .select(`
        *,
        profiles:profile_id (*),
        equipment_requests:equipment_id (*)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error al obtener aplicaciones:', error);
      applications = [];
    }
    
    if (!applications) {
      console.error('No se encontraron aplicaciones');
      applications = [];
    } else {
      console.log(`Se encontraron ${applications.length} aplicaciones en total`);
    }
    
    // Filtrar aplicaciones según criterios
    let filteredApplications = [...applications]; // Creamos una copia para evitar mutaciones
    
    // 1. Filtrar por estado si no es "all"
    if (status !== 'all') {
      filteredApplications = filteredApplications.filter(app => 
        app.application_status === status
      );
      console.log(`Después de filtrar por estado "${status}": ${filteredApplications.length} solicitudes`);
    }
    
    // 2. Filtrar por rango de score
    if (scoreMin > 0 || scoreMax < 999) {
      filteredApplications = filteredApplications.filter(app => {
        const score = app.credit_score || 0;
        return score >= scoreMin && score <= scoreMax;
      });
      console.log(`Después de filtrar por score (${scoreMin}-${scoreMax}): ${filteredApplications.length} solicitudes`);
    }
    
    // 3. Filtrar por monto
    if (amountMin > 0 || amountMax < 999999999) {
      filteredApplications = filteredApplications.filter(app => {
        const amount = app.equipment_requests?.approximate_amount || 0;
        return amount >= amountMin && amount <= amountMax;
      });
      console.log(`Después de filtrar por monto (${amountMin}-${amountMax}): ${filteredApplications.length} solicitudes`);
    }
    
    // 4. Filtrar por término de búsqueda (nombre de cliente)
    if (search && search.length > 0) {
      filteredApplications = filteredApplications.filter(app => {
        const fullName = app.profiles?.full_name || '';
        return fullName.toLowerCase().includes(search.toLowerCase());
      });
      console.log(`Después de filtrar por búsqueda "${search}": ${filteredApplications.length} solicitudes`);
    }
    
    // Aplicar paginación a los resultados filtrados
    const startIndex = offset;
    const endIndex = Math.min(offset + pageSize, filteredApplications.length);
    const paginatedApplications = filteredApplications.slice(startIndex, endIndex);
    
    console.log(`Mostrando resultados ${startIndex + 1}-${endIndex} de ${filteredApplications.length}`);
    
    // Obtener lista de analistas para asignación
    const { data: analysts } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        role,
        users:user_id (
          id,
          email,
          profiles:id (
            id,
            full_name
          )
        )
      `)
      .in('role', ['analyst', 'admin']);
    
    // Calcular total de páginas
    const totalPages = Math.ceil(filteredApplications.length / pageSize);
    
    // Mapear IDs de estados a nombres en español
    const statusNames: Record<string, string> = {
      pending_analysis: 'En análisis',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      in_review: 'En revisión',
      pending_nip: 'Pendiente de NIP',
      incomplete: 'Incompleta',
      all: 'Todos'
    };
    
    return (
      <div className="space-y-6">
        {/* Mostrar error si existe */}
        {errorMsg && (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
            <p>Error: {errorMsg === 'application_not_found' 
              ? 'No se encontró la solicitud buscada' 
              : errorMsg}
            </p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold">Solicitudes de Crédito</h1>
          
          <div className="mt-4 md:mt-0 flex space-x-2">
            <div className="relative">
              <form action="/admin/applications" method="GET">
                <input 
                  type="hidden" 
                  name="status" 
                  value={status} 
                />
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    name="search" 
                    placeholder="Buscar por cliente..."
                    defaultValue={search}
                    className="pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </form>
            </div>
            
            <Button variant="outline" className="flex items-center">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Filtros de estado */}
        <div className="flex flex-wrap gap-2">
          <StatusFilter 
            label="Todos" 
            value="all" 
            current={status} 
            count={statusCounts.all} 
          />
          <StatusFilter 
            label="En análisis" 
            value="pending_analysis" 
            current={status} 
            count={statusCounts.pending_analysis}
            color="amber" 
          />
          <StatusFilter 
            label="Aprobadas" 
            value="approved" 
            current={status} 
            count={statusCounts.approved}
            color="green" 
          />
          <StatusFilter 
            label="Rechazadas" 
            value="rejected" 
            current={status} 
            count={statusCounts.rejected}
            color="red" 
          />
          <StatusFilter 
            label="En revisión" 
            value="in_review" 
            current={status} 
            count={statusCounts.in_review}
            color="indigo" 
          />
        </div>
        
        {/* Tabla de solicitudes */}
        <Card>
          <CardHeader>
            <CardTitle>Solicitudes</CardTitle>
            <CardDescription>
              {status === 'all' 
                ? 'Todas las solicitudes de crédito' 
                : `Solicitudes en estado "${statusNames[status] || status}"`}
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
                    <th className="text-left py-3 px-2 font-medium">Plazo</th>
                    <th className="text-left py-3 px-2 font-medium">Score</th>
                    <th className="text-left py-3 px-2 font-medium">Fecha</th>
                    <th className="text-left py-3 px-2 font-medium">Estado</th>
                    <th className="text-left py-3 px-2 font-medium">Analista</th>
                    <th className="text-right py-3 px-2 font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedApplications.length > 0 ? (
                    paginatedApplications.map((app) => (
                      <tr key={app.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-2">{app.id?.substring(0, 8) || 'N/A'}</td>
                        <td className="py-3 px-2">{app.profiles?.full_name || 'No disponible'}</td>
                        <td className="py-3 px-2">
                          {formatCurrency(app.equipment_requests?.approximate_amount || 0)}
                        </td>
                        <td className="py-3 px-2">{app.equipment_requests?.desired_term || 0} meses</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs ${getScoreColor(app.credit_score)}`}>
                            {app.credit_score || 'N/A'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {app.created_at ? formatDate(app.created_at) : 'N/A'}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${app.application_status === 'approved' ? 'bg-green-100 text-green-800' : 
                              app.application_status === 'in_review' || app.application_status === 'pending_analysis' ? 'bg-amber-100 text-amber-800' :
                              app.application_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'}`}>
                            {statusNames[app.application_status] || app.application_status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {app.analyst_id ? (
                            <span className="text-gray-600">
                              {getAnalystName(app.analyst_id, analysts) || 'Analista'}
                            </span>
                          ) : (
                            <Button variant="ghost" size="sm" className="text-xs h-7">
                              <UserPlus className="h-3 w-3 mr-1" />
                              Asignar
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link 
                            href={`/admin/applications/${app.id}`}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Revisar
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-gray-500">
                        No se encontraron solicitudes con los filtros seleccionados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Información de debug */}
            {filteredApplications.length > 0 && paginatedApplications.length === 0 && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                Hay {filteredApplications.length} solicitudes que coinciden con los filtros, pero ninguna en la página actual.
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-amber-800 underline ml-2"
                  onClick={() => window.location.href = `/admin/applications?status=${status}&page=1`}
                >
                  Ir a página 1
                </Button>
              </div>
            )}
            
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6">
                <div className="text-sm text-gray-500">
                  Mostrando página {page} de {totalPages}
                </div>
                <div className="flex space-x-2">
                  {page > 1 && (
                    <Link href={`/admin/applications?status=${status}&page=${page - 1}`}>
                      <Button variant="outline" size="sm">Anterior</Button>
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link href={`/admin/applications?status=${status}&page=${page + 1}`}>
                      <Button variant="outline" size="sm">Siguiente</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error crítico al procesar la página:", error);
    // Si hay un error crítico, mostrar una página de error básica
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error al cargar las solicitudes</h1>
        <p className="mb-4">Ha ocurrido un error al procesar los datos. Por favor, intente nuevamente.</p>
        <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
          {error instanceof Error ? error.message : 'Error desconocido'}
        </pre>
        <Link href="/admin/dashboard">
          <Button className="mt-4">Volver al dashboard</Button>
        </Link>
      </div>
    );
  }
}

// Componente para filtros de estado
function StatusFilter({ 
  label, 
  value, 
  current, 
  count, 
  color = 'gray' 
}: { 
  label: string; 
  value: string; 
  current: string; 
  count: number; 
  color?: 'gray' | 'amber' | 'green' | 'red' | 'indigo';
}) {
  const isActive = current === value;
  const colorClasses = {
    gray: isActive ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    amber: isActive ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800 hover:bg-amber-200',
    green: isActive ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200',
    red: isActive ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200',
    indigo: isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200',
  };
  
  return (
    <Link href={`/admin/applications?status=${value}`}>
      <div className={`px-3 py-1 rounded-full text-sm flex items-center cursor-pointer transition-colors ${colorClasses[color]}`}>
        {label}
        <span
          className={`ml-1 px-1.5 py-0.5 rounded-full text-xs
            ${isActive
              ? color === 'green'
                ? 'bg-green-600 text-white'
                : color === 'red'
                ? 'bg-red-600 text-white'
                : color === 'amber'
                ? 'bg-amber-500 text-white'
                : color === 'indigo'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-900 text-white'
              : 'bg-white text-gray-800'}
          `}
        >
          {count}
        </span>
      </div>
    </Link>
  );
}

// Función para obtener el nombre del analista
function getAnalystName(analystId: string, analysts: any[] | null): string | null {
  if (!analysts) return null;
  for (const analyst of analysts) {
    if (analyst.user_id === analystId) {
      if (analyst.users?.profiles?.full_name) {
        return analyst.users.profiles.full_name;
      } else if (analyst.users?.email) {
        return analyst.users.email;
      }
    }
  }
  return null;
}

// Función para formatear fechas en formato legible
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return dateString;
  }
}

// Función para determinar el color del score
function getScoreColor(score: number | null): string {
  if (!score) return 'bg-gray-100 text-gray-800';
  if (score >= 700) return 'bg-green-100 text-green-800';
  if (score >= 600) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
}