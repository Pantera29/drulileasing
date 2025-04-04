'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditBureauLoading } from '@/components/application/credit-bureau-loading';

const NipSchema = z.object({
  nip: z
    .string()
    .min(6, { message: 'El NIP debe tener 6 dígitos' })
    .max(6, { message: 'El NIP debe tener 6 dígitos' })
    .regex(/^\d+$/, { message: 'El NIP solo debe contener números' })
});

type NipFormValues = z.infer<typeof NipSchema>;

interface NipFormProps {
  onSubmit: (data: NipFormValues) => Promise<{
    success: boolean;
    message?: string;
    redirectTo?: string;
  }>;
  applicationId: string;
  kibanRequestId: string;
  onResendNip?: () => Promise<{
    success: boolean;
    message: string;
    kibanRequestId?: string;
  }>;
}

export function NipForm({ onSubmit, applicationId, kibanRequestId, onResendNip }: NipFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false); // Estado para la consulta al buró
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const form = useForm<NipFormValues>({
    resolver: zodResolver(NipSchema),
    defaultValues: {
      nip: ''
    }
  });
  
  const handleSubmit = async (data: NipFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await onSubmit(data);
      
      if (response.success) {
        // Si la validación fue exitosa, mostrar el estado de consulta al buró
        setIsQuerying(true);
        setSuccessMessage('NIP validado correctamente. Consultando buró de crédito...');
        
        // Redirigir a la página correspondiente después de que se complete la consulta
        if (response.redirectTo) {
          // Damos más tiempo para que se complete todo el proceso
          setTimeout(() => {
            setIsQuerying(false);
            router.push(response.redirectTo as string);
          }, 20000); // 20 segundos para la consulta y evaluación
        }
      } else {
        setError(response.message || 'Error al validar el NIP');
        form.reset();
      }
    } catch (err) {
      setError('Ocurrió un error al validar el NIP. Intente de nuevo más tarde.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendNip = async () => {
    setError(null);
    setIsSubmitting(true);
    
    if (onResendNip) {
      try {
        const response = await onResendNip();
        
        if (response.success) {
          setSuccessMessage(response.message);
          
          // Recargar la página después de un breve retraso para actualizar el kibanRequestId
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Ocurrió un error al reenviar el código. Intente de nuevo más tarde.');
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
      alert('Función de reenvío no implementada. Por favor contacta a soporte si no recibiste el código.');
    }
  };
  
  return (
    <div>
      {/* Componente de carga para consulta al buró */}
      <CreditBureauLoading isLoading={isQuerying} />
      
      {successMessage ? (
        <div className="p-4 bg-green-100 text-green-800 rounded-md text-center mb-4">
          {successMessage}
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded-md text-center">
                {error}
              </div>
            )}
            
            <FormField
              control={form.control}
              name="nip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de verificación (6 dígitos)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isSubmitting || isQuerying}
                      placeholder="Ingresa el código de 6 dígitos"
                      maxLength={6}
                      className="text-center text-2xl tracking-widest"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex flex-col space-y-3">
              <Button type="submit" disabled={isSubmitting || isQuerying} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? 'Verificando...' : 'Verificar código'}
              </Button>
              
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleResendNip} 
                className="text-sm"
                disabled={isSubmitting || isQuerying}
              >
                ¿No recibiste el código? Reenviar
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
} 