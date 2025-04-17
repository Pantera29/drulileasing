"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { financialSchema, type FinancialFormData } from '@/lib/schemas/financial-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { FileUploader } from '@/components/application/ui/file-uploader';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, BanknoteIcon, ArrowUpIcon } from 'lucide-react';

interface FinancialFormProps {
  initialData?: Partial<FinancialFormData>;
  onSubmit: (data: FinancialFormData) => Promise<boolean>;
  applicationId: string;
  userId: string;
}

export function FinancialForm({ 
  initialData, 
  onSubmit, 
  applicationId,
  userId
}: FinancialFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incomeProofUrl, setIncomeProofUrl] = useState(initialData?.income_proof_url || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  
  const defaultValues = {
    occupation: initialData?.occupation || '',
    company_name: initialData?.company_name || '',
    employment_time: initialData?.employment_time || '',
    monthly_income: initialData?.monthly_income || 0,
    additional_income: initialData?.additional_income || 0,
    income_proof_url: initialData?.income_proof_url || '',
  };
  
  const form = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues,
  });
  
  // Función para manejar cambios en el archivo subido
  const handleFileUploaded = (url: string) => {
    setIncomeProofUrl(url);
    form.setValue('income_proof_url', url, { shouldValidate: true });
  };
  
  const handleFormSubmit = async (data: FinancialFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Asegurar que la URL del comprobante de ingresos esté incluida
      const formData = {
        ...data,
        income_proof_url: incomeProofUrl,
      };
      
      const success = await onSubmit(formData);
      
      if (success) {
        console.log('Datos financieros guardados exitosamente');
        setSaveSuccess(true);
        // Esperamos un momento antes de navegar al siguiente paso
        setTimeout(() => {
          router.push(`/application/step/4`);
        }, 500);
        return true;
      } else {
        console.error('Error al guardar los datos financieros: el servidor retornó false');
        setSaveError('No se pudieron guardar los datos. Por favor intenta nuevamente.');
        return false;
      }
    } catch (error) {
      console.error('Error al guardar la información financiera:', error);
      setSaveError('Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper para StepNavigation que se asegura de devolver un boolean
  const handleStepSave = async () => {
    console.log('Guardando datos del formulario financiero...');
    try {
      const result = await form.handleSubmit(handleFormSubmit)();
      // Si handleSubmit no devuelve nada, asumimos que fue exitoso (no hubo errores de validación)
      return result !== undefined ? result : true;
    } catch (error) {
      console.error('Error al guardar datos financieros:', error);
      return false;
    }
  };

  // Formatear valores monetarios
  const formatCurrency = (value: number | string) => {
    if (!value) return '';
    
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });
  };

  return (
    <Card className="w-full shadow-md border-gray-200">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <BanknoteIcon className="h-5 w-5 text-green-500" />
          Información Financiera
        </h2>
        <p className="text-sm text-gray-500">
          Cuéntanos sobre tu situación financiera y capacidad de pago
        </p>
      </CardHeader>
      
      <CardContent className="pt-2">
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
            <CheckCircle className="text-green-500 h-5 w-5" />
            <p className="text-green-800 text-sm font-medium">
              ¡Datos guardados correctamente! Redirigiendo al siguiente paso...
            </p>
          </div>
        )}
        
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm font-medium">
              {saveError}
            </p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Información laboral */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-gray-700">
                  Información Laboral
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="occupation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ocupación / Profesión</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: Médico, Contador, etc." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa o Consultorio</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nombre del lugar donde trabaja" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-3">
                <FormField
                  control={form.control}
                  name="employment_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Antigüedad laboral</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ej: 2 años, 6 meses" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Información de ingresos */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-medium text-gray-700 mb-2">Información de Ingresos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="monthly_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingreso mensual (MXN)</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            className="pl-7"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Ingreso principal mensual después de impuestos
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additional_income"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingresos adicionales (opcional)</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            className="pl-7"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Otros ingresos que puedas comprobar
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Comprobante de ingresos */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-medium text-gray-700 mb-2">Comprobante de Ingresos</h3>
              
              <FormField
                control={form.control}
                name="income_proof_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Sube un comprobante de ingresos
                    </FormLabel>
                    <FormControl>
                      <div>
                        <FileUploader
                          onFileUploaded={handleFileUploaded}
                          userId={userId}
                          bucketName="druli1"
                          folderPath="income_proofs"
                          fileType="income_proof"
                          existingFileUrl={incomeProofUrl}
                          allowedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
                          maxSizeMB={5}
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs">
                      Puedes subir estados de cuenta, recibos de nómina, o declaraciones de impuestos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t border-gray-100">
        <StepNavigation
          currentStep={3}
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </CardFooter>
    </Card>
  );
} 