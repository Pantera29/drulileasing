import React from 'react';
import { ConfirmationForm } from '@/components/application/forms/confirmation-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ConfirmationPage() {
  const supabase = createClient();
  
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
      redirect('/step/1');
    } else if (!application.contact_id) {
      redirect('/step/2');
    } else if (!application.financial_id) {
      redirect('/step/3');
    } else if (!application.equipment_id) {
      redirect('/step/4');
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
    
    const cookieStore = cookies();
    const supabase = createClient();
    
    try {
      console.log('Finalizando solicitud, datos recibidos:', JSON.stringify(data));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No hay sesión activa');
        return false;
      }
      
      // Obtener la aplicación actual
      const { data: application } = await supabase
        .from('credit_applications')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('application_status', 'incomplete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!application) {
        console.error('No se encontró una aplicación incompleta');
        return false;
      }
      
      console.log('Actualizando estado de la aplicación:', application.id);
      
      // Actualizar estado de la solicitud a "pending"
      // Ahora incluimos los campos credit_check_authorized y terms_accepted que ya existen en la tabla
      const { error: updateError } = await supabase
        .from('credit_applications')
        .update({
          application_status: 'pending',
          credit_check_authorized: data.creditCheckAuthorized,
          terms_accepted: data.termsAccepted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);
        
      if (updateError) {
        console.error('Error al finalizar la solicitud:', updateError);
        return false;
      }
      
      console.log('Solicitud finalizada exitosamente');
      return true;
    } catch (error) {
      console.error('Error al finalizar la solicitud:', error);
      return false;
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