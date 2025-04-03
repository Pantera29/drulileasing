import { ReactNode } from 'react';

interface StepLayoutProps {
  children: ReactNode;
  currentStep: number;
  title: string;
  description?: string;
}

export function StepLayout({ 
  children, 
  currentStep, 
  title, 
  description 
}: StepLayoutProps) {
  const totalSteps = 5;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Progreso */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                i + 1 === currentStep 
                  ? 'bg-blue-600 text-white' 
                  : i + 1 < currentStep 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-200 text-gray-600'
              }`}
            >
              {i + 1 < currentStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
          ))}
        </div>
        <div className="relative h-2 bg-gray-200 rounded overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-600"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
        <div className="text-right text-sm text-gray-500 mt-1">
          Paso {currentStep} de {totalSteps}
        </div>
      </div>
      
      {/* Título y descripción */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">{title}</h1>
        {description && <p className="text-gray-600">{description}</p>}
      </div>
      
      {/* Contenido */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {children}
      </div>
    </div>
  );
} 