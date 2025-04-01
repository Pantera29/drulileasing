// Exportaciones principales del módulo de evaluación crediticia

export { CreditEvaluationFactory } from './credit-evaluation.factory';
export { 
  ApplicationStatus, 
  type CreditEvaluationResult,
  type CreditEvaluationService,
  type CreditEvaluationConfig,
  type EvaluationData,
  type FinancialData,
  type EquipmentRequestData,
  type CreditEvaluationHistory
} from './types';

// También exportamos los servicios para casos especiales
export { SimulatedEvaluationService } from './simulated-evaluation.service';
export { ExternalEvaluationService } from './external-evaluation.service'; 