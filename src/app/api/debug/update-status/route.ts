import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status') || 'pending_nip';
  
  if (!id) {
    return NextResponse.json({ error: 'Se requiere un ID de aplicación' }, { status: 400 });
  }
  
  try {
    const supabase = await createClient();
    
    // Actualizar el estado de la aplicación
    const { data: updateResult, error: updateError } = await supabase
      .from('credit_applications')
      .update({ application_status: status })
      .eq('id', id)
      .select('id, application_status');
      
    if (updateError) {
      console.error('Error al actualizar aplicación:', updateError);
      return NextResponse.json({ error: 'Error al actualizar aplicación' }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Estado actualizado correctamente', 
      result: updateResult 
    });
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
} 