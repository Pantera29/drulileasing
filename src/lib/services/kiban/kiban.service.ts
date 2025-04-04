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
  private headers: HeadersInit;
  private isSimulatedMode: boolean;
  
  constructor() {
    const apiKey = process.env.KIBAN_API_KEY || '1KYVW2H3WZ2FCJ-3E2JHPR00001Y5-62TQ-1GCNDK5WK';
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-api-key': apiKey
    } as HeadersInit;
    
    // Determinar si estamos en modo simulado
    this.isSimulatedMode = process.env.SIMULATE_KIBAN === 'true';
    console.log(`[KibanService] Inicializado. Modo simulado: ${this.isSimulatedMode}`);
  }

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
      console.log(`[KibanService] API Key: ${this.headers && 'x-api-key' in this.headers ? 'Configurada' : 'No configurada'}`);
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
  async validateNip(kibanRequestId: string, nip: string): Promise<{
    isValid: boolean;
    validationId?: string; // ID que se usará para consultas posteriores
  }> {
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
      
      // En modo simulado, generamos un ID de validación simulado
      return {
        isValid,
        validationId: isValid ? `simulated-validation-${Date.now()}` : undefined
      };
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
      
      // Guardar el ID de la transacción de validación
      const validationId = firstData.id;
      console.log(`[KibanService] ID de validación obtenido: ${validationId}`);
      
      if (firstData.status !== 'SUCCESS') {
        console.error(`[KibanService] Primera validación falló: ${firstData.status}`);
        return { isValid: false };
      }
      
      // Verificar si hay intentos registrados
      if (!firstData.response.attempts || firstData.response.attempts.length === 0) {
        console.error('[KibanService] No hay intentos registrados en la respuesta');
        return { isValid: false };
      }
      
      // Verificar si el último intento fue exitoso
      const lastAttempt = firstData.response.attempts[firstData.response.attempts.length - 1];
      if (lastAttempt.status !== 'success') {
        console.error(`[KibanService] Último intento no exitoso: ${lastAttempt.status}`);
        return { isValid: false };
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
      
      return {
        isValid,
        validationId: isValid ? validationId : undefined
      };
    } catch (error) {
      console.error('[KibanService] Error en servicio de validación de NIP:', error);
      throw error;
    }
  }
  
  /**
   * Registra en la base de datos la información de validación del NIP
   */
  async saveNipValidation(
    userId: string, 
    applicationId: string, 
    kibanRequestId: string, 
    validated: boolean,
    validationId?: string // ID de validación para usar en consultas al buró
  ): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('nip_validations')
      .insert({
        user_id: userId,
        application_id: applicationId,
        kiban_request_id: kibanRequestId,
        kiban_validation_id: validationId, // Guardar el ID de validación
        validated: validated,
        validation_date: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error al guardar validación de NIP:', error);
      throw new Error('No se pudo registrar la validación del NIP');
    }
  }

  /**
   * Realiza una consulta al buró de crédito usando Kiban
   * @param nipAuthId ID recibido en la respuesta de validación del NIP
   * @param userInfo Información del usuario para la consulta
   * @returns Respuesta del buró de crédito
   */
  async queryCreditBureau(nipAuthId: string, userInfo: {
    firstName: string;
    secondName?: string;
    paternalLastName: string;
    maternalLastName?: string;
    rfc: string;
    address: {
      street: string;
      zipCode: string;
    }
  }): Promise<any> {
    console.log(`[KibanService] Iniciando consulta al buró de crédito - NIP Auth ID: ${nipAuthId}`);
    
    // Si estamos en modo simulado, devolver una respuesta simulada
    if (this.isSimulatedMode || nipAuthId.startsWith('simulated-')) {
      console.log('[KibanService] Usando modo simulado para consulta al buró');
      // Simular retraso de la API para pruebas de UI
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return {
        id: `sim-${Date.now()}`,
        status: 'SUCCESS',
        response: {
          scoreBuroCredito: [
            {
              codigoScore: "007",
              nombreScore: "BC SCORE",
              valorScore: Math.floor(Math.random() * 300) + 550, // Score entre 550 y 850
              codigoRazon1: "132",
              codigoRazon2: "132",
              codigoRazon3: "132"
            }
          ],
          // Datos simulados simplificados
          consultasEfectuadas: [],
          cuentas: [],
          empleos: [],
          nombre: {
            primerNombre: userInfo.firstName,
            segundoNombre: userInfo.secondName || "",
            apellidoPaterno: userInfo.paternalLastName,
            apellidoMaterno: userInfo.maternalLastName || "",
            rfc: userInfo.rfc
          }
        }
      };
    }
    
    try {
      // Construir el payload para la API de Kiban
      const payload = {
        parameters_bc_pf_by_kiban: {
          productoRequerido: "501",
          hawk: true
        },
        nombre: {
          primerNombre: userInfo.firstName,
          segundoNombre: userInfo.secondName || "",
          apellidoPaterno: userInfo.paternalLastName,
          apellidoMaterno: userInfo.maternalLastName || "",
          rfc: userInfo.rfc
        },
        domicilio: {
          direccion: {
            direccion: userInfo.address.street,
            cp: userInfo.address.zipCode
          }
        },
        authorization: {
          tipo: "nip",
          id: nipAuthId
        }
      };
      
      console.log(`[KibanService] Consultando buró con payload:`, JSON.stringify(payload));
      
      // Realizar la solicitud a la API de Kiban
      const response = await fetch(`${this.baseUrl}/bc_pf_by_kiban/query?testCaseId=663567bb713cf2110a110689`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error(`[KibanService] Error en consulta al buró: ${errorData}`);
        throw new Error(`Error en consulta al buró: ${errorData}`);
      }
      
      const data = await response.json();
      console.log(`[KibanService] Respuesta de consulta al buró: ${data.status}`);
      
      return data;
    } catch (error) {
      console.error('[KibanService] Error en servicio de consulta al buró:', error);
      throw error;
    }
  }
} 