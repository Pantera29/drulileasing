import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Obtener todas las aplicaciones sin filtrar por usuario
    const { data: applications, error } = await supabase
      .from('credit_applications')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error('Error al obtener aplicaciones:', error);
      return NextResponse.json({ error: 'Error al obtener aplicaciones' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Aplicaciones encontradas', 
      count: applications ? applications.length : 0,
      applications: applications || []
    });
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
} 