import React from 'react';
import { ApplicationLayout } from '@/components/application/layout/application-layout';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';
// Indicar el runtime de Node.js
export const runtime = 'nodejs';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    console.log('Inicializando layout de application (sin paréntesis)');
    const supabase = await createClient();
    
    // Verificar si el usuario está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error al obtener la sesión:', sessionError.message);
      redirect('/login?error=session');
    }
    
    // Si no hay sesión, redirigir a inicio de sesión
    if (!session) {
      console.log('No hay sesión de usuario');
      redirect('/login?error=no_session');
    }
    
    console.log('Usuario autenticado:', session.user.id);
    
    return (
      <ApplicationLayout>
        {children}
      </ApplicationLayout>
    );
  } catch (error) {
    console.error('Error inesperado:', error);
    redirect('/login?error=unexpected');
  }
} 