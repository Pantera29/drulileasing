import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ArrowRight, HelpCircle, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

interface RejectedPageProps {
  params: {
    id: string;
  };
}

export default async function RejectedResultPage({ params }: RejectedPageProps) {
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
      rejection_reason,
      equipment_id,
      profile_id
    `)
    .eq('id', id)
    .single();
  
  // Si no existe la aplicación o no está rechazada, redirigir al dashboard
  if (error || !application || application.application_status !== 'rejected') {
    console.error('Error al obtener la solicitud rechazada:', error);
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
    desired_term: 24
  };
  
  // Motivo de rechazo por defecto si no hay uno específico
  const rejectionReason = application.rejection_reason || 
    'No se cumplieron los requisitos mínimos para la aprobación de la solicitud en este momento.';
  
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Banner de resultado */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-800 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-5 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full blur-3xl bg-white/10"></div>
          </div>
          <div className="relative flex items-center mb-4">
            <div className="bg-white/20 rounded-full p-2 mr-4">
              <XCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">Solicitud no aprobada</h1>
          </div>
          <p className="text-xl opacity-90 max-w-2xl">
            Lamentamos informarte que no hemos podido aprobar tu solicitud de arrendamiento en este momento. Esto no significa que no puedas obtener financiamiento en el futuro.
          </p>
        </div>
        
        <div className="p-8">
          {/* Razón del resultado */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">¿Por qué no fue aprobada?</h2>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <p className="text-gray-700">
                {rejectionReason}
              </p>
            </div>
          </div>
          
          {/* Alternativas y sugerencias */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Alternativas que puedes considerar</h2>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-blue-100 flex">
                <div className="mr-4 text-blue-500">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Solicitar un equipo de menor valor</h3>
                  <p className="text-gray-600">
                    Podrías considerar un equipo con características similares pero de menor costo, 
                    lo que aumentaría tus posibilidades de aprobación.
                  </p>
                  <Link href="/application/step/1" className="text-blue-600 hover:underline flex items-center mt-2 text-sm font-medium">
                    Iniciar nueva solicitud
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-blue-100 flex">
                <div className="mr-4 text-blue-500">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Aumentar el plazo de arrendamiento</h3>
                  <p className="text-gray-600">
                    Extender el plazo del arrendamiento puede reducir la carga mensual 
                    y facilitar la aprobación de tu solicitud.
                  </p>
                  <Link href="/application/step/1" className="text-blue-600 hover:underline flex items-center mt-2 text-sm font-medium">
                    Intentar con otro plazo
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-blue-100 flex">
                <div className="mr-4 text-blue-500">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800 mb-1">Agregar un co-arrendatario</h3>
                  <p className="text-gray-600">
                    Incluir a otra persona con ingresos complementarios puede mejorar 
                    significativamente tus posibilidades de aprobación.
                  </p>
                  <Link href="/contact" className="text-blue-600 hover:underline flex items-center mt-2 text-sm font-medium">
                    Consultar esta opción
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Resumen de la solicitud original */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalles de tu solicitud</h2>
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Equipo solicitado</p>
                  <p className="text-lg font-bold text-gray-800">{equipment.equipment_type}</p>
                  <p className="text-sm text-slate-500">Modelo: {equipment.equipment_model}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Monto solicitado</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(equipment.approximate_amount)}</p>
                  <p className="text-sm text-slate-500">Plazo: {equipment.desired_term} meses</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Consultas y soporte */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">¿Tienes preguntas?</h2>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 flex flex-col md:flex-row items-start md:items-center">
              <div className="mb-4 md:mb-0 md:mr-6 flex-grow">
                <div className="flex items-center mb-2">
                  <HelpCircle className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="font-medium text-gray-800">Habla con nuestros asesores</h3>
                </div>
                <p className="text-gray-600">
                  Nuestros especialistas pueden ayudarte a entender el resultado 
                  y explorar otras opciones que podrían funcionar para ti.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline">
                  Agendar llamada
                </Button>
                <Button>
                  Chat en línea
                </Button>
              </div>
            </div>
          </div>
          
          {/* Próximos pasos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cómo mejorar para el futuro</h2>
            <div className="space-y-4">
              <div className="flex">
                <div className="mr-4 bg-slate-100 text-slate-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Revisa tu historial crediticio</h3>
                  <p className="text-gray-600">Verifica que no existan errores en tu reporte de crédito y trabaja en mejorar tu puntuación.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 bg-slate-100 text-slate-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Aumenta tus ingresos demostrables</h3>
                  <p className="text-gray-600">Si es posible, busca formas de incrementar tus ingresos o asegúrate de que sean formalmente verificables.</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="mr-4 bg-slate-100 text-slate-600 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Reduce otras deudas</h3>
                  <p className="text-gray-600">Disminuir tus compromisos financieros actuales puede mejorar significativamente tu capacidad de pago.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/application/step/1" passHref>
              <Button size="lg" className="w-full sm:w-auto">
                Intentar con otro equipo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            
            <Link href="/dashboard" passHref>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Volver al dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 