import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, User, CalendarDays, ChevronRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

interface ReviewingPageProps {
  params: {
    id: string;
  };
}

export default async function ReviewingResultPage({ params }: ReviewingPageProps) {
  const { id } = params;
  const supabase = await createClient();
  
  // Verificar que el usuario esté autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener los datos de la aplicación
  const { data: application, error } = await supabase
    .from('credit_applications')
    .select(`
      id,
      user_id,
      application_status,
      credit_score,
      updated_at,
      equipment_id,
      profile_id
    `)
    .eq('id', id)
    .single();
  
  // Si no existe la aplicación o no está en revisión, redirigir al dashboard
  if (error || !application || application.application_status !== 'in_review') {
    console.error('Error al obtener la solicitud en revisión:', error);
    redirect('/dashboard');
  }
  
  // Verificar que el usuario sea el propietario de la solicitud
  if (application.user_id !== session.user.id) {
    console.error('Intento de acceso a solicitud ajena');
    redirect('/dashboard');
  }
  
  // Obtener datos del perfil y del equipo
  const [profileResult, equipmentResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .eq('id', application.profile_id || session.user.id)
      .single(),
    supabase
      .from('equipment_requests')
      .select('*')
      .eq('id', application.equipment_id)
      .single()
  ]);
  
  // Si no se pueden obtener los datos complementarios, usar valores por defecto
  const profile = profileResult.data || { full_name: 'Cliente' };
  const equipment = equipmentResult.data || { 
    equipment_type: 'Equipo', 
    equipment_model: 'No especificado',
    approximate_amount: 0
  };
  
  // Calcular fecha estimada de resolución (2 días hábiles)
  const submissionDate = new Date(application.updated_at);
  const estimatedResolutionDate = new Date(submissionDate);
  
  // Agregar 2 días hábiles (ignorando fines de semana)
  let businessDaysToAdd = 2;
  while (businessDaysToAdd > 0) {
    estimatedResolutionDate.setDate(estimatedResolutionDate.getDate() + 1);
    const dayOfWeek = estimatedResolutionDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = domingo, 6 = sábado
      businessDaysToAdd--;
    }
  }
  
  // Formatear la fecha en español
  const formattedDate = estimatedResolutionDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Banner de en revisión */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full blur-3xl bg-white/20"></div>
          </div>
          <div className="relative flex items-center mb-4">
            <div className="bg-white/30 rounded-full p-2 mr-4">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">Solicitud en revisión</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl">
            Tu solicitud se encuentra actualmente en proceso de revisión por nuestro equipo. Te notificaremos cuando tengamos una respuesta.
          </p>
        </div>
        
        <div className="p-8">
          {/* Detalles del status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estado de tu solicitud</h2>
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100 mb-4">
              <div className="flex items-center justify-between mb-6">
                <span className="flex items-center">
                  <span className="w-3 h-3 bg-amber-500 rounded-full animate-pulse mr-2"></span>
                  <span className="font-medium text-amber-800">En revisión por nuestro equipo</span>
                </span>
                <span className="text-amber-600 text-sm font-medium">
                  ID: {application.id.substring(0, 8)}
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <span className="text-gray-600">Evaluación inicial</span>
                  <span className="text-green-600 font-medium flex items-center">
                    Completado
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <span className="text-gray-600">Análisis detallado</span>
                  <span className="text-amber-600 font-medium flex items-center">
                    En proceso
                    <svg className="w-4 h-4 ml-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-amber-100">
                  <span className="text-gray-600">Revisión final</span>
                  <span className="text-gray-400 font-medium">Pendiente</span>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <div className="flex items-center mb-2">
                <CalendarDays className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="font-medium text-gray-800">Fecha estimada de respuesta</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Estimamos tener una respuesta para el <span className="font-semibold text-blue-700">{formattedDate}</span>.
              </p>
              <p className="text-sm text-blue-600">
                * Los tiempos de revisión pueden variar dependiendo del volumen de solicitudes.
              </p>
            </div>
          </div>
          
          {/* Resumen de la solicitud */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen de tu solicitud</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-2">
                  <User className="h-4 w-4 text-gray-500 mr-2" />
                  <p className="text-sm text-gray-600 font-medium">Solicitante</p>
                </div>
                <p className="text-lg font-bold text-gray-800">{profile.full_name}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-2">
                  <FileText className="h-4 w-4 text-gray-500 mr-2" />
                  <p className="text-sm text-gray-600 font-medium">Equipo solicitado</p>
                </div>
                <p className="text-lg font-bold text-gray-800">{equipment.equipment_type}</p>
                <p className="text-sm text-gray-500">Modelo: {equipment.equipment_model}</p>
              </div>
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-2">
                  <p className="text-sm text-gray-600 font-medium">Monto solicitado</p>
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {formatCurrency(equipment.approximate_amount)}
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-2">
                  <p className="text-sm text-gray-600 font-medium">Plazo solicitado</p>
                </div>
                <p className="text-lg font-bold text-gray-800">{equipment.desired_term} meses</p>
              </div>
            </div>
          </div>
          
          {/* Preguntas frecuentes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preguntas frecuentes</h2>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border">
                <h3 className="font-medium text-gray-800 mb-2">¿Qué significa que mi solicitud esté en revisión?</h3>
                <p className="text-gray-600">Tu solicitud ha pasado la validación inicial, pero requiere análisis adicional por parte de nuestro equipo antes de tomar una decisión final.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border">
                <h3 className="font-medium text-gray-800 mb-2">¿Puedo modificar mi solicitud en esta etapa?</h3>
                <p className="text-gray-600">No, una vez que la solicitud está en revisión no se pueden hacer modificaciones. Si necesitas cambiar algo, contacta a nuestro equipo de soporte.</p>
              </div>
              <div className="bg-white p-5 rounded-lg border">
                <h3 className="font-medium text-gray-800 mb-2">¿Cómo me notificarán el resultado?</h3>
                <p className="text-gray-600">Te enviaremos un correo electrónico con el resultado de la evaluación y también podrás consultar el estado en tu dashboard.</p>
              </div>
            </div>
          </div>
          
          {/* Contacto */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                ¿Necesitas hablar con nosotros?
              </h3>
              <p className="text-gray-600">Si tienes dudas sobre tu solicitud, nuestro equipo está disponible para asistirte.</p>
            </div>
            <div className="flex">
              <Button variant="outline" className="mr-2">
                Chat en línea
              </Button>
              <Button>
                Contactar por teléfono
              </Button>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/dashboard" passHref>
              <Button size="lg" className="w-full sm:w-auto">
                Volver al dashboard
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 