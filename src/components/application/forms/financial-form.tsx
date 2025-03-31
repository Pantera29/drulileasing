"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { financialSchema, type FinancialFormData } from '@/lib/schemas/financial-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { FileUploader } from '@/components/application/ui/file-uploader';
import { useRouter } from 'next/navigation';

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
  
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FinancialFormData>({
    resolver: zodResolver(financialSchema),
    defaultValues,
  });
  
  // Función para manejar cambios en el archivo subido
  const handleFileUploaded = (url: string) => {
    setIncomeProofUrl(url);
    setValue('income_proof_url', url, { shouldValidate: true });
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
      const result = await handleSubmit(handleFormSubmit)();
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
    <div>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(handleFormSubmit)();
      }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Información Financiera
        </h2>
        
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
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
        
        <div className="space-y-6">
          {/* Ocupación y empresa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="occupation" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ocupación / Profesión
              </label>
              <input
                id="occupation"
                type="text"
                {...register('occupation')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ej: Médico, Contador, etc."
              />
              {errors.occupation && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.occupation.message}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="company_name" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Empresa o Consultorio
              </label>
              <input
                id="company_name"
                type="text"
                {...register('company_name')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nombre del lugar donde trabaja"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.company_name.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Tiempo de empleo */}
          <div>
            <label 
              htmlFor="employment_time" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Antigüedad laboral
            </label>
            <input
              id="employment_time"
              type="text"
              {...register('employment_time')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ej: 2 años, 6 meses"
            />
            {errors.employment_time && (
              <p className="mt-1 text-sm text-red-600">
                {errors.employment_time.message}
              </p>
            )}
          </div>
          
          {/* Ingresos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="monthly_income" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ingreso mensual (MXN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="monthly_income"
                  type="number"
                  min="0"
                  step="1000"
                  {...register('monthly_income', { 
                    valueAsNumber: true
                  })}
                  className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              {errors.monthly_income && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.monthly_income.message}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="additional_income" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ingresos adicionales (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="additional_income"
                  type="number"
                  min="0"
                  step="1000"
                  {...register('additional_income', { 
                    valueAsNumber: true
                  })}
                  className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              {errors.additional_income && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.additional_income.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Comprobante de ingresos */}
          <div>
            <label 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Comprobante de ingresos
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Sube un documento que compruebe tus ingresos (recibo de nómina, estados de cuenta, declaración fiscal, etc.)
            </p>
            
            <FileUploader
              bucketName="druli1"
              folderPath="income_proofs"
              fileType="income_proof"
              userId={userId}
              onFileUploaded={handleFileUploaded}
              existingFileUrl={initialData?.income_proof_url || null}
              allowedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              maxSizeMB={5}
            />
          </div>
        </div>
        
        <StepNavigation 
          currentStep={3} 
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
} 