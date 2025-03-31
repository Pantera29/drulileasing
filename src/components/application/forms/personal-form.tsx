"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalSchema, type PersonalFormData } from '@/lib/schemas/personal-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { useRouter } from 'next/navigation';

interface PersonalFormProps {
  initialData?: Partial<PersonalFormData>;
  onSubmit: (data: PersonalFormData) => Promise<boolean>;
  applicationId: string;
}

export function PersonalForm({ initialData, onSubmit, applicationId }: PersonalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  
  // Convertir la cadena de fecha a objeto Date si existe
  const defaultValues = initialData 
    ? {
        ...initialData,
        birth_date: initialData.birth_date 
          ? new Date(initialData.birth_date) 
          : undefined,
      }
    : {
        full_name: '',
        birth_date: undefined,
        curp_rfc: '',
        marital_status: undefined,
        dependents: 0,
      };
      
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PersonalFormData>({
    resolver: zodResolver(personalSchema),
    defaultValues,
  });
  
  // Función para convertir a mayúsculas mientras se escribe
  const handleCurpRfcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;
    
    // Convertir a mayúsculas manteniendo la posición del cursor
    const upperValue = value.toUpperCase();
    
    if (value !== upperValue) {
      setValue('curp_rfc', upperValue, { shouldValidate: true });
      
      // Restaurar la posición del cursor después del cambio
      setTimeout(() => {
        input.setSelectionRange(start, end);
      }, 0);
    }
  };

  const handleFormSubmit = async (data: PersonalFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      console.log('Enviando datos personales:', data);
      const success = await onSubmit(data);
      
      if (success) {
        console.log('Datos guardados exitosamente');
        setSaveSuccess(true);
        // Esperamos un momento antes de navegar al siguiente paso
        setTimeout(() => {
          router.push(`/application/step/2`);
        }, 500);
        return true;
      } else {
        console.error('Error al guardar los datos personales: el servidor retornó false');
        setSaveError('No se pudieron guardar los datos. Por favor intenta nuevamente.');
        return false;
      }
    } catch (error) {
      console.error('Excepción al guardar los datos personales:', error);
      setSaveError('Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper para StepNavigation que se asegura de devolver un boolean
  const handleStepSave = async () => {
    console.log('Guardando datos del formulario...');
    try {
      const result = await handleSubmit(handleFormSubmit)();
      // Si handleSubmit no devuelve nada, asumimos que fue exitoso (no hubo errores de validación)
      return result !== undefined ? result : true;
    } catch (error) {
      console.error('Error al guardar datos:', error);
      return false;
    }
  };

  return (
    <div>
      <form onSubmit={(e) => {
        e.preventDefault();
        handleSubmit(handleFormSubmit)();
      }}>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          Datos Personales
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
          {/* Nombre completo */}
          <div>
            <label 
              htmlFor="full_name" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre completo
            </label>
            <input
              id="full_name"
              type="text"
              {...register('full_name')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nombre(s) y apellidos"
            />
            {errors.full_name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.full_name.message}
              </p>
            )}
          </div>
          
          {/* Fecha de nacimiento */}
          <div>
            <label 
              htmlFor="birth_date" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fecha de nacimiento
            </label>
            <input
              id="birth_date"
              type="date"
              {...register('birth_date', {
                valueAsDate: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.birth_date && (
              <p className="mt-1 text-sm text-red-600">
                {errors.birth_date.message}
              </p>
            )}
          </div>
          
          {/* CURP/RFC */}
          <div>
            <label 
              htmlFor="curp_rfc" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CURP o RFC
            </label>
            <input
              id="curp_rfc"
              type="text"
              {...register('curp_rfc')}
              onChange={(e) => {
                register('curp_rfc').onChange(e); // Mantener el comportamiento original del register
                handleCurpRfcChange(e); // Aplicar conversión a mayúsculas
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Ingresa tu CURP o RFC"
            />
            {errors.curp_rfc && (
              <p className="mt-1 text-sm text-red-600">
                {errors.curp_rfc.message}
              </p>
            )}
          </div>
          
          {/* Estado civil */}
          <div>
            <label 
              htmlFor="marital_status" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Estado civil
            </label>
            <select
              id="marital_status"
              {...register('marital_status')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Selecciona una opción</option>
              <option value="soltero">Soltero/a</option>
              <option value="casado">Casado/a</option>
              <option value="union_libre">Unión libre</option>
              <option value="divorciado">Divorciado/a</option>
              <option value="viudo">Viudo/a</option>
            </select>
            {errors.marital_status && (
              <p className="mt-1 text-sm text-red-600">
                {errors.marital_status.message}
              </p>
            )}
          </div>
          
          {/* Número de dependientes */}
          <div>
            <label 
              htmlFor="dependents" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Número de dependientes económicos
            </label>
            <input
              id="dependents"
              type="number"
              min="0"
              max="20"
              {...register('dependents', {
                valueAsNumber: true,
              })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.dependents && (
              <p className="mt-1 text-sm text-red-600">
                {errors.dependents.message}
              </p>
            )}
          </div>
        </div>
        
        <StepNavigation 
          currentStep={1} 
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
} 