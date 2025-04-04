'use client';

import React, { useState, useEffect } from 'react';

const messages = [
  "Conectando con el buró de crédito...", // 0-5s
  "Verificando historial crediticio...",  // 5-10s
  "Analizando tus datos...",         // 10-15s
  "Procesando resultados..."             // 15-20s
];

interface CreditBureauLoadingProps {
  isLoading: boolean;
}

export function CreditBureauLoading({ isLoading }: CreditBureauLoadingProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  
  useEffect(() => {
    if (!isLoading) return;
    
    // Cambiar mensaje cada 5 segundos
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  if (!isLoading) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="flex flex-col items-center">
          {/* Spinner animation */}
          <div className="mb-6">
            <svg 
              className="animate-spin h-12 w-12 text-blue-600" 
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
          </div>
          
          {/* Primary message (changes every 5 seconds) */}
          <p className="text-lg font-semibold text-gray-800 mb-2 text-center">
            {messages[messageIndex]}
          </p>
          
          {/* Secondary message (static) */}
          <p className="text-sm text-gray-500 text-center">
            Este proceso toma aproximadamente 20 segundos
          </p>
        </div>
      </div>
    </div>
  );
} 