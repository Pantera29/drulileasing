import { createClient } from '@/lib/supabase/server';

interface SendNipResponse {
  id: string;
  createdAt: string;
  finishedAt: string;
  duration: number;
  status: string;
  request: {
    countryCode: string;
    method: string;
    to: string;
  };
}

interface ValidateNipResponse {
  id: string;
  createdAt: string;
  finishedAt: string;
  duration: number;
  status: string;
  request: {
    id: string;
    nip: string;
  };
  response: {
    attempts: {
      createdAt: string;
      nip: string;
      status: string;
    }[];
    validated?: boolean;
  };
}

export class KibanService {
  private baseUrl = 'https://sandbox.link.kiban.com/api/v2';
  private headers = {
    'accept': 'application/json',
    'content-type': 'application/json',
    'x-api-key': process.env.KIBAN_API_KEY || 'tu-api-key-de-prueba-aqui' // Usar variable de entorno o un valor de prueba
  };

  // Modo simulado para desarrollo (evita llamadas reales a la API)
  private isSimulatedMode = process.env.NODE_ENV !== 'production' && !process.env.KIBAN_API_KEY;

  /**
   * Envía un NIP al número de teléfono del usuario vía WhatsApp
   */
  async sendNip(phoneNumber: string, countryCode: string = '+52'): Promise<string> {
    console.log(`[KibanService] Enviando NIP por WhatsApp a ${countryCode}${phoneNumber}`);
    
    // Si estamos en modo simulado, devolver un ID falso sin hacer llamadas reales
    if (this.isSimulatedMode) {
      console.log('[KibanService] Usando modo simulado para desarrollo');
      const simulatedId = `simulated-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      console.log(`[KibanService] ID simulado generado: ${simulatedId}`);
      return simulatedId;
    }
    
    try {
      console.log('[KibanService] Iniciando envío de NIP con configuración:');
      console.log(`[KibanService] API Key: ${this.headers['x-api-key'] ? 'Configurada' : 'No configurada'}`);
      console.log(`[KibanService] Modo: ${process.env.NODE_ENV}`);
      
      // Por ahora, para desarrollo usamos un número hardcodeado
      // En producción, se usaría el número real del usuario
      const testPhoneNumber = '9999690335'; // Número de prueba de Kiban
      const targetNumber = process.env.NODE_ENV === 'production' ? phoneNumber : testPhoneNumber;
      
      console.log(`[KibanService] Enviando a número ${process.env.NODE_ENV === 'production' ? 'real' : 'de prueba'}: ${targetNumber}`);
      
      const response = await fetch(`${this.baseUrl}/nip/send`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          method: 'whatsapp',
          countryCode: countryCode,
          to: targetNumber
        })
      });
      
      if (!response.ok) {
        const error = await response.text();
        console.error(`[KibanService] Error en respuesta HTTP: ${response.status} - ${error}`);
        throw new Error(`Error al enviar NIP: ${error}`);
      }
      
      const data = await response.json() as SendNipResponse;
      console.log(`[KibanService] Respuesta de Kiban: ${JSON.stringify(data)}`);
      
      if (data.status !== 'SUCCESS') {
        console.error(`[KibanService] Estado no exitoso: ${data.status}`);
        throw new Error(`Error al enviar NIP: ${data.status}`);
      }
      
      // Guardamos el ID para validación posterior
      console.log(`[KibanService] NIP enviado exitosamente, ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error('[KibanService] Error en servicio de envío de NIP:', error);
      throw error;
    }
  }
  
