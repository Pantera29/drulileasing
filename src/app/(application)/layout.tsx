import React from 'react';
import { ApplicationLayout } from '@/components/application/layout/application-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    console.log('Inicializando layout de application');
    const supabase = createClient();
    
    // Verificar si el usuario está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error al obtener la sesión en layout application:', 
        sessionError.message, 
        sessionError.cause, 
        sessionError.stack
      );
      redirect('/login?error=session');
    }
    
    // Si no hay sesión, redirigir a inicio de sesión
    if (!session) {
      console.log('No hay sesión de usuario en layout application');
      redirect('/login?error=no_session');
    }
    
    console.log('Usuario autenticado en layout application:', session.user.id);
    
    return (
      <ApplicationLayout>
        {children}
      </ApplicationLayout>
    );
  } catch (error) {
    console.error('Error inesperado en layout application:', 
      error instanceof Error ? error.message : error,
      error instanceof Error ? error.stack : ''
    );
    redirect('/login?error=unexpected');
  }
} 