import { IBureauService, SendNipResponse, CreditBureauQuery } from '../types';
import { BUREAU_CONFIG } from '../config';
import { createClient } from '@supabase/supabase-js';

interface ValidateNipResponse {
  valid: boolean;
  validationId?: string;
  attempts: number;
  timestamp: string;
  isValid: boolean;
}

interface BureauQueryResponse {
  id: string;
  status: string;
  response: {
    creditScore?: number;
    // Otros campos de respuesta según la documentación
  };
}

interface MoffinProfile {
  id: string;
  accountType: string;
  email: string;
  firstName: string;
  firstLastName: string;
  secondLastName: string;
  basicRFC: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  exteriorNumber: string;
  neighborhood: string;
  country: string;
  nationality: string;
}

// Constantes para el modo simulado
const SIMULATED_VALIDATION_ID = 'sim_valid_123456';
const SIMULATED_REQUEST_ID = 'sim_req_789012';
const VALID_TEST_NIP = '123456';

export class MoffinService implements IBureauService {
  private baseUrl: string;
  private headers: Record<string, string>;
  private simulatedMode: boolean;

  constructor() {
    this.baseUrl = BUREAU_CONFIG.moffin.apiUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUREAU_CONFIG.moffin.apiToken}`
    };
    this.simulatedMode = process.env.NODE_ENV === 'development';
  }

  async queryCreditBureau(userInfo: CreditBureauQuery): Promise<any> {
    if (this.simulatedMode) {
      return {
        id: 'sim_query_123',
        status: 'success',
        response: {
          creditScore: 750
        }
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/credit-report`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          curp: userInfo.rfc,
          firstName: userInfo.full_name.split(' ')[0],
          lastName: userInfo.full_name.split(' ')[1] || '',
          secondLastName: userInfo.full_name.split(' ')[2] || '',
          address: userInfo.address,
          validationId: userInfo.validationId
        })
      });

      if (!response.ok) {
        throw new Error(`Error al consultar el buró de crédito: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en queryCreditBureau:', error);
      throw error;
    }
  }

  async processCreditBureauData(data: any): Promise<any> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: savedData, error } = await supabase
        .from('credit_reports')
        .insert([
          {
            raw_data: data,
            processed_at: new Date().toISOString(),
            provider: 'moffin'
          }
        ])
        .select();

      if (error) throw error;
      return savedData;
    } catch (error) {
      console.error('Error en processCreditBureauData:', error);
      throw error;
    }
  }

  async sendNip(phoneNumber: string): Promise<SendNipResponse> {
    if (this.simulatedMode) {
      console.log('[MODO SIMULADO] Enviando NIP al número:', phoneNumber);
      return {
        requestId: SIMULATED_REQUEST_ID,
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
        throw new Error(`Error al enviar el NIP: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error en sendNip:', error);
      throw error;
    }
  }

  async validateNip(nip: string, validationId: string): Promise<ValidateNipResponse> {
    if (this.simulatedMode) {
      console.log('[MODO SIMULADO] Validando NIP:', nip);
      return {
        valid: nip === VALID_TEST_NIP,
        isValid: nip === VALID_TEST_NIP,
        validationId: SIMULATED_VALIDATION_ID,
        attempts: 1,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/validate-nip`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ nip, validationId })
      });

      if (!response.ok) {
        throw new Error(`Error al validar NIP: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        ...data,
        isValid: data.valid
      };
    } catch (error) {
      console.error('Error en validateNip:', error);
      throw error;
    }
  }

  async saveNipValidation(userId: string, applicationId: string, validationId: string): Promise<void> {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // En modo simulado, usamos el SIMULATED_REQUEST_ID
      const requestId = this.simulatedMode ? SIMULATED_REQUEST_ID : validationId;

      const { error } = await supabase
        .from('nip_validations')
        .insert([{
          user_id: userId,
          application_id: applicationId,
          kiban_validation_id: validationId,
          kiban_request_id: requestId,
          validated: true,
          validation_date: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error en saveNipValidation:', error);
      throw error;
    }
  }
}