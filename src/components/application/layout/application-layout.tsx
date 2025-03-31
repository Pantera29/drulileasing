import React from 'react';
import { ProgressBar } from './progress-bar';
import Image from 'next/image';

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

export function ApplicationLayout({ children }: ApplicationLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            {/* Logo de Druli - Asegúrate de tener la imagen en public/logo.png */}
            <Image 
              src="/logo.png" 
              alt="Druli" 
              width={120} 
              height={40} 
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <ProgressBar />
          <div className="mt-8">
            {children}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Druli Leasing. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
} 