export interface SendNipResponse {
  requestId: string;
  status: string;
  timestamp: string;
  channel: string;
}

export interface CreditBureauQuery {
  user_id?: string;
  full_name: string;
  rfc: string;
  birth_date: string;
  email: string;
  address: string;
  validationId: string;
}

export interface IBureauService {
  queryCreditBureau(userInfo: CreditBureauQuery): Promise<any>;
  processCreditBureauData(userId: string, applicationId: string, response: any): Promise<void>;
  sendNip(phoneNumber: string): Promise<SendNipResponse>;
  validateNip(requestId: string, nip: string): Promise<{ isValid: boolean; validationId?: string }>;
  saveNipValidation(userId: string, applicationId: string, validationId: string): Promise<void>;
} 