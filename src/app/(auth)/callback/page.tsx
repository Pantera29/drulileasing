"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando tu cuenta...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Obtener los parámetros de la URL
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const error = searchParams.get('error');
        const error_description = searchParams.get('error_description');

        // Si hay un error, mostrarlo
        if (error) {
          setStatus('error');
          setMessage(error_description || 'Error en la verificación');
          return;
        }

        // Si tenemos tokens, intentar establecer la sesión
        if (access_token && refresh_token) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (sessionError) {
            console.error('Error al establecer sesión:', sessionError);
            setStatus('error');
            setMessage('Error al verificar tu cuenta. Por favor intenta nuevamente.');
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('¡Cuenta verificada exitosamente! Redirigiendo al dashboard...');
            
            // Redirigir directamente al dashboard
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
            return;
          }
        }

        // Si no hay tokens pero tampoco error, verificar si ya hay una sesión activa
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setStatus('success');
          setMessage('¡Cuenta verificada exitosamente! Redirigiendo al dashboard...');
          
          setTimeout(() => {
            router.push('/dashboard');
          }, 1500);
        } else {
          setStatus('error');
          setMessage('No se pudo verificar tu cuenta. Por favor intenta nuevamente.');
        }

      } catch (error) {
        console.error('Error en callback de autenticación:', error);
        setStatus('error');
        setMessage('Ocurrió un error inesperado. Por favor intenta nuevamente.');
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  const handleRetry = () => {
    router.push('/login');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-8 h-8 text-green-500" />
            )}
            {status === 'error' && (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            {status === 'loading' && 'Verificando cuenta...'}
            {status === 'success' && '¡Verificación exitosa!'}
            {status === 'error' && 'Error en la verificación'}
          </h1>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">{message}</p>
          
          {status === 'error' && (
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Intentar nuevamente
              </Button>
              <Button onClick={handleGoHome} variant="outline" className="w-full">
                Ir al inicio
              </Button>
            </div>
          )}
          
          {status === 'loading' && (
            <div className="text-sm text-gray-500">
              Por favor espera mientras verificamos tu cuenta...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 