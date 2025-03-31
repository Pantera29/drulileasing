import { redirect } from 'next/navigation';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';
// Indicar el runtime de Node.js
export const runtime = 'nodejs';

// Esta función es para generar metadatos y asegurar la generación del manifest
export const generateMetadata = async () => {
  return {
    title: 'Aplicación de Financiamiento',
    description: 'Proceso de solicitud de financiamiento'
  };
};

export default function ApplicationPage() {
  // Simplemente redirigir al primer paso
  redirect('/step/1');
} 