'use server';

import { createClient } from '@/lib/supabase/server';
import { CreditEvaluationFactory, ApplicationStatus } from './index';
import { redirect } from 'next/navigation';

/**
 * Acción del servidor para evaluar una aplicación de crédito
 * y redireccionar al usuario a la página de resultado
 */
export async function evaluateApplication(applicationId: string): Promise<boolean> {
  console.log(`[CreditEvaluationAction] Iniciando evaluación para aplicación ${applicationId}`);
  
  try {
    // Obtener el servicio de evaluación configurado
    const evaluationService = CreditEvaluationFactory.createEvaluationService();
    
    // Realizar la evaluación
    const result = await evaluationService.evaluateApplication(applicationId);
    
    console.log(`[CreditEvaluationAction] Evaluación completada con estado: ${result.status}`);
    
    return true;
  } catch (error) {
    console.error('[CreditEvaluationAction] Error durante la evaluación:', error);
    return false;
  }
}

/**
 * Acción del servidor que evalúa y luego redirecciona
 * según el resultado de la evaluación
 */
export async function evaluateAndRedirect(applicationId: string): Promise<void> {
  console.log(`[CreditEvaluationAction] Evaluando y redireccionando para aplicación ${applicationId}`);
  
  try {
    // Evaluar la aplicación
    await evaluateApplication(applicationId);
    
    // Obtener el estado actual de la aplicación después de la evaluación
    const supabase = await createClient();
    
    const { data: application, error } = await supabase
      .from('credit_applications')
      .select('application_status')
      .eq('id', applicationId)
      .single();
    
    if (error || !application) {
      console.error('[CreditEvaluationAction] Error al obtener estado después de evaluación:', error);
      redirect('/dashboard');
      return;
    }
    
    // Redireccionar según el estado
    switch (application.application_status) {
      case ApplicationStatus.APPROVED:
        redirect(`/result/approved/${applicationId}`);
        break;
      case ApplicationStatus.IN_REVIEW:
        redirect(`/result/reviewing/${applicationId}`);
        break;
      case ApplicationStatus.REJECTED:
        redirect(`/result/rejected/${applicationId}`);
        break;
      default:
        console.warn(`[CreditEvaluationAction] Estado inesperado después de evaluación: ${application.application_status}`);
        redirect('/dashboard');
    }
  } catch (error) {
    console.error('[CreditEvaluationAction] Error durante evaluación y redirección:', error);
    redirect('/dashboard');
  }
} 