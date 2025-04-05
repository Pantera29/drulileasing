import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Clock, ChevronRight, Phone, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

interface AnalysisPageProps {
  params: {
    id: string;
  };
}

export default async function AnalysisResultPage({ params }: AnalysisPageProps) {
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
      equipment_id,
      profile_id,
      created_at
    `)
    .eq('id', id)
    .single();
  
  // Si no existe la aplicación o no está en análisis, redirigir al dashboard
  if (error || !application || application.application_status !== 'pending_analysis') {
    console.error('Error al obtener la solicitud en análisis:', error);
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
    approximate_amount: 0,
    desired_term: 0
  };
  
  // Calcular fecha estimada de respuesta (3 días hábiles)
  const createdDate = new Date(application.created_at);
  const estimatedResponseDate = new Date(createdDate);
  
  // Agregar 3 días hábiles (saltando fines de semana)
  let daysAdded = 0;
  while (daysAdded < 3) {
    estimatedResponseDate.setDate(estimatedResponseDate.getDate() + 1);
    const dayOfWeek = estimatedResponseDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Domingo, 6 = Sábado
      daysAdded++;
    }
  }
  
  // Formatear fecha
  const formattedDate = new Intl.DateTimeFormat('es-MX', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(estimatedResponseDate);
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Banner de análisis */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full blur-3xl bg-white/20"></div>
          </div>
          <div className="relative flex items-center mb-4">
            <div className="bg-white/30 rounded-full p-2 mr-4">
              <ClipboardList className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">Tu solicitud está en análisis</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl">
            Gracias {profile.full_name}, nuestro equipo está revisando tu solicitud detalladamente para ofrecerte la mejor opción de arrendamiento.
          </p>
        </div>
        
        <div className="p-8">
          {/* Detalles del equipo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles de tu solicitud</h2>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Equipo solicitado</p>
                  <p className="text-xl font-bold text-gray-800">{equipment.equipment_type || 'Equipo'}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Modelo</p>
                  <p className="text-xl font-bold text-gray-800">{equipment.equipment_model || 'No especificado'}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Monto solicitado</p>
                  <p className="text-xl font-bold text-gray-800">{formatCurrency(equipment.approximate_amount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium">Plazo deseado</p>
                  <p className="text-xl font-bold text-gray-800">{equipment.desired_term || 0} meses</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Estado del análisis */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Estado del análisis</h2>
            <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
              <div className="flex items-center mb-4">
                <Clock className="h-6 w-6 text-amber-600 mr-3" />
                <h3 className="text-lg font-medium text-gray-800">En proceso de revisión</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Nuestro equipo de analistas está revisando tu información para determinar las mejores condiciones para tu arrendamiento.
              </p>
              <div className="flex items-center">
                <CalendarClock className="h-5 w-5 text-amber-600 mr-2" />
                <p className="text-sm text-amber-700">
                  Respuesta estimada: <span className="font-semibold">{formattedDate}</span>
                </p>
              </div>
            </div>
          </div>
          
          {/* Qué sigue */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">¿Qué sigue?</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="mr-4 bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Análisis de solicitud</h3>
                  <p className="text-gray-600">Un analista especializado está evaluando tu solicitud para ofrecerte las mejores condiciones.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Notificación de resultado</h3>
                  <p className="text-gray-600">Recibirás un correo electrónico y una notificación en la plataforma cuando tengamos una respuesta.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Siguiente paso</h3>
                  <p className="text-gray-600">Dependiendo del resultado, te guiaremos para continuar con el proceso de arrendamiento.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contacto */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                ¿Tienes preguntas sobre tu solicitud?
              </h3>
              <p className="text-gray-600">Nuestro equipo está disponible para ayudarte de lunes a viernes de 9:00 a 18:00.</p>
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
              <Button variant="outline" className="flex items-center w-full justify-center">
                Volver al Dashboard
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 