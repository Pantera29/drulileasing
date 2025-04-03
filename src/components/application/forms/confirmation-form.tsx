"use client";

import React, { useState } from 'react';
import { SummaryView } from '@/components/application/ui/summary-view';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { useRouter } from 'next/navigation';

// Tipo para la respuesta del servidor
interface SubmitResponse {
  success: boolean;
  redirectTo: string | null;
  message: string;
}

interface ConfirmationFormProps {
  summaryData: any;
  onSubmit: (data: { 
    creditCheckAuthorized: boolean; 
    termsAccepted: boolean;
  }) => Promise<SubmitResponse>;
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  
  const handleFormSubmit = async () => {
    setError(null);
    setSuccessMessage(null);
    
    // Validar que ambos checkboxes estén marcados
    if (!creditCheckAuthorized || !termsAccepted) {
      setError('Debes autorizar la consulta al buró de crédito y aceptar los términos y condiciones para continuar.');
      return false;
    }
    
    setIsSubmitting(true);
    try {
      const response = await onSubmit({
        creditCheckAuthorized,
        termsAccepted,
      });

      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        // Si hay una URL de redirección, redirigimos después de mostrar un mensaje de éxito
        if (response.redirectTo) {
          setSuccessMessage(`${response.message}`);
          setTimeout(() => {
            router.push(response.redirectTo as string);
          }, 1500);
        } else {
          // Sin URL de redirección, vamos al dashboard como fallback
          setSuccessMessage('¡Solicitud enviada! Redirigiendo al dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        }
        return true;
      } else {
        setError(response.message || 'Ocurrió un error al procesar tu solicitud.');
        return false;
      }
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
          Por favor revisa los datos de tu solicitud antes de finalizar. Al continuar, te enviaremos un código de verificación por WhatsApp para confirmar tu identidad.
        </p>
        
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm font-medium">
              {successMessage}
            </p>
          </div>
        )}
        
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
          
          <div className="mt-4 rounded-md bg-blue-50 border border-blue-100 p-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Al dar clic en 'Finalizar solicitud', recibirás un código de verificación en tu WhatsApp. Deberás ingresar ese código en el siguiente paso para completar tu solicitud.
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
          nextButtonText={isSubmitting ? "Enviando..." : "Finalizar solicitud"}
        />
      </div>
    </div>
  );
} 