  /**
   * Valida el NIP ingresado por el usuario
   * Requiere dos llamadas para completar la validación según la documentación de Kiban
   */
  async validateNip(kibanRequestId: string, nip: string): Promise<boolean> {
    console.log(`[KibanService] Validando NIP - RequestID: ${kibanRequestId}, NIP: ${nip}`);
    console.log(`[KibanService] Tipo de RequestID: ${typeof kibanRequestId}, Longitud: ${kibanRequestId.length}`);
    console.log(`[KibanService] Modo simulado: ${this.isSimulatedMode}`);
    
    // Validar que el kibanRequestId no esté vacío
    if (!kibanRequestId || kibanRequestId === 'null' || kibanRequestId === 'undefined') {
      console.error('[KibanService] Error: kibanRequestId inválido o vacío');
      throw new Error('ID de solicitud Kiban inválido o no encontrado');
    }
    
    // Si estamos en modo simulado, validar directamente contra el NIP hardcodeado
    if (this.isSimulatedMode || kibanRequestId.startsWith('simulated-')) {
      console.log('[KibanService] Usando modo simulado para validación');
      const isValid = nip === '123456'; // El NIP de prueba
      console.log(`[KibanService] Resultado modo simulado: ${isValid ? 'Válido' : 'Inválido'}`);
      return isValid;
    }
    
    try {
      // Para desarrollo, podemos validar contra un NIP hardcodeado
      const testNip = '123456';
      const nipToValidate = process.env.NODE_ENV === 'production' ? nip : testNip;
      
      console.log(`[KibanService] Iniciando primera validación con Kiban - NIP: ${nipToValidate}`);
      console.log(`[KibanService] Headers: ${JSON.stringify(this.headers)}`);
      
      // PRIMER INTENTO DE VALIDACIÓN
      const firstResponse = await fetch(`${this.baseUrl}/nip/validate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          id: kibanRequestId,
          nip: nipToValidate
        })
      });
      
      console.log(`[KibanService] Primera respuesta status: ${firstResponse.status}`);
      
      if (!firstResponse.ok) {
        const error = await firstResponse.text();
        console.error(`[KibanService] Error en primera validación: ${error}`);
        
        // Si el error es 404, puede significar que el kibanRequestId ha expirado
        if (firstResponse.status === 404) {
          console.error(`[KibanService] ID de solicitud no encontrado o expirado: ${kibanRequestId}`);
          throw new Error('El código ha expirado. Por favor solicita un nuevo código.');
        }
        
        throw new Error(`Error en primera validación de NIP: ${error}`);
      }
      
      const firstData = await firstResponse.json() as ValidateNipResponse;
      console.log(`[KibanService] Primera respuesta datos: ${JSON.stringify(firstData)}`);
      
      if (firstData.status !== 'SUCCESS') {
        console.error(`[KibanService] Primera validación falló: ${firstData.status}`);
        return false;
      }
      
      // Verificar si hay intentos registrados
      if (!firstData.response.attempts || firstData.response.attempts.length === 0) {
        console.error('[KibanService] No hay intentos registrados en la respuesta');
        return false;
      }
      
      // Verificar si el último intento fue exitoso
      const lastAttempt = firstData.response.attempts[firstData.response.attempts.length - 1];
      if (lastAttempt.status !== 'success') {
        console.error(`[KibanService] Último intento no exitoso: ${lastAttempt.status}`);
        return false;
      }
      
      // SEGUNDO INTENTO DE VALIDACIÓN (requerido por Kiban)
      const secondResponse = await fetch(`${this.baseUrl}/nip/validate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          id: kibanRequestId,
          nip: nipToValidate
        })
      });
      
      if (!secondResponse.ok) {
        const error = await secondResponse.text();
        console.error(`[KibanService] Error en segunda validación: ${error}`);
        throw new Error(`Error en segunda validación de NIP: ${error}`);
      }
      
      const secondData = await secondResponse.json() as ValidateNipResponse;
      console.log(`[KibanService] Segunda respuesta datos: ${JSON.stringify(secondData)}`);
      
      // La segunda respuesta debe contener validated: true
      const isValid = secondData.response.validated === true;
      console.log(`[KibanService] Resultado final de validación: ${isValid ? 'Válido' : 'Inválido'}`);
      
      return isValid;
    } catch (error) {
      console.error('[KibanService] Error en servicio de validación de NIP:', error);
      throw error;
    }
  }
  
  /**
   * Registra en la base de datos la información de validación del NIP
   */
  async saveNipValidation(userId: string, applicationId: string, kibanRequestId: string, validated: boolean): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('nip_validations')
      .insert({
        user_id: userId,
        application_id: applicationId,
        kiban_request_id: kibanRequestId,
        validated: validated,
        validation_date: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error al guardar validación de NIP:', error);
      throw new Error('No se pudo registrar la validación del NIP');
    }
  }
} 