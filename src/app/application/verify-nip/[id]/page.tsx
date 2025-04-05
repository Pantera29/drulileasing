import React from 'react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NipForm } from '@/components/application/forms/nip-form';

export const metadata: Metadata = {
  title: 'Verificación de NIP | Druli',
  description: 'Verifica tu NIP para continuar con tu solicitud',
};

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';
// Indicar el runtime de Node.js
export const runtime = 'nodejs';

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
      .select('id, kiban_request_id, profile_id, contact_id')
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
      const validationResult = await kibanService.validateNip(
        appData.kiban_request_id,
        formData.nip
      );
      
      console.log('[DEBUG] validateNipWithId - Resultado validación NIP:', validationResult.isValid ? 'Válido' : 'Inválido');
      
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'El NIP ingresado no es válido. Intente nuevamente.'
        };
      }
      
      // Guardar el ID de validación que usaremos para la consulta al buró
      const validationId = validationResult.validationId;
      console.log('[DEBUG] validateNipWithId - ID de validación obtenido:', validationId);
      
      // Registrar la validación en la base de datos
      await kibanService.saveNipValidation(
        user.id,
        appData.id,
        appData.kiban_request_id,
        true,
        validationId
      );
      
      // Actualizar el campo nip_validated en la aplicación
      await supabase
        .from('credit_applications')
        .update({
          nip_validated: true,
          kiban_validation_id: validationId, // Guardar también el ID de validación
          updated_at: new Date().toISOString()
        })
        .eq('id', appData.id);
      
      // NUEVO FLUJO: Consultar buró de crédito antes de la evaluación
      
      try {
        // Obtener los datos del perfil del usuario para la consulta al buró
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('full_name, curp_rfc')
          .eq('id', appData.profile_id)
          .single();
          
        if (profileError || !profile) {
          console.error('[ERROR] validateNipWithId - Error al obtener perfil:', profileError);
          throw new Error('No se pudo obtener la información del perfil');
        }
        
        // Obtener la dirección del usuario
        const { data: address, error: addressError } = await supabase
          .from('contact_info')
          .select('street, street_number, neighborhood, city, state, zip_code')
          .eq('id', appData.contact_id)
          .single();
          
        if (addressError || !address) {
          console.error('[ERROR] validateNipWithId - Error al obtener dirección:', addressError);
          throw new Error('No se pudo obtener la información de dirección');
        }
        
        // Formatear la dirección completa como un string
        const fullAddress = `${address.street} ${address.street_number}, ${address.neighborhood}, ${address.city}, ${address.state}`;
        
        // Dividir el nombre completo en partes
        const nameParts = profile.full_name.trim().split(' ');
        let firstName = nameParts[0] || '';
        let secondName = '';
        let paternalLastName = '';
        let maternalLastName = '';
        
        // Si hay más de 2 partes, asumimos que hay al menos un apellido
        if (nameParts.length >= 3) {
          firstName = nameParts[0];
          secondName = nameParts[1];
          paternalLastName = nameParts[2];
          if (nameParts.length >= 4) {
            maternalLastName = nameParts[3];
          }
        } else if (nameParts.length === 2) {
          // Si solo hay 2 partes, asumimos nombre y apellido
          firstName = nameParts[0];
          paternalLastName = nameParts[1];
        }
        
        try {
          // Consultar al buró de crédito usando el ID de validación (NO el request_id)
          const bureauResponse = await kibanService.queryCreditBureau(
            // El ID de validación obtenido durante la validación del NIP
            validationId || 'invalid-id', // Si no hay ID de validación, fallaremos con un ID inválido
            {
              firstName,
              secondName,
              paternalLastName,
              maternalLastName,
              rfc: profile.curp_rfc,
              address: {
                street: fullAddress,
                zipCode: address.zip_code || '00000'
              }
            }
          );
          
          // Guardar la respuesta del buró en la base de datos
          await supabase
            .from('credit_applications')
            .update({
              credit_bureau_response: bureauResponse,
              credit_bureau_queried_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', appData.id);
            
          console.log('[DEBUG] validateNipWithId - Consulta al buró exitosa:', bureauResponse.id);
          
          // Procesar y guardar los datos extraídos del buró
          try {
            await kibanService.processCreditBureauData(
              user.id,
              appData.id,
              bureauResponse
            );
            console.log('[DEBUG] validateNipWithId - Datos del buró procesados y guardados correctamente');
          } catch (processingError) {
            console.error('[ERROR] validateNipWithId - Error al procesar datos del buró:', processingError);
            // No interrumpimos el flujo principal por un error en el procesamiento
          }
          
        } catch (bureauApiError: any) {
          // Capturar el error específico de la consulta al buró
          console.error('[ERROR] validateNipWithId - Error en consulta al buró API:', bureauApiError);
          
          // Registrar el error en la base de datos para diagnóstico
          await supabase
            .from('credit_applications')
            .update({
              credit_bureau_response: { error: bureauApiError.message || 'Error desconocido en consulta al buró' },
              credit_bureau_queried_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', appData.id);
            
          // No interrumpimos el flujo por este error
          console.log('[INFO] validateNipWithId - Continuando a pesar del error en consulta al buró');
        }
        
      } catch (bureauError) {
        console.error('[ERROR] validateNipWithId - Error general en consulta al buró:', bureauError);
        // No detenemos el flujo por errores en la consulta al buró por ahora
        // En una implementación real, podríamos manejar esto de manera diferente
      }
      
      // AHORA SÍ: Iniciar la evaluación de crédito después de la consulta al buró
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
          case 'pending_analysis':
            redirectTo = `/result/analysis/${appData.id}`;
            break;
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