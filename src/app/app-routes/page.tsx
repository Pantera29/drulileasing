import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AppRoutesPage() {
  // Redirigir a la primera página del proceso de solicitud
  redirect('/step/1');
}
