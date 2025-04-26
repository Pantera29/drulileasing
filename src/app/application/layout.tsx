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
    
    // Verificar si el usuario está autenticado usando getUser
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Error al obtener el usuario:', authError.message);
      redirect('/login?error=auth_error');
    }
    
    // Si no hay usuario, redirigir a inicio de sesión
    if (!user) {
      console.log('No hay usuario autenticado');
      redirect('/login?error=no_user');
    }
    
    console.log('Usuario autenticado:', user.id);
    
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