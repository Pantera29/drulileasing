// Definición de tipos para el sistema de evaluación de crédito

// Estados posibles de una solicitud
export enum ApplicationStatus {
  PENDING_NIP = 'pending_nip',
  PENDING_ANALYSIS = 'pending_analysis',
  APPROVED = 'approved',
  IN_REVIEW = 'in_review',
  REJECTED = 'rejected',
  INCOMPLETE = 'incomplete',
}

// Resultados de evaluación
export interface CreditEvaluationResult {
  applicationId: string;
  status: ApplicationStatus;
  creditScore: number;
  approvedAmount?: number;
  approvedTerm?: number;
  monthlyPayment?: number;
  rejectionReason?: string;
  externalRequestId?: string;
  externalProvider?: string;
  externalResponse?: any;
}

// Datos financieros necesarios para la evaluación
export interface FinancialData {
  monthlyIncome: number;
  additionalIncome?: number | null;
}

// Datos del equipo solicitado
export interface EquipmentRequestData {
  approximateAmount: number;
  desiredTerm: number;
}

// Datos completos para realizar la evaluación
export interface EvaluationData {
  applicationId: string;
  userId: string;
  financialData: FinancialData;
  equipmentData: EquipmentRequestData;
  termsAccepted: boolean;
  creditCheckAuthorized: boolean;
}

// Interfaz para servicios de evaluación de crédito
export interface CreditEvaluationService {
  evaluateApplication(applicationId: string): Promise<CreditEvaluationResult>;
  processApplicationData(data: EvaluationData): Promise<CreditEvaluationResult>;
}

// Configuración para servicios de evaluación
export interface CreditEvaluationConfig {
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
  retries?: number;
}

// Historia de evaluación para auditoría
export interface CreditEvaluationHistory {
  id?: string;
  applicationId: string;
  userId: string;
  evaluationTimestamp: string;
  provider: string;
  creditScore: number;
  result: ApplicationStatus;
  rawResponse?: any;
} 