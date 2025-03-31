"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

// Definición de los pasos del formulario
const steps = [
  { 
    id: 1, 
    name: 'Datos Personales', 
    path: '/step/1'
  },
  { 
    id: 2, 
    name: 'Contacto', 
    path: '/step/2'
  },
  { 
    id: 3, 
    name: 'Información Financiera', 
    path: '/step/3'
  },
  { 
    id: 4, 
    name: 'Equipo de Interés', 
    path: '/step/4'
  },
  { 
    id: 5, 
    name: 'Confirmación', 
    path: '/step/5'
  },
];

export function ProgressBar() {
  const pathname = usePathname();
  
  // Extraer el número de paso actual de la ruta
  const currentStepMatch = pathname.match(/\/step\/(\d+)/);
  const currentStep = currentStepMatch ? parseInt(currentStepMatch[1], 10) : 0;
  
  return (
    <div className="py-4">
      <div className="hidden sm:block">
        <nav aria-label="Progress">
          <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li 
                key={step.id} 
                className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}
              >
                {step.id < currentStep ? (
                  // Paso completado
                  <div className="group flex items-center">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-green-600 rounded-full">
                      <svg 
                        className="h-6 w-6 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </span>
                    {stepIdx !== steps.length - 1 ? (
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="h-0.5 w-full bg-green-600">
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : step.id === currentStep ? (
                  // Paso actual
                  <div className="group flex items-center" aria-current="step">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center border-2 border-blue-600 rounded-full">
                      <span className="text-blue-600 font-medium">{step.id}</span>
                    </span>
                    <span className="ml-3 text-sm font-medium text-blue-600">
                      {step.name}
                    </span>
                    {stepIdx !== steps.length - 1 ? (
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="h-0.5 w-full bg-gray-200">
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  // Paso pendiente
                  <div className="group flex items-center">
                    <span className="flex-shrink-0 h-10 w-10 flex items-center justify-center border-2 border-gray-300 rounded-full">
                      <span className="text-gray-500">{step.id}</span>
                    </span>
                    <span className="ml-3 text-sm font-medium text-gray-500">
                      {step.name}
                    </span>
                    {stepIdx !== steps.length - 1 ? (
                      <div className="ml-4 min-w-0 flex-1">
                        <div className="h-0.5 w-full bg-gray-200">
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>
      
      {/* Versión móvil - Simplificada */}
      <div className="sm:hidden">
        <div className="text-center mb-4">
          <p className="text-sm font-medium text-gray-500">
            Paso {currentStep} de {steps.length}
          </p>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            {steps.find(step => step.id === currentStep)?.name || 'Solicitud de Arrendamiento'}
          </h3>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
} 