import { createClient } from '@/lib/supabase/server';
import {
  ApplicationStatus,
  CreditEvaluationResult,
  CreditEvaluationService,
  EvaluationData,
  FinancialData,
  EquipmentRequestData
} from './types';

/**
 * Servicio de evaluación crediticia simulada
 * Implementa reglas básicas de decisión para desarrollo y pruebas
 */
export class SimulatedEvaluationService implements CreditEvaluationService {
  
  /**
   * Evalúa una solicitud existente por su ID
   */
  async evaluateApplication(applicationId: string): Promise<CreditEvaluationResult> {
    console.log(`[SimulatedEvaluationService] Evaluando solicitud ${applicationId}`);
    
    const supabase = await createClient();
    
    // Obtener datos de la solicitud
    const { data: application, error: appError } = await supabase
      .from('credit_applications')
      .select(`
        id,
        user_id,
        financial_id,
        equipment_id,
        terms_accepted,
        credit_check_authorized
      `)
      .eq('id', applicationId)
      .single();
    
    if (appError || !application) {
      console.error('Error al obtener la solicitud:', appError);
      throw new Error(`No se pudo encontrar la solicitud ${applicationId}`);
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
    
    // Procesar la evaluación
    return this.processApplicationData(evaluationData);
  }
  
  /**
   * Procesa los datos de la solicitud y realiza la evaluación
   */
  async processApplicationData(data: EvaluationData): Promise<CreditEvaluationResult> {
    console.log(`[SimulatedEvaluationService] Procesando datos para solicitud ${data.applicationId}`);
    
    // Generar puntuación crediticia simulada (entre 300 y 850)
    const creditScore = this.generateCreditScore();
    
    // MODIFICACIÓN: Todas las solicitudes van a estado pendiente de análisis
    // en lugar de aplicar las reglas de decisión automáticas
    const status = ApplicationStatus.PENDING_ANALYSIS;
    
    // Guardamos la información original para referencia del analista
    // pero no tomamos una decisión automática
    const monthlyIncome = data.financialData.monthlyIncome;
    const requestedAmount = data.equipmentData.approximateAmount;
    const requestedTerm = data.equipmentData.desiredTerm;
    
    // Crear resultado
    const result: CreditEvaluationResult = {
      applicationId: data.applicationId,
      status,
      creditScore,
      externalProvider: 'simulated',
      externalRequestId: `sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      externalResponse: {
        simulatedScore: creditScore,
        requestedAmount,
        requestedTerm,
        monthlyIncome,
        decision: status,
        evaluationTime: new Date().toISOString()
      }
    };
    
    // Guardar resultados en la base de datos
    await this.saveEvaluationResult(data.userId, result);
    
    return result;
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
        external_request_id: result.externalRequestId,
        external_provider: result.externalProvider,
        external_response: result.externalResponse,
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
        provider: result.externalProvider || 'simulated',
        credit_score: result.creditScore,
        result: result.status,
        raw_response: result.externalResponse
      });
    
    if (historyError) {
      console.error('Error al registrar historial de evaluación:', historyError);
      // No bloqueamos el proceso por errores en el historial
    }
  }
  
  /**
   * Genera una puntuación crediticia aleatoria entre 300 y 850
   */
  private generateCreditScore(): number {
    return Math.floor(Math.random() * (850 - 300 + 1)) + 300;
  }
  
  /**
   * Calcula el porcentaje del monto a aprobar basado en la puntuación crediticia
   */
  private calculateApprovalPercentage(creditScore: number): number {
    // Entre 85% y 95% dependiendo de la puntuación
    if (creditScore > 800) return 0.95;
    if (creditScore > 750) return 0.92;
    if (creditScore > 700) return 0.90;
    return 0.85;
  }
  
  /**
   * Calcula el pago mensual basado en monto, plazo y tasa de interés
   */
  private calculateMonthlyPayment(amount: number, termMonths: number, annualRate: number): number {
    const monthlyRate = annualRate / 12;
    return Math.round(
      (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
      (Math.pow(1 + monthlyRate, termMonths) - 1)
    );
  }
  
  /**
   * Determina una razón general para el rechazo
   */
  private determineRejectionReason(creditScore: number, monthlyIncome: number): string {
    if (creditScore <= 580 && monthlyIncome <= 20000) {
      return 'No se cumple con los requisitos mínimos de ingresos y historial crediticio';
    } else if (creditScore <= 580) {
      return 'Historial crediticio insuficiente';
    } else {
      return 'Ingresos mensuales insuficientes para el monto solicitado';
    }
  }
} 