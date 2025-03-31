import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';

// Indicar a Next.js que este es un componente de servidor
export const runtime = 'nodejs';

// Esta función asegura que se genere un client-reference-manifest válido
export const generateMetadata = async () => {
  return {
    title: 'Aplicación de Financiamiento',
    description: 'Solicita financiamiento para tu equipo médico'
  };
};

export default function ApplicationPage() {
  // Redirigir a la primera página del proceso de solicitud
  redirect('/step/1');
} 