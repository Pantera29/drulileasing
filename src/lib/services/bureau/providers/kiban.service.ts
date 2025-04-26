import { createClient } from '@/lib/supabase/server';
import { IBureauService, SendNipResponse, CreditBureauQuery } from '../types';
import { BUREAU_CONFIG } from '../config';

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

interface KibanResponse {
  id: string;
  status: string;
  data: {
    score?: number;
    // ... otros campos de respuesta
  };
}

export class KibanService implements IBureauService {
  private baseUrl: string;
  private headers: { [key: string]: string };
  private isSimulatedMode: boolean;
  
  constructor() {
    this.baseUrl = BUREAU_CONFIG.kiban.apiUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUREAU_CONFIG.kiban.apiToken}`
    };
    this.isSimulatedMode = process.env.NODE_ENV !== 'production';
    console.log(`[KibanService] Inicializado. Modo simulado: ${this.isSimulatedMode}`);
  }

  async queryCreditBureau(userInfo: CreditBureauQuery): Promise<any> {
    console.log('[KibanService] Consultando buró de crédito');
    
    // Obtener datos adicionales de la base de datos
    const supabase = await createClient();
    
    // Obtener datos de contacto si tenemos user_id
    let contactData;
    if (userInfo.user_id) {
      const { data, error } = await supabase
        .from('contact_info')
        .select('street, street_number, neighborhood, city, state, zip_code')
        .eq('user_id', userInfo.user_id)
        .single();

      if (error) {
        console.error('[KibanService] Error al obtener datos de contacto:', error);
        throw new Error('Error al obtener datos de contacto');
      }
      contactData = data;
    }

    // Dividir el nombre completo
    const nameParts = userInfo.full_name.split(' ');
    const primerNombre = nameParts[0] || '';
    const segundoNombre = nameParts[1] || '';
    const apellidoPaterno = nameParts[2] || '';
    const apellidoMaterno = nameParts[3] || '';

    const payload = {
      parameters_bc_pf_by_kiban: {
        productoRequerido: "501",
        hawk: true
      },
      nombre: {
        primerNombre,
        segundoNombre,
        apellidoPaterno,
        apellidoMaterno,
        rfc: userInfo.rfc
      },
      domicilio: {
        direccion: {
          direccion: contactData?.street || userInfo.address,
          cp: contactData?.zip_code || ''
        }
      },
      validationId: userInfo.validationId
    };

    try {
      const response = await fetch(`${this.baseUrl}/query/bureau`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`[KibanService] Error en consulta: ${error}`);
        throw new Error('Error al consultar el buró de crédito');
      }

      const data = await response.json() as KibanResponse;
      console.log(`[KibanService] Consulta exitosa. ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('[KibanService] Error en consulta:', error);
      throw error;
    }
  }

  async processCreditBureauData(userId: string, applicationId: string, response: any): Promise<void> {
    const supabase = await createClient();
    
    const details = {
      id: response.id,
      application_id: applicationId,
      user_id: userId,
      response_date: new Date(response.createdAt),
      score: response.response?.scoreBuroCredito?.[0]?.valorScore || 0,
      score_name: response.response?.scoreBuroCredito?.[0]?.nombreScore || '',
      processed_at: new Date()
    };

    const { error } = await supabase
      .from('credit_bureau_details')
      .insert(details);

    if (error) {
      console.error('[KibanService] Error al guardar detalles:', error);
      throw error;
    }
  }

  async sendNip(phoneNumber: string): Promise<SendNipResponse> {
    if (this.isSimulatedMode) {
      return {
        requestId: 'sim_123456',
        status: 'success',
        timestamp: new Date().toISOString(),
        channel: 'sms'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/send-nip`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ phoneNumber })
      });

      if (!response.ok) {
        throw new Error(`Error al enviar NIP: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        requestId: data.requestId || data.id,
        status: 'success',
        timestamp: new Date().toISOString(),
        channel: 'sms'
      };
    } catch (error) {
      console.error('Error en sendNip:', error);
      throw error;
    }
  }

  async validateNip(nip: string, requestId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/nip/validate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          nip,
          requestId
        })
      });

      if (!response.ok) {
        throw new Error('Error al validar el NIP');
      }

      const data = await response.json();
      return {
        isValid: data.isValid,
        validationId: data.validationId
      };
    } catch (error) {
      console.error('Error en validateNip:', error);
      throw error;
    }
  }

  async saveNipValidation(userId: string, applicationId: string, validationId: string): Promise<void> {
    const supabase = await createClient();
    
    try {
      const { error } = await supabase
        .from('nip_validations')
        .insert({
          user_id: userId,
          application_id: applicationId,
          kiban_validation_id: validationId,
          validated: true,
          validation_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('[KibanService] Error al guardar validación:', error);
      throw error;
    }
  }
} 