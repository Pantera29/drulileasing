import React from 'react';
import { ProgressBar } from './progress-bar';
import Link from 'next/link';

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

export function ApplicationLayout({ children }: ApplicationLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">D</div>
              <span className="font-bold text-xl">Druli</span>
            </Link>
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