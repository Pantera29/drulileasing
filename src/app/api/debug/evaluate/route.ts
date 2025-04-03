import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateApplication } from '@/lib/services/credit-evaluation';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Se requiere un ID de aplicación' }, { status: 400 });
  }
  
  try {
    const supabase = await createClient();
    
    // Verificar el estado actual
    const { data: beforeApp } = await supabase
      .from('credit_applications')
      .select('id, application_status, nip_validated')
      .eq('id', id)
      .single();
      
    if (!beforeApp) {
      return NextResponse.json({ error: 'Aplicación no encontrada' }, { status: 404 });
    }
    
    // Ejecutar evaluación
    console.log('Iniciando evaluación para aplicación:', id);
    try {
      const result = await evaluateApplication(id);
      console.log('Resultado de evaluación:', result);
      
      // Verificar nuevo estado
      const { data: afterApp } = await supabase
        .from('credit_applications')
        .select('id, application_status, nip_validated')
        .eq('id', id)
        .single();
        
      return NextResponse.json({ 
        message: 'Evaluación completada', 
        before: beforeApp,
        after: afterApp,
        result 
      });
    } catch (evalError: any) {
      console.error('Error durante evaluación:', evalError);
      return NextResponse.json({ 
        error: 'Error durante la evaluación', 
        message: evalError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error al procesar solicitud:', error);
    return NextResponse.json({ error: 'Error al procesar solicitud' }, { status: 500 });
  }
} 