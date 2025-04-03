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

// Archivo principal para servicios de evaluación de crédito
import { ApplicationStatus, CreditEvaluationResult } from './types';
import { SimulatedEvaluationService } from './simulated-evaluation.service';
import { createClient } from '@/lib/supabase/server';

// Exportación de tipos
export * from './types';

// Instancia del servicio
const evaluationService = new SimulatedEvaluationService();

/**
 * Función principal para iniciar la evaluación de crédito de una solicitud
 */
export async function evaluateApplication(applicationId: string): Promise<CreditEvaluationResult | null> {
  console.log('Iniciando evaluación de crédito para aplicación:', applicationId);
  
  try {
    const supabase = await createClient();
    
    // Verificar el estado actual antes de comenzar
    const { data: currentApp } = await supabase
      .from('credit_applications')
      .select('id, application_status')
      .eq('id', applicationId)
      .single();
    
    console.log('Estado actual antes de evaluación:', currentApp?.application_status);
    
    // IMPORTANTE: Ya no actualizamos el estado a pending_nip aquí
    // Este cambio debe ocurrir en el paso 5 cuando el usuario acepta los términos y condiciones
    // y autoriza la consulta al buró de crédito.
    // Ahora asumimos que la aplicación ya está en estado pending_nip cuando llega aquí.
    
    // Obtener todos los datos necesarios para la evaluación
    const { data, error } = await supabase
      .from('credit_applications')
      .select(`
        id,
        user_id,
        credit_check_authorized,
        terms_accepted,
        financial_id,
        equipment_id
      `)
      .eq('id', applicationId)
      .single();
      
    if (error || !data) {
      console.error('Error al obtener datos para evaluación:', error);
      throw new Error('No se pudieron obtener los datos para la evaluación');
    }
    
    // Obtener información financiera
    const { data: financialInfo, error: financialError } = await supabase
      .from('financial_info')
      .select('monthly_income, additional_income')
      .eq('id', data.financial_id)
      .single();
      
    if (financialError || !financialInfo) {
      console.error('Error al obtener información financiera:', financialError);
      throw new Error('No se pudo obtener la información financiera');
    }
    
    // Obtener información del equipo
    const { data: equipmentInfo, error: equipmentError } = await supabase
      .from('equipment_requests')
      .select('approximate_amount, desired_term, additional_comments')
      .eq('id', data.equipment_id)
      .single();
      
    if (equipmentError || !equipmentInfo) {
      console.error('Error al obtener información del equipo:', equipmentError);
      throw new Error('No se pudo obtener la información del equipo');
    }
    
    // Preparar los datos en el formato requerido por el servicio
    const evaluationData = {
      applicationId,
      userId: data.user_id,
      financialData: {
        monthlyIncome: financialInfo.monthly_income,
        additionalIncome: financialInfo.additional_income || 0,
      },
      equipmentData: {
        // Usamos valores por defecto para los campos que no existen
        equipmentType: 'No especificado',
        equipmentBrand: 'No especificado',
        equipmentModel: 'No especificado',
        approximateAmount: equipmentInfo.approximate_amount,
        desiredTerm: equipmentInfo.desired_term,
      },
      termsAccepted: data.terms_accepted,
      creditCheckAuthorized: data.credit_check_authorized,
    };
    
    // Realizar la evaluación con el servicio seleccionado
    return await evaluationService.processApplicationData(evaluationData);
  } catch (error) {
    console.error('Error durante el proceso de evaluación:', error);
    return null;
  }
} 