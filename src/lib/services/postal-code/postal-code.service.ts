import { BUREAU_CONFIG } from '../bureau/config';

export class PostalCodeService {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseUrl = 'https://sandbox.moffin.mx/api';
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BUREAU_CONFIG.moffin.apiToken}`
    };
  }

  async getPostalCodeInfo(postalCode: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/postal-codes/${postalCode}`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error al obtener información del código postal: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en getPostalCodeInfo:', error);
      throw error;
    }
  }

  async searchPostalCodes(query: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/postal-codes/search`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error al buscar códigos postales: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error en searchPostalCodes:', error);
      throw error;
    }
  }

  async validatePostalCode(postalCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/postal-codes/validate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ postalCode })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Error al validar código postal: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      return data.isValid;
    } catch (error) {
      console.error('Error en validatePostalCode:', error);
      throw error;
    }
  }
} 