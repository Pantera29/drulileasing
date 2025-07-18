import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucketName') as string;
    const folderPath = formData.get('folderPath') as string;
    const fileType = formData.get('fileType') as string;
    const userId = formData.get('userId') as string;

    if (!file || !bucketName || !folderPath || !fileType || !userId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Validar que el usuario solo puede subir archivos para sí mismo
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Crear un nombre de archivo único
    const timestamp = new Date().getTime();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${fileType}_${timestamp}.${fileExtension}`;
    const filePath = `${folderPath}/${fileName}`;

    // Subir el archivo usando el cliente de servidor
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error al subir archivo:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener la URL pública del archivo
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      path: filePath 
    });

  } catch (error) {
    console.error('Error en API de subida de archivos:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor' 
    }, { status: 500 });
  }
} 