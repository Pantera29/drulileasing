import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default function ApplicationPage() {
  // Redirigir a la primera página del proceso de solicitud
  redirect('/step/1');
} 