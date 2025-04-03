import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Obtener todas las aplicaciones
    const { data: applications, error } = await supabase
      .from('credit_applications')
      .select('id, application_status, kiban_request_id, nip_validated, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
      
    if (error) {
      console.error('Error al obtener aplicaciones:', error);
      return NextResponse.json({ error: 'Error al obtener aplicaciones' }, { status: 500 });
    }
    
    if (!applications || applications.length === 0) {
      return NextResponse.json({ message: 'No se encontraron aplicaciones' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Aplicaciones encontradas', 
      count: applications.length,
      applications 
    });
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
} 