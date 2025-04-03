"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onSave: () => Promise<boolean>; // Devuelve true si el guardado fue exitoso
  isSubmitting: boolean;
  nextButtonText?: string; // Texto personalizado para el botón final
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onSave,
  isSubmitting,
  nextButtonText
}: StepNavigationProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const handleNext = async () => {
    if (isSubmitting || isNavigating) return;
    
    setIsNavigating(true);
    try {
      console.log('Guardando antes de navegar al siguiente paso...');
      const saveSuccess = await onSave();
      
      if (saveSuccess) {
        if (currentStep < totalSteps) {
          console.log(`Navegando al paso ${currentStep + 1}`);
          router.push(`/application/step/${currentStep + 1}`);
          // No reseteamos isNavigating porque vamos a navegar a otra página
          return;
        }
      } else {
        console.error('No se pudo guardar el formulario para avanzar');
      }
    } catch (error) {
      console.error('Error al intentar guardar y avanzar:', error);
    }
    
    // Solo llegamos aquí si hay un error o si no se navega a otra página
    setIsNavigating(false);
  };
  
  const handleSaveAndExit = async () => {
    if (isSubmitting || isNavigating) return;
    
    setIsNavigating(true);
    try {
      console.log('Guardando antes de salir al dashboard...');
      const saveSuccess = await onSave();
      
      if (saveSuccess) {
        console.log('Navegando al dashboard');
        router.push('/dashboard');
        // No reseteamos isNavigating porque vamos a navegar a otra página
        return;
      } else {
        console.error('No se pudo guardar el formulario para salir');
      }
    } catch (error) {
      console.error('Error al intentar guardar y salir:', error);
    }
    
    // Solo llegamos aquí si hay un error
    setIsNavigating(false);
  };
  
  const isDisabled = isSubmitting || isNavigating;
  
  return (
    <div className="mt-8 pt-5 border-t border-gray-200 flex justify-between items-center">
      <div>
        {currentStep > 1 && (
          <Link
            href={`/application/step/${currentStep - 1}`}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}
            onClick={(e) => {
              if (isDisabled) {
                e.preventDefault();
              }
            }}
          >
            <svg 
              className="mr-2 h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
            Anterior
          </Link>
        )}
      </div>
      
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleSaveAndExit}
          disabled={isDisabled}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          {isNavigating ? 'Guardando...' : 'Guardar y salir'}
        </button>
        
        {currentStep < totalSteps ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={isDisabled}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isNavigating ? 'Guardando...' : 'Siguiente'}
            {!isNavigating && (
              <svg 
                className="ml-2 h-5 w-5" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSave}
            disabled={isDisabled}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting || isNavigating ? (
              <>
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isSubmitting ? nextButtonText && nextButtonText.includes('...') ? nextButtonText : 'Enviando...' : 'Guardando...'}
              </>
            ) : (
              nextButtonText || 'Finalizar solicitud'
            )}
          </button>
        )}
      </div>
    </div>
  );
} 