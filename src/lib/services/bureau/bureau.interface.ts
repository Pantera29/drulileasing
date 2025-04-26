export interface IBureauService {
  queryCreditBureau(userInfo: any): Promise<any>;
  processCreditBureauData(data: any): Promise<any>;
  sendNip(phoneNumber: string): Promise<any>;
  validateNip(nip: string, validationId: string): Promise<any>;
  saveNipValidation(validationData: any): Promise<any>;
} 