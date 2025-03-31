import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ApplicationHomePage() {
  const supabase = createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Verificar si el usuario tiene una solicitud incompleta
  const { data: incompleteApplication } = await supabase
    .from('credit_applications')
    .select('id, created_at, updated_at')
    .eq('user_id', session.user.id)
    .eq('application_status', 'incomplete')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
    
  // Si hay una solicitud incompleta, redirigir al último paso conocido
  if (incompleteApplication) {
    // Verificar en qué paso se quedó
    const steps = [
      { table: 'profiles', id_field: 'profile_id' },
      { table: 'contact_info', id_field: 'contact_id' },
      { table: 'financial_info', id_field: 'financial_id' },
      { table: 'equipment_requests', id_field: 'equipment_id' }
    ];
    
    const { data: application } = await supabase
      .from('credit_applications')
      .select('profile_id, contact_id, financial_id, equipment_id')
      .eq('id', incompleteApplication.id)
      .single();
      
    // Determinar el último paso completado
    let lastCompletedStep = 0;
    for (let i = 0; i < steps.length; i++) {
      const field = steps[i].id_field as keyof typeof application;
      if (application && application[field]) {
        lastCompletedStep = i + 1;
      } else {
        break;
      }
    }
    
    // Redirigir al siguiente paso después del último completado
    const nextStep = lastCompletedStep + 1;
    if (nextStep <= 5) {
      redirect(`/step/${nextStep}`);
    } else {
      redirect('/step/5'); // Si todos están completos, ir a la confirmación
    }
  } else {
    // Crear una nueva solicitud de crédito
    const { data: newApplication, error } = await supabase
      .from('credit_applications')
      .insert({
        user_id: session.user.id,
        application_status: 'incomplete'
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('Error al crear una nueva solicitud:', error);
      throw new Error('No se pudo iniciar una nueva solicitud de crédito');
    }
    
    // Redirigir al primer paso
    redirect('/step/1');
  }
  
  // Esta parte no debería ejecutarse debido a las redirecciones anteriores
  return null;
} 