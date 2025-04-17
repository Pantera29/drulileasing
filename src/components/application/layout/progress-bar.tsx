"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

// Definición de los pasos del formulario
const steps = [
  {
    id: 1,
    name: 'Datos personales',
    path: '/application/step/1'
  },
  {
    id: 2,
    name: 'Datos de contacto',
    path: '/application/step/2'
  },
  {
    id: 3,
    name: 'Datos financieros',
    path: '/application/step/3'
  },
  {
    id: 4,
    name: 'Equipo',
    path: '/application/step/4'
  },
  {
    id: 5,
    name: 'Confirmación',
    path: '/application/step/5'
  }
];

export function ProgressBar() {
  const pathname = usePathname();
  const currentStepMatch = pathname.match(/\/step\/(\d+)/);
  const currentStep = currentStepMatch ? parseInt(currentStepMatch[1], 10) : 0;
  
  return (
    <div className="w-full py-4">
      {/* Versión desktop */}
      <div className="hidden md:block">
        <div className="relative">
          {/* Línea de progreso base */}
          <div className="absolute top-5 left-0 w-full h-[2px] flex justify-between">
            {Array.from({ length: steps.length - 1 }).map((_, idx) => (
              <div key={idx} className="flex-1 mx-4">
                <div className="w-full h-full border-t-2 border-dashed border-gray-200" />
              </div>
            ))}
          </div>
          
          {/* Pasos */}
          <div className="relative flex justify-between">
            {steps.map((step) => {
              const isCompleted = step.id < currentStep;
              const isCurrent = step.id === currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                    isCompleted ? "bg-blue-600 text-white" : 
                    isCurrent ? "border-2 border-blue-600 bg-white text-blue-600" :
                    "border border-gray-200 bg-white text-gray-400"
                  )}>
                    <span className="text-sm font-medium">{step.id}</span>
                    <span className={cn(
                      "text-sm font-medium whitespace-nowrap",
                      isCompleted ? "text-white" :
                      isCurrent ? "text-blue-600" :
                      "text-gray-400"
                    )}>
                      {step.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Versión móvil */}
      <div className="md:hidden">
        <div className="flex flex-col items-center">
          <p className="text-sm font-medium text-gray-500 mb-1">
            Paso {currentStep} de {steps.length}
          </p>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {steps.find(step => step.id === currentStep)?.name}
          </h3>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 