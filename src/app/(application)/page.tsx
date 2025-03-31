import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ApplicationPage() {
  console.log('Iniciando ApplicationPage');
  const supabase = await createClient();
  
  console.log('Verificando sesión en ApplicationPage...');
  const { data: { session } } = await supabase.auth.getSession();
  
  // Si no hay sesión, no debería llegar aquí (middleware debe redirigir)
  // pero por si acaso
  if (!session) {
    console.log('No hay sesión, redirigiendo a login desde ApplicationPage');
    redirect('/login?error=no_session');
  }
  
  console.log('Verificando si el usuario ya tiene una solicitud incompleta...');
  
  // Verificamos si el usuario ya tiene una solicitud incompleta
  const { data: existingApplications, error: appError } = await supabase
    .from('credit_applications')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('application_status', 'incomplete')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (appError) {
    console.error('Error al verificar solicitudes existentes:', appError);
    // En caso de error, es mejor continuar y crear una nueva
    // pero dejamos registro del error
  }
  
  // Si hay una solicitud incompleta, redirigir al primer paso
  if (existingApplications && existingApplications.length > 0) {
    console.log('Usuario tiene una solicitud incompleta, redirigiendo al paso 1');
    redirect('/step/1');
  }
  
  console.log('Creando nueva solicitud para el usuario:', session.user.id);
  
  // Si llegamos aquí, el usuario no tiene solicitudes incompletas
  // Creamos una nueva solicitud de crédito
  const { data: newApplication, error: createError } = await supabase
    .from('credit_applications')
    .insert({
      user_id: session.user.id,
      application_status: 'incomplete',
    })
    .select('id')
    .single();
  
  if (createError) {
    console.error('Error al crear nueva solicitud:', createError);
    throw new Error('No se pudo crear la solicitud. Por favor intenta nuevamente.');
  }
  
  console.log('Solicitud creada correctamente, redirigiendo al paso 1');
  
  // Redirigir al primer paso del proceso
  redirect('/step/1');
} 