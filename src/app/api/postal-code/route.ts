import { NextRequest, NextResponse } from 'next/server';
import { PostalCodeService } from '@/lib/services/postal-code/postal-code.service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postalCode = searchParams.get('postalCode');

  if (!postalCode) {
    return NextResponse.json(
      { error: 'Se requiere el código postal' },
      { status: 400 }
    );
  }

  try {
    const postalCodeService = new PostalCodeService();
    const postalCodeInfo = await postalCodeService.getPostalCodeInfo(postalCode);

    if (!postalCodeInfo) {
      return NextResponse.json(
        { error: 'No se encontró información para el código postal proporcionado' },
        { status: 404 }
      );
    }

    return NextResponse.json(postalCodeInfo);
  } catch (error) {
    console.error('Error al consultar código postal:', error);
    
    // Si el error tiene un mensaje específico, lo usamos
    const errorMessage = error instanceof Error ? error.message : 'Error al consultar el código postal';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 