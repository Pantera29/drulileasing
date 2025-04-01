import { createClient } from '@/lib/supabase/server';
import {
  ApplicationStatus,
  CreditEvaluationResult,
  CreditEvaluationService,
  CreditEvaluationConfig,
  EvaluationData
} from './types';

/**
 * Servicio de evaluación crediticia mediante API externa
 * Implementa un adaptador genérico para conectar con distintos proveedores
 */
export class ExternalEvaluationService implements CreditEvaluationService {
  private config: CreditEvaluationConfig;
  
  constructor(config: CreditEvaluationConfig) {
    this.config = {
      timeout: 30000, // 30 segundos por defecto
      retries: 2,     // 2 reintentos por defecto
      ...config
    };
    
    if (!config.provider) {
      throw new Error('Se debe especificar un proveedor para la evaluación crediticia');
    }
    
    if (!config.apiKey && config.provider !== 'simulated') {
      throw new Error('Se requiere una clave API para la integración con proveedores externos');
    }
  }
  
  /**
   * Evalúa una solicitud existente por su ID
   */
  async evaluateApplication(applicationId: string): Promise<CreditEvaluationResult> {
    console.log(`[ExternalEvaluationService] Evaluando solicitud ${applicationId} con proveedor ${this.config.provider}`);
    
    const supabase = await createClient();
    
    // Obtener datos de la solicitud
    const { data: application, error: appError } = await supabase
      .from('credit_applications')
      .select(`
        id,
        user_id,
        financial_id,
        equipment_id,
        contact_id,
        terms_accepted,
        credit_check_authorized
      `)
      .eq('id', applicationId)
      .single();
    
    if (appError || !application) {
      console.error('Error al obtener la solicitud:', appError);
      throw new Error(`No se pudo encontrar la solicitud ${applicationId}`);
    }
    
    // Verificar autorización
    if (!application.credit_check_authorized) {
      throw new Error('El usuario no ha autorizado la verificación crediticia');
    }
    
    // Obtener información financiera
    const { data: financialInfo, error: finError } = await supabase
      .from('financial_info')
      .select('monthly_income, additional_income')
      .eq('id', application.financial_id)
      .single();
    
    if (finError || !financialInfo) {
      console.error('Error al obtener información financiera:', finError);
      throw new Error('No se pudo obtener la información financiera necesaria');
    }
    
    // Obtener información del equipo
    const { data: equipmentInfo, error: eqError } = await supabase
      .from('equipment_requests')
      .select('approximate_amount, desired_term')
      .eq('id', application.equipment_id)
      .single();
    
    if (eqError || !equipmentInfo) {
      console.error('Error al obtener información del equipo:', eqError);
      throw new Error('No se pudo obtener la información del equipo solicitado');
    }
    
    // Obtener información personal y de contacto para APIs que lo requieran
    const [profileResult, contactResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('full_name, birth_date, curp_rfc')
        .eq('id', application.user_id)
        .single(),
      supabase
        .from('contact_info')
        .select('*')
        .eq('id', application.contact_id)
        .single()
    ]);
    
    // Preparar datos para evaluación
    const evaluationData: EvaluationData = {
      applicationId: application.id,
      userId: application.user_id,
      financialData: {
        monthlyIncome: financialInfo.monthly_income,
        additionalIncome: financialInfo.additional_income
      },
      equipmentData: {
        approximateAmount: equipmentInfo.approximate_amount,
        desiredTerm: equipmentInfo.desired_term
      },
      termsAccepted: application.terms_accepted,
      creditCheckAuthorized: application.credit_check_authorized
    };
    
    // Datos adicionales que podrían ser necesarios para algunos proveedores
    const additionalData = {
      profile: profileResult.data,
      contact: contactResult.data
    };
    
    // Procesar la evaluación con datos adicionales
    return this.processApplicationData(evaluationData, additionalData);
  }
  
  /**
   * Procesa los datos de la solicitud y realiza la evaluación
   */
  async processApplicationData(data: EvaluationData, additionalData?: any): Promise<CreditEvaluationResult> {
    console.log(`[ExternalEvaluationService] Procesando datos para solicitud ${data.applicationId}`);
    
    try {
      // Seleccionar el adaptador correcto según el proveedor configurado
      const adapter = this.getProviderAdapter(this.config.provider);
      
      // Mapear datos al formato requerido por el proveedor
      const providerData = adapter.mapRequestData(data, additionalData);
      
      // Realizar la solicitud al proveedor externo con reintentos
      const externalResponse = await this.executeWithRetry(
        () => adapter.sendRequest(providerData, this.config),
        this.config.retries || 2
      );
      
      // Transformar la respuesta al formato estándar interno
      const result = adapter.mapResponseData(externalResponse, data.applicationId);
      
      // Guardar resultados en la base de datos
      await this.saveEvaluationResult(data.userId, result);
      
      return result;
    } catch (error) {
      console.error(`Error en la evaluación externa: ${error}`);
      
      // En caso de error, utilizamos un fallback simulado para no bloquear
      console.log('Utilizando evaluación simulada de respaldo');
      
      // Importación dinámica para evitar dependencias circulares
      const { SimulatedEvaluationService } = await import('./simulated-evaluation.service');
      const fallbackService = new SimulatedEvaluationService();
      
      const fallbackResult = await fallbackService.processApplicationData(data);
      
      // Marcar que se utilizó fallback
      fallbackResult.externalProvider = `fallback-${this.config.provider}`;
      fallbackResult.externalResponse = {
        ...fallbackResult.externalResponse,
        error: `${error}`,
        fallbackUsed: true
      };
      
      // Guardar resultados del fallback
      await this.saveEvaluationResult(data.userId, fallbackResult);
      
      return fallbackResult;
    }
  }
  
  /**
   * Función auxiliar para ejecutar con reintentos
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, retries: number): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      
      console.log(`Reintentando operación. Reintentos restantes: ${retries - 1}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
      
      return this.executeWithRetry(fn, retries - 1);
    }
  }
  
  /**
   * Obtiene el adaptador específico para el proveedor
   */
  private getProviderAdapter(provider: string): ProviderAdapter {
    // Aquí se implementaría una fábrica de adaptadores
    // Por ahora, solo tenemos un adaptador genérico
    return new GenericProviderAdapter();
  }
  
  /**
   * Guarda el resultado de la evaluación en la base de datos
   */
  private async saveEvaluationResult(userId: string, result: CreditEvaluationResult): Promise<void> {
    const supabase = await createClient();
    
    // Actualizar la solicitud
    const { error: updateError } = await supabase
      .from('credit_applications')
      .update({
        application_status: result.status,
        credit_score: result.creditScore,
        approved_amount: result.approvedAmount,
        approved_term: result.approvedTerm,
        monthly_payment: result.monthlyPayment,
        external_request_id: result.externalRequestId,
        external_provider: result.externalProvider,
        external_response: result.externalResponse,
        rejection_reason: result.rejectionReason,
        updated_at: new Date().toISOString()
      })
      .eq('id', result.applicationId);
    
    if (updateError) {
      console.error('Error al actualizar la solicitud con los resultados:', updateError);
      throw new Error('No se pudo guardar el resultado de la evaluación');
    }
    
    // Registrar entrada en el historial de evaluaciones
    const { error: historyError } = await supabase
      .from('credit_evaluation_history')
      .insert({
        application_id: result.applicationId,
        user_id: userId,
        evaluation_timestamp: new Date().toISOString(),
        provider: result.externalProvider || 'unknown',
        credit_score: result.creditScore,
        result: result.status,
        raw_response: result.externalResponse
      });
    
    if (historyError) {
      console.error('Error al registrar historial de evaluación:', historyError);
      // No bloqueamos el proceso por errores en el historial
    }
  }
}

/**
 * Interfaz para los adaptadores de proveedores
 */
interface ProviderAdapter {
  mapRequestData(data: EvaluationData, additionalData?: any): any;
  sendRequest(mappedData: any, config: CreditEvaluationConfig): Promise<any>;
  mapResponseData(response: any, applicationId: string): CreditEvaluationResult;
}

/**
 * Implementación genérica para adaptadores de proveedores de crédito
 */
class GenericProviderAdapter implements ProviderAdapter {
  /**
   * Transforma los datos internos al formato requerido por el proveedor
   */
  mapRequestData(data: EvaluationData, additionalData?: any): any {
    // Implementación genérica que deberá ser personalizada según proveedor
    return {
      requestId: `req-${Date.now()}`,
      applicantInfo: {
        userId: data.userId,
        monthlyIncome: data.financialData.monthlyIncome,
        additionalIncome: data.financialData.additionalIncome || 0,
        personalInfo: additionalData?.profile || {},
        contactInfo: additionalData?.contact || {}
      },
      loanRequest: {
        amount: data.equipmentData.approximateAmount,
        termMonths: data.equipmentData.desiredTerm
      }
    };
  }
  
  /**
   * Envía la solicitud al proveedor externo
   */
  async sendRequest(mappedData: any, config: CreditEvaluationConfig): Promise<any> {
    // Implementación de ejemplo - en realidad sería una llamada HTTP a la API
    
    // Para pruebas, simulamos conexión a API externa
    console.log(`[${config.provider}] Enviando solicitud a API externa`);
    
    // Simular tiempo de respuesta de API externa
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // En un entorno real, aquí se haría fetch a la API externa
    // const response = await fetch(config.apiUrl, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${config.apiKey}`
    //   },
    //   body: JSON.stringify(mappedData),
    //   timeout: config.timeout
    // });
    
    // if (!response.ok) {
    //   throw new Error(`Error en API externa: ${response.status} ${response.statusText}`);
    // }
    
    // return response.json();
    
    // Simular respuesta para desarrollo
    return {
      requestId: `ext-${Date.now()}`,
      creditScore: Math.floor(Math.random() * (850 - 300 + 1)) + 300,
      approved: Math.random() > 0.3,
      approvedAmount: mappedData.loanRequest.amount * 0.9,
      approvedTermMonths: mappedData.loanRequest.termMonths,
      interestRate: 0.15,
      monthlyPayment: mappedData.loanRequest.amount * 0.9 * 0.02,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Transforma la respuesta del proveedor a nuestro formato interno
   */
  mapResponseData(response: any, applicationId: string): CreditEvaluationResult {
    // Mapeo genérico que deberá ser personalizado según proveedor
    
    // Determinar estado
    let status: ApplicationStatus;
    
    if (response.approved) {
      status = ApplicationStatus.APPROVED;
    } else if (response.creditScore > 580) {
      // Si el score es razonable pero no aprobado automáticamente
      status = ApplicationStatus.IN_REVIEW;
    } else {
      status = ApplicationStatus.REJECTED;
    }
    
    return {
      applicationId,
      status,
      creditScore: response.creditScore,
      approvedAmount: response.approved ? response.approvedAmount : undefined,
      approvedTerm: response.approved ? response.approvedTermMonths : undefined,
      monthlyPayment: response.approved ? response.monthlyPayment : undefined,
      rejectionReason: !response.approved ? 'No aprobado por el sistema de evaluación' : undefined,
      externalRequestId: response.requestId,
      externalProvider: 'external-api',
      externalResponse: response
    };
  }
} 