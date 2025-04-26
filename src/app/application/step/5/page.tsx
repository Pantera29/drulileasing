import React from 'react';
import { ConfirmationForm } from '@/components/application/forms/confirmation-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { evaluateApplication } from '@/lib/services/credit-evaluation';
import { Metadata } from 'next';
import { StepLayout } from '@/components/application/step-layout';
import { BUREAU_CONFIG } from '@/lib/services/bureau/config';

export const metadata: Metadata = {
  title: 'Confirmación de solicitud | Crédito Druli',
  description: 'Revisa y confirma tu solicitud de crédito para equipamiento deportivo',
};

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';
// Indicar el runtime de Node.js
export const runtime = 'nodejs';

export default async function ConfirmationPage() {
  console.log('Inicializando ConfirmationPage');
  const supabase = await createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener la aplicación actual
  const { data: application } = await supabase
    .from('credit_applications')
    .select('id, profile_id, contact_id, financial_id, equipment_id')
    .eq('user_id', session.user.id)
    .eq('application_status', 'incomplete')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!application) {
    // Si no hay aplicación, redirigir a la página principal para crear una
    redirect('/');
  }
  
  // Verificar que todos los pasos anteriores estén completos
  if (!application.profile_id || !application.contact_id || !application.financial_id || !application.equipment_id) {
    // Redirigir al primer paso incompleto
    if (!application.profile_id) {
      redirect('/application/step/1');
    } else if (!application.contact_id) {
      redirect('/application/step/2');
    } else if (!application.financial_id) {
      redirect('/application/step/3');
    } else if (!application.equipment_id) {
      redirect('/application/step/4');
    }
  }
  
  // Obtener todos los datos para mostrar en el resumen
  const [profileResult, contactResult, financialResult, equipmentResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single(),
    supabase
      .from('contact_info')
      .select('*')
      .eq('id', application.contact_id)
      .single(),
    supabase
      .from('financial_info')
      .select('*')
      .eq('id', application.financial_id)
      .single(),
    supabase
      .from('equipment_requests')
      .select('*')
      .eq('id', application.equipment_id)
      .single()
  ]);
  
  // Preparar datos para el resumen
  const summaryData = {
    profile: profileResult.data,
    contact: contactResult.data,
    financial: financialResult.data,
    equipment: equipmentResult.data,
  };
  
  // Función para finalizar la solicitud
  async function finishApplication(data: { 
    creditCheckAuthorized: boolean; 
    termsAccepted: boolean;
  }) {
    'use server';
    
    console.log('Finalizando aplicación con datos:', JSON.stringify(data));
    const supabase = await createClient();
    
    try {
      // Verificar autenticación con getUser() por seguridad
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Error de autenticación al finalizar la solicitud:', authError);
        return {
          success: false,
          redirectTo: null,
          message: 'Error de autenticación'
        };
      }
      
      console.log('Usuario autenticado:', user.id);
      
      // Obtener la aplicación más reciente del usuario
      const { data: application, error: fetchError } = await supabase
        .from('credit_applications')
        .select('id, application_status, kiban_request_id, nip_validated, contact_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (fetchError || !application) {
        console.error('Error al obtener la aplicación actual:', fetchError);
        return {
          success: false,
          redirectTo: null,
          message: 'No se encontró la aplicación'
        };
      }
      
      console.log('Aplicación encontrada:', application.id, 'Estado actual:', application.application_status);
      
      // Si la aplicación ya no está en estado incompleto, probablemente ya fue procesada
      if (application.application_status !== 'incomplete') {
        console.log('La aplicación ya no está en estado incompleto, informando al cliente sobre redirección:', application.application_status);
        
        // Construir la URL de redirección según el estado
        let redirectUrl;
        switch (application.application_status) {
          case 'approved':
            redirectUrl = `/result/approved/${application.id}`;
            break;
          case 'in_review':
            redirectUrl = `/result/reviewing/${application.id}`;
            break;
          case 'rejected':
            redirectUrl = `/result/rejected/${application.id}`;
            break;
          case 'pending_nip':
            redirectUrl = `/application/verify-nip/${application.id}`;
            break;
          default:
            redirectUrl = '/dashboard';
        }
        
        // Devolver la información para que el cliente maneje la redirección
        return {
          success: true,
          redirectTo: redirectUrl,
          message: `Aplicación ya procesada con estado: ${application.application_status}`
        };
      }
      
      // Si ya tiene un kiban_request_id pero no ha sido validado, redirigir a la página de validación
      if (application.kiban_request_id && !application.nip_validated) {
        console.log('Aplicación con kiban_request_id sin validar, redirigiendo a verificación');
        return {
          success: true,
          redirectTo: `/application/verify-nip/${application.id}`,
          message: 'Código ya enviado, redirigiendo a verificación'
        };
      }
      
      // Almacenar el ID de la aplicación para usarlo después
      const applicationId = application.id;
      
      console.log('Actualizando aplicación ID:', applicationId, 'a estado pending_nip');
      
      // IMPORTANTE: Actualizamos el estado de la aplicación a "pending_nip" aquí en el paso 5
      // cuando el usuario acepta los términos y condiciones y autoriza la consulta al buró.
      // Esto debe hacerse antes de enviar el NIP y no en la función evaluateApplication.
      console.log('Actualizando application_status a pending_nip antes de enviar NIP...');
      
      // Primera verificación del estado actual
      const { data: priorState } = await supabase
        .from('credit_applications')
        .select('application_status')
        .eq('id', applicationId)
        .single();
        
      console.log('Estado actual antes del cambio:', priorState?.application_status);
      
      // Actualizar explícitamente solo el estado
      const { error: statusUpdateError } = await supabase
        .from('credit_applications')
        .update({ 
          application_status: 'pending_nip',
          credit_check_authorized: data.creditCheckAuthorized,
          terms_accepted: data.termsAccepted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
        
      if (statusUpdateError) {
        console.error('Error al actualizar estado a pending_nip:', statusUpdateError);
        return {
          success: false,
          redirectTo: null,
          message: 'Error al actualizar el estado de la solicitud'
        };
      }
      
      // Segunda verificación para confirmar el cambio
      const { data: afterUpdate } = await supabase
        .from('credit_applications')
        .select('application_status')
        .eq('id', applicationId)
        .single();
        
      console.log('Estado después de la primera actualización:', afterUpdate?.application_status);
      
      // Obtener información de contacto para enviar el NIP
      const { data: contactInfo, error: contactError } = await supabase
        .from('contact_info')
        .select('mobile_phone')
        .eq('id', application.contact_id)
        .single();
        
      if (contactError || !contactInfo) {
        console.error('Error al obtener información de contacto:', contactError);
        return {
          success: false,
          redirectTo: null,
          message: 'No se pudo obtener el número de teléfono para enviar el código'
        };
      }
      
      // Importar y usar el servicio del buró para enviar el NIP
      try {
        // SEGUNDO: Enviar el NIP
        const { BureauService } = await import('@/lib/services/bureau/bureau.service');
        const bureauService = new BureauService();
        
        // Enviar NIP al teléfono del usuario
        const response = await bureauService.sendNip(contactInfo.mobile_phone);
        
        // Determinar el campo a actualizar según el proveedor activo
        const updateData = BUREAU_CONFIG.activeProvider === 'kiban' 
          ? { kiban_request_id: response.requestId }
          : { 
              external_request_id: response.requestId,
              external_provider: BUREAU_CONFIG.activeProvider 
            };
        
        // Registrar ID de solicitud en la aplicación (sin cambiar el estado que ya actualizamos)
        await supabase
          .from('credit_applications')
          .update({
            ...updateData,
            updated_at: new Date().toISOString()
          })
          .eq('id', applicationId);

        // Redirigir a la página de verificación de NIP
        return {
          success: true,
          redirectTo: `/application/verify-nip/${applicationId}`,
          message: 'Código enviado correctamente'
        };
      } catch (error) {
        console.error('Error al enviar NIP:', error);
        return {
          success: false,
          redirectTo: null,
          message: 'Error al enviar el código de verificación'
        };
      }
    } catch (error) {
      console.error('Error general al finalizar solicitud:', error);
      return {
        success: false,
        redirectTo: null,
        message: 'Ocurrió un error inesperado. Intente nuevamente.'
      };
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Título y descripción */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Confirma tu solicitud</h1>
        <p className="text-gray-600">Revisa los detalles y finaliza tu solicitud</p>
      </div>
      
      {/* Contenido */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <ConfirmationForm 
          summaryData={summaryData} 
          onSubmit={finishApplication} 
          applicationId={application.id} 
        />
      </div>
    </div>
  );
} 