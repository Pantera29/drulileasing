import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NipForm } from '@/components/application/forms/nip-form';

export const metadata: Metadata = {
  title: 'Verificación de NIP | Crédito Druli',
  description: 'Ingresa el NIP que te enviamos por WhatsApp para verificar tu identidad',
};

export default async function VerifyNipPage({ params }: { params: { id: string }}) {
  console.log('Inicializando VerifyNipPage para aplicación:', params.id);
  const supabase = await createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener la aplicación por ID
  const { data: application, error } = await supabase
    .from('credit_applications')
    .select('id, user_id, application_status, kiban_request_id, nip_validated, contact_id')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();
    
  if (error || !application) {
    console.error('Error al obtener la aplicación:', error);
    redirect('/dashboard');
  }
  
  // Si la aplicación ya tiene NIP validado, redirigir al resultado correspondiente
  if (application.nip_validated) {
    switch (application.application_status) {
      case 'approved':
        redirect(`/result/approved/${application.id}`);
        break;
      case 'in_review':
        redirect(`/result/reviewing/${application.id}`);
        break;
      case 'rejected':
        redirect(`/result/rejected/${application.id}`);
        break;
      default:
        redirect('/dashboard');
    }
  }
  
  // Si no tiene un kiban_request_id, redirigir a la página de confirmación
  if (!application.kiban_request_id) {
    redirect(`/application/step/5`);
  }
  
  // Obtener información de contacto para mostrar parcialmente el número de teléfono
  const { data: contactInfo } = await supabase
    .from('contact_info')
    .select('mobile_phone')
    .eq('id', application.contact_id)
    .single();
    
  const phoneNumber = contactInfo?.mobile_phone || '';
  
  // Crear la función para validar el NIP con el ID de la aplicación cerrado en su ámbito
  const validateNipWithId = async (formData: { nip: string }) => {
    'use server';
    
    // Utilizamos el ID que viene como parámetro en la URL
    const applicationId = params.id;
    console.log('[DEBUG] validateNipWithId - ID de aplicación:', applicationId);
    console.log('[DEBUG] validateNipWithId - Tipo de ID:', typeof applicationId);
    
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[ERROR] validateNipWithId - Error de autenticación:', userError);
      return {
        success: false,
        message: 'Usuario no autenticado'
      };
    }
    
    console.log('[DEBUG] validateNipWithId - Usuario autenticado:', user.id);
    
    // Obtener la aplicación - probar sin el filtro de user_id primero para diagnosticar
    console.log('[DEBUG] validateNipWithId - Consultando aplicación con ID:', applicationId);
    
    const { data: directAppQuery, error: directQueryError } = await supabase
      .from('credit_applications')
      .select('id, kiban_request_id')
      .eq('id', applicationId)
      .single();
      
    console.log('[DEBUG] validateNipWithId - Resultado consulta directa:', 
      directAppQuery ? 'Encontrado' : 'No encontrado', 
      'Error:', directQueryError ? directQueryError.message : 'Ninguno',
      'kiban_request_id:', directAppQuery?.kiban_request_id);
      
    // Ahora intentamos la consulta original con filtro de usuario
    const { data: appData, error: appError } = await supabase
      .from('credit_applications')
      .select('id, kiban_request_id')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single();
      
    console.log('[DEBUG] validateNipWithId - Resultado consulta con filtro de usuario:', 
      appData ? 'Encontrado' : 'No encontrado', 
      'Error:', appError ? appError.message : 'Ninguno',
      'kiban_request_id:', appData?.kiban_request_id);
      
    if (appError || !appData || !appData.kiban_request_id) {
      console.error('[ERROR] validateNipWithId - Error o aplicación no encontrada:', appError);
      console.error('[ERROR] validateNipWithId - appData:', appData);
      return {
        success: false,
        message: 'No se encontró la solicitud o no se ha enviado el NIP'
      };
    }
    
    try {
      console.log('[DEBUG] validateNipWithId - Iniciando validación de NIP con Kiban, requestId:', appData.kiban_request_id);
      
      // Importar el servicio de Kiban (debe hacerse dinámicamente en una acción del servidor)
      const { KibanService } = await import('@/lib/services/kiban/kiban.service');
      const kibanService = new KibanService();
      
      // Validar el NIP con Kiban
      const isValid = await kibanService.validateNip(
        appData.kiban_request_id,
        formData.nip
      );
      
      console.log('[DEBUG] validateNipWithId - Resultado validación NIP:', isValid ? 'Válido' : 'Inválido');
      
      if (!isValid) {
        return {
          success: false,
          message: 'El NIP ingresado no es válido. Intente nuevamente.'
        };
      }
      
      // Registrar la validación en la base de datos
      await kibanService.saveNipValidation(
        user.id,
        appData.id,
        appData.kiban_request_id,
        true
      );
      
      // Actualizar el campo nip_validated en la aplicación
      await supabase
        .from('credit_applications')
        .update({
          nip_validated: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', appData.id);
      
      // Iniciar la evaluación de crédito
      const { evaluateApplication } = await import('@/lib/services/credit-evaluation');
      await evaluateApplication(appData.id);
      
      // Obtener el estado actualizado para determinar redirección
      const { data: updatedApp } = await supabase
        .from('credit_applications')
        .select('application_status')
        .eq('id', appData.id)
        .single();
        
      // Determinar URL de redirección según el estado
      let redirectTo = '/dashboard';
      
      if (updatedApp) {
        switch (updatedApp.application_status) {
          case 'approved':
            redirectTo = `/result/approved/${appData.id}`;
            break;
          case 'in_review':
            redirectTo = `/result/reviewing/${appData.id}`;
            break;
          case 'rejected':
            redirectTo = `/result/rejected/${appData.id}`;
            break;
        }
      }
      
      return {
        success: true,
        redirectTo,
        message: 'NIP validado correctamente'
      };
    } catch (error) {
      console.error('Error al validar NIP:', error);
      return {
        success: false,
        message: 'Ocurrió un error durante la validación. Intente nuevamente.'
      };
    }
  };
  
  // Modificar la función del formulario NipForm para incluir posibilidad de reenvío
  const resendNip = async () => {
    'use server';
    
    console.log('[DEBUG] resendNip - Intentando reenviar NIP para aplicación:', params.id);
    
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[ERROR] resendNip - Error de autenticación:', userError);
      return {
        success: false,
        message: 'Usuario no autenticado para reenviar NIP'
      };
    }
    
    // Obtener la aplicación
    const { data: app, error: appError } = await supabase
      .from('credit_applications')
      .select('id, contact_id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();
      
    if (appError || !app) {
      console.error('[ERROR] resendNip - Error al obtener aplicación:', appError);
      return {
        success: false,
        message: 'No se pudo encontrar la solicitud para reenviar el NIP'
      };
    }
    
    // Obtener información de contacto
    const { data: contactInfo, error: contactError } = await supabase
      .from('contact_info')
      .select('mobile_phone')
      .eq('id', app.contact_id)
      .single();
      
    if (contactError || !contactInfo?.mobile_phone) {
      console.error('[ERROR] resendNip - Error al obtener contacto:', contactError);
      return {
        success: false,
        message: 'No se pudo obtener el número de teléfono para reenviar el NIP'
      };
    }
    
    try {
      // Importar el servicio Kiban
      const { KibanService } = await import('@/lib/services/kiban/kiban.service');
      const kibanService = new KibanService();
      
      // Enviar NIP al teléfono del usuario
      const kibanRequestId = await kibanService.sendNip(contactInfo.mobile_phone);
      console.log('[DEBUG] resendNip - NIP enviado con éxito, nuevo kibanRequestId:', kibanRequestId);
      
      // Registrar ID de solicitud de Kiban en la aplicación
      await supabase
        .from('credit_applications')
        .update({
          kiban_request_id: kibanRequestId,
          application_status: 'pending_nip',
          updated_at: new Date().toISOString(),
        })
        .eq('id', app.id);
        
      return {
        success: true,
        message: 'Código reenviado correctamente',
        kibanRequestId
      };
    } catch (error) {
      console.error('[ERROR] resendNip - Error al reenviar NIP:', error);
      return {
        success: false,
        message: 'Error al reenviar el código. Por favor, intente nuevamente.'
      };
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Indicador de proceso en lugar del stepper */}
      <div className="mb-6 flex justify-center">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
          </svg>
          Paso adicional: Verificación de seguridad
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-center">Verificación de identidad</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="mb-4 text-center">
          Te hemos enviado un código de verificación de 6 dígitos por WhatsApp al número 
          <strong> {phoneNumber.substring(0, 2)}****{phoneNumber.substring(phoneNumber.length - 2)}</strong>.
        </p>
        
        <NipForm 
          onSubmit={validateNipWithId} 
          applicationId={application.id} 
          kibanRequestId={application.kiban_request_id}
          onResendNip={resendNip}
        />
      </div>
    </div>
  );
} 