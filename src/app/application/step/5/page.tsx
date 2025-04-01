import React from 'react';
import { ConfirmationForm } from '@/components/application/forms/confirmation-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { evaluateAndRedirect, evaluateApplication } from '@/lib/services/credit-evaluation/actions';

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
    
    console.log('Finalizando aplicación');
    const supabase = await createClient();
    
    try {
      console.log('Finalizando solicitud, datos recibidos:', JSON.stringify(data));
      
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
        .select('id, application_status')
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
      // En este caso, enviamos información al cliente sobre dónde debería redireccionar
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
      
      // Almacenar el ID de la aplicación para usarlo después
      const applicationId = application.id;
      
      // Actualizar el estado de la aplicación a 'pending' y registrar la autorización
      const { error: updateError } = await supabase
        .from('credit_applications')
        .update({
          application_status: 'pending',
          credit_check_authorized: data.creditCheckAuthorized,
          terms_accepted: data.termsAccepted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);
      
      if (updateError) {
        console.error('Error al actualizar el estado de la aplicación:', updateError);
        return {
          success: false,
          redirectTo: null,
          message: 'Error al actualizar la aplicación'
        };
      }
      
      console.log('Aplicación actualizada correctamente a estado pending');
      
      try {
        // Iniciar el proceso de evaluación de crédito
        await evaluateApplication(applicationId);
        
        // Obtener el nuevo estado después de la evaluación
        const { data: updatedApp } = await supabase
          .from('credit_applications')
          .select('application_status')
          .eq('id', applicationId)
          .single();
        
        // Construir la URL de redirección según el nuevo estado
        let redirectUrl = '/dashboard'; // Valor por defecto
        
        if (updatedApp) {
          switch (updatedApp.application_status) {
            case 'approved':
              redirectUrl = `/result/approved/${applicationId}`;
              break;
            case 'in_review':
              redirectUrl = `/result/reviewing/${applicationId}`;
              break;
            case 'rejected':
              redirectUrl = `/result/rejected/${applicationId}`;
              break;
          }
        }
        
        // Devolver información para que el cliente maneje la redirección
        return {
          success: true,
          redirectTo: redirectUrl,
          message: updatedApp ? `Aplicación evaluada con estado: ${updatedApp.application_status}` : 'Aplicación procesada'
        };
      } catch (evaluationError) {
        console.error('Error durante la evaluación de crédito:', evaluationError);
        // Incluso con error, devolvemos true con redirección al dashboard
        return {
          success: true,
          redirectTo: '/dashboard',
          message: 'Error en evaluación, pero la solicitud se completó'
        };
      }
    } catch (error) {
      console.error('Error inesperado al finalizar la solicitud:', error);
      return {
        success: false,
        redirectTo: null,
        message: 'Error interno del servidor'
      };
    }
  }
  
  return (
    <div>
      <ConfirmationForm 
        summaryData={summaryData}
        onSubmit={finishApplication}
        applicationId={application.id}
      />
    </div>
  );
} 