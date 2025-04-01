import { CreditEvaluationService, CreditEvaluationConfig } from './types';
import { SimulatedEvaluationService } from './simulated-evaluation.service';
import { ExternalEvaluationService } from './external-evaluation.service';

/**
 * Factory que proporciona instancias de servicios de evaluación crediticia
 * según la configuración del entorno o parámetros
 */
export class CreditEvaluationFactory {
  /**
   * Crea y devuelve una instancia del servicio de evaluación adecuado
   */
  static createEvaluationService(): CreditEvaluationService {
    // Obtenemos configuración del entorno
    const provider = process.env.CREDIT_PROVIDER || 'simulated';
    const apiKey = process.env.CREDIT_API_KEY;
    const apiUrl = process.env.CREDIT_API_URL;
    const timeout = parseInt(process.env.CREDIT_API_TIMEOUT || '30000', 10);
    const retries = parseInt(process.env.CREDIT_API_RETRIES || '2', 10);
    
    // Creamos la configuración
    const config: CreditEvaluationConfig = {
      provider,
      apiKey,
      apiUrl,
      timeout,
      retries
    };
    
    // Seleccionamos el servicio adecuado según el proveedor
    if (provider === 'simulated') {
      console.log('[CreditEvaluationFactory] Usando servicio de evaluación simulado');
      return new SimulatedEvaluationService();
    } else {
      console.log(`[CreditEvaluationFactory] Usando servicio de evaluación externo con proveedor: ${provider}`);
      return new ExternalEvaluationService(config);
    }
  }
  
  /**
   * Crea una instancia con configuración personalizada
   */
  static createWithConfig(config: CreditEvaluationConfig): CreditEvaluationService {
    if (config.provider === 'simulated') {
      return new SimulatedEvaluationService();
    } else {
      return new ExternalEvaluationService(config);
    }
  }
} 