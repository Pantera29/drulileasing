"use client";

import React, { useState } from 'react';
import { SummaryView } from '@/components/application/ui/summary-view';
import { StepNavigation } from '@/components/application/layout/step-navigation';

interface ConfirmationFormProps {
  summaryData: any;
  onSubmit: (data: { 
    creditCheckAuthorized: boolean; 
    termsAccepted: boolean;
  }) => Promise<boolean>;
  applicationId: string;
}

export function ConfirmationForm({ 
  summaryData, 
  onSubmit, 
  applicationId 
}: ConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditCheckAuthorized, setCreditCheckAuthorized] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleFormSubmit = async () => {
    setError(null);
    
    // Validar que ambos checkboxes estén marcados
    if (!creditCheckAuthorized || !termsAccepted) {
      setError('Debes autorizar la consulta al buró de crédito y aceptar los términos y condiciones para continuar.');
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const success = await onSubmit({
        creditCheckAuthorized,
        termsAccepted,
      });
      return success;
    } catch (error) {
      console.error('Error al finalizar la solicitud:', error);
      setError('Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Función auxiliar para manejar el guardado
  const handleStepSave = async () => {
    // Solo permite guardar si ambos checkboxes están marcados
    if (!creditCheckAuthorized || !termsAccepted) {
      setError('Debes autorizar la consulta al buró de crédito y aceptar los términos y condiciones para continuar.');
      return false;
    }
    
    return handleFormSubmit();
  };

  return (
    <div>
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Confirmación y Autorización
        </h2>
        <p className="text-gray-600 mb-6">
          Por favor revisa los datos de tu solicitud antes de finalizar.
        </p>
        
        <div className="mb-8">
          <SummaryView data={summaryData} />
        </div>
        
        <div className="bg-white rounded-lg border p-5 space-y-4">
          <h3 className="font-medium text-gray-900">
            Autorización y Términos
          </h3>
          
          <div className="space-y-4">
            {/* Autorización consulta buró */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="credit_check"
                  type="checkbox"
                  checked={creditCheckAuthorized}
                  onChange={(e) => setCreditCheckAuthorized(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="credit_check" className="font-medium text-gray-700">
                  Autorizo la consulta en el buró de crédito
                </label>
                <p className="text-gray-500">
                  Autorizo a Druli Leasing a realizar una consulta de mi historial crediticio para evaluar mi solicitud.
                </p>
              </div>
            </div>
            
            {/* Términos y condiciones */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium text-gray-700">
                  Acepto los términos y condiciones
                </label>
                <p className="text-gray-500">
                  He leído y acepto los <a href="#" className="text-blue-600 underline">términos y condiciones</a> y el <a href="#" className="text-blue-600 underline">aviso de privacidad</a> de Druli Leasing.
                </p>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}
        </div>
        
        <StepNavigation 
          currentStep={5} 
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 