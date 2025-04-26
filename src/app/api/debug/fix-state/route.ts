import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Se requiere un ID de aplicación' }, { status: 400 });
  }
  
  try {
    const supabase = await createClient();
    
    // Obtener el estado actual de la aplicación
    const { data: application, error } = await supabase
      .from('credit_applications')
      .select('id, application_status, kiban_request_id, nip_validated')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error al obtener aplicación:', error);
      return NextResponse.json({ error: 'Error al obtener aplicación' }, { status: 500 });
    }
    
    if (!application) {
      return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });
    }
    
    // Si está en pending_nip pero no tiene kiban_request_id, volver a incomplete
    if (application.application_status === 'pending_nip' && !application.kiban_request_id) {
      const { error: updateError } = await supabase
        .from('credit_applications')
        .update({ 
          application_status: 'incomplete',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error al actualizar estado:', updateError);
        return NextResponse.json({ 
          error: 'Error al actualizar estado', 
          original: application 
        }, { status: 500 });
      }
      
      // Obtener el estado actualizado
      const { data: updated } = await supabase
        .from('credit_applications')
        .select('id, application_status')
        .eq('id', id)
        .single();
        
      return NextResponse.json({ 
        message: 'Estado corregido',
        before: application,
        after: updated
      });
    }
    
    return NextResponse.json({ 
      message: 'No se requiere corrección',
      application 
    });
    
  } catch (error) {
    console.error('Error al corregir estado:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 