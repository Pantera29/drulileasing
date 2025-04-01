import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Check, Clock, ChevronRight, Phone, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

interface ApprovedPageProps {
  params: {
    id: string;
  };
}

export default async function ApprovedResultPage({ params }: ApprovedPageProps) {
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
      approved_amount,
      approved_term,
      monthly_payment,
      external_provider,
      equipment_id,
      profile_id
    `)
    .eq('id', id)
    .single();
  
  // Si no existe la aplicación o no está aprobada, redirigir al dashboard
  if (error || !application || application.application_status !== 'approved') {
    console.error('Error al obtener la solicitud aprobada:', error);
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
    approximate_amount: application.approved_amount || 0
  };
  
  // Calcular la tasa de interés anual (simulada al 15%)
  const annualRate = 0.15;
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Banner de éxito */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full blur-3xl bg-white/20"></div>
          </div>
          <div className="relative flex items-center mb-4">
            <div className="bg-white/30 rounded-full p-2 mr-4">
              <Check className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">¡Felicidades, {profile.full_name}!</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl">
            Tu solicitud de arrendamiento ha sido aprobada. Estamos emocionados de ayudarte a obtener el equipo que necesitas.
          </p>
        </div>
        
        <div className="p-8">
          {/* Detalles del equipo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles del equipo aprobado</h2>
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
            </div>
          </div>
          
          {/* Términos financieros */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Términos financieros aprobados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 p-5 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium">Monto aprobado</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(application.approved_amount || 0)}</p>
              </div>
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">Plazo</p>
                <p className="text-2xl font-bold text-gray-800">{application.approved_term || 0} meses</p>
              </div>
              <div className="bg-indigo-50 p-5 rounded-lg border border-indigo-100">
                <p className="text-sm text-indigo-600 font-medium">Pago mensual</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(application.monthly_payment || 0)}</p>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
                <p className="text-sm text-purple-600 font-medium">Tasa anual</p>
                <p className="text-2xl font-bold text-gray-800">{(annualRate * 100).toFixed(2)}%</p>
              </div>
            </div>
          </div>
          
          {/* Próximos pasos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Próximos pasos</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="mr-4 bg-green-100 text-green-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Revisión de contrato</h3>
                  <p className="text-gray-600">Recibirás un contrato por correo electrónico en las próximas 24 horas.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 bg-blue-100 text-blue-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Firma electrónica</h3>
                  <p className="text-gray-600">Firma el contrato electrónicamente para continuar con el proceso.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 bg-purple-100 text-purple-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Entrega del equipo</h3>
                  <p className="text-gray-600">Coordinaremos la entrega e instalación del equipo en tu ubicación.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contacto */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium text-gray-800 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                ¿Tienes preguntas?
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
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
              Continuar con el proceso
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Link href="/dashboard" passHref>
              <Button size="lg" variant="outline">
                Volver al dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 