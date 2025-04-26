import { IBureauService, SendNipResponse, CreditBureauQuery } from './types';
import { BUREAU_CONFIG } from './config';
import { MoffinService } from './providers/moffin.service';
import { KibanService } from './providers/kiban.service';

export class BureauService implements IBureauService {
  private provider: IBureauService;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = BUREAU_CONFIG.baseUrl;
    this.apiKey = BUREAU_CONFIG.apiKey || '';
    
    if (BUREAU_CONFIG.activeProvider === 'moffin') {
      this.provider = new MoffinService();
    } else {
      this.provider = new KibanService();
    }
  }

  async queryCreditBureau(userInfo: CreditBureauQuery): Promise<any> {
    return this.provider.queryCreditBureau(userInfo);
  }

  async processCreditBureauData(userId: string, applicationId: string, response: any): Promise<void> {
    return this.provider.processCreditBureauData(userId, applicationId, response);
  }

  async sendNip(phoneNumber: string): Promise<SendNipResponse> {
    return this.provider.sendNip(phoneNumber);
  }

  async validateNip(requestId: string, nip: string): Promise<{ isValid: boolean; validationId?: string }> {
    return this.provider.validateNip(requestId, nip);
  }

  async saveNipValidation(userId: string, applicationId: string, validationId: string): Promise<void> {
    return this.provider.saveNipValidation(userId, applicationId, validationId);
  }
} 