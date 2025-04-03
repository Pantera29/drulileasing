"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentSchema, type EquipmentFormData } from '@/lib/schemas/equipment-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { useRouter } from 'next/navigation';

interface EquipmentFormProps {
  initialData?: Partial<EquipmentFormData>;
  onSubmit: (data: EquipmentFormData) => Promise<boolean>;
  applicationId: string;
}

export function EquipmentForm({ 
  initialData, 
  onSubmit, 
  applicationId 
}: EquipmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  const defaultValues = {
    equipment_type: 'Genérico',
    equipment_model: 'Estándar',
    approximate_amount: 100000, // Mínimo requerido por el esquema
    desired_term: 24, // Default 24 meses
    additional_comments: '',
  };
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    getValues,
    trigger,
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues,
  });
  
  // Monitorear el valor actual del monto
  const currentAmount = watch('approximate_amount');
  const currentTerm = watch('desired_term');
  
  // Configurar valores por defecto al cargar
  useEffect(() => {
    // Ya no necesitamos establecer estos valores porque los campos ya no existen
    // Solo aseguramos que el monto sea válido
    if (!currentAmount || currentAmount < 10000) {
      setValue('approximate_amount', 10000, { shouldValidate: true });
    }
  }, [setValue, currentAmount]);
  
  const handleFormSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Asegurar valores mínimos y enviar solo los campos que existen en la tabla
      const formData = {
        approximate_amount: Math.max(10000, data.approximate_amount || 10000),
        desired_term: data.desired_term || 24,
        additional_comments: data.additional_comments || null
      };
      
      console.log('Enviando datos simplificados:', formData);
      
      // Llamada simplificada al servidor
      const success = await onSubmit(formData as EquipmentFormData);
      
      if (success) {
        console.log('¡Datos guardados correctamente!');
        setSaveSuccess(true);
        
        // Navegar después de un breve retraso
        setTimeout(() => {
          console.log('Navegando al siguiente paso...');
          router.push('/application/step/5');
        }, 1500);
        
        return true;
      } else {
        console.error('El servidor devolvió false');
        setSaveError('No se pudieron guardar los datos. Por favor intenta nuevamente.');
        return false;
      }
    } catch (error) {
      console.error('Error en el cliente:', error);
      setSaveError('Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper para StepNavigation que se asegura de devolver un boolean
  const handleStepSave = async () => {
    console.log('Guardando datos del formulario de equipo...');
    try {
      // Utilizar handleSubmit para validar y procesar el formulario
      const success = await handleSubmit(async (data) => {
        // Procesar directamente aquí para evitar problemas con retorno de valores
        return await handleFormSubmit(data);
      })();
      
      return success === undefined ? true : success;
    } catch (error) {
      console.error('Error al guardar datos de equipo:', error);
      return false;
    }
  };

  // Calcular la tasa de interés según monto y plazo
  // (copiada del simulador de la landing)
  const calculateInterestRate = (amount: number, term: number): number => {
    // Tasa base
    let rate = 0.15;

    // Ajustes según el monto (montos más altos, tasas menores)
    if (amount > 1000000) rate -= 0.01;
    if (amount > 1500000) rate -= 0.005;

    // Ajustes según el plazo (plazos más largos, tasas mayores)
    if (term > 24) rate += 0.005;
    if (term > 36) rate += 0.005;

    return rate;
  };
  
  // Calcular pago mensual estimado con la misma lógica del simulador de la landing
  const calculateMonthlyPayment = () => {
    if (!currentAmount || currentAmount < 10000 || !currentTerm) return 0;
    
    // Calcular la tasa según los parámetros
    const annualRate = calculateInterestRate(currentAmount, currentTerm);
    const monthlyRate = annualRate / 12;
    
    try {
      // Fórmula: P = A * r * (1 + r)^n / ((1 + r)^n - 1)
      // Donde P = pago mensual, A = monto, r = tasa mensual, n = número de pagos
      const numerator = currentAmount * monthlyRate * Math.pow(1 + monthlyRate, currentTerm);
      const denominator = Math.pow(1 + monthlyRate, currentTerm) - 1;
      
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        console.error('Error en cálculo de pago mensual:', { currentAmount, currentTerm, numerator, denominator });
        return 0;
      }
      
      return numerator / denominator;
    } catch (calcError) {
      console.error('Error al calcular pago mensual:', calcError);
      return 0;
    }
  };
  
  // Formato para valores monetarios
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });
  };
  
  const monthlyPayment = calculateMonthlyPayment();

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(handleFormSubmit)();
      }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Equipo de Interés
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
          {/* Eliminamos el selector de equipo y lo reemplazamos con el título */}
          <div className="border-b pb-6">
            <h3 className="font-medium text-gray-700 mb-4">
              Información del financiamiento:
            </h3>
          </div>
          
          {/* Monto y plazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="approximate_amount" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Monto aproximado (MXN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="approximate_amount"
                  type="number"
                  min="10000"
                  step="1000"
                  defaultValue={100000}
                  {...register('approximate_amount', { 
                    valueAsNumber: true,
                    min: 10000
                  })}
                  className="block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="100000"
                />
              </div>
              {errors.approximate_amount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.approximate_amount.message}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="desired_term" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Plazo deseado (meses)
              </label>
              <select
                id="desired_term"
                {...register('desired_term', { 
                  valueAsNumber: true
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="48">48 meses</option>
                <option value="60">60 meses</option>
              </select>
              {errors.desired_term && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.desired_term.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Información de pago estimado */}
          {currentAmount > 0 && currentTerm > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800">
                Pago mensual estimado*
              </h4>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {formatCurrency(monthlyPayment)}
              </p>
              <div className="flex justify-between mt-2">
                <p className="text-xs text-blue-500">
                  *Este es un cálculo aproximado. El monto final dependerá de la evaluación de crédito.
                </p>
                <p className="text-xs font-medium text-blue-700">
                  Tasa anual: {(calculateInterestRate(currentAmount, currentTerm) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          )}
          
          {/* Comentarios adicionales */}
          <div>
            <label 
              htmlFor="additional_comments" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Comentarios adicionales (opcional)
            </label>
            <textarea
              id="additional_comments"
              rows={3}
              {...register('additional_comments')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Especificaciones o requerimientos especiales"
            />
            {errors.additional_comments && (
              <p className="mt-1 text-sm text-red-600">
                {errors.additional_comments.message}
              </p>
            )}
          </div>
        </div>
        
        <StepNavigation 
          currentStep={4} 
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
} 