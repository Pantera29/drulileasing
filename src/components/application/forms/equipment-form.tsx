"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentSchema, type EquipmentFormData } from '@/lib/schemas/equipment-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calculator, Laptop } from 'lucide-react';

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
  
  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues,
  });
  
  // Monitorear el valor actual del monto
  const currentAmount = form.watch('approximate_amount');
  const currentTerm = form.watch('desired_term');
  
  // Configurar valores por defecto al cargar
  useEffect(() => {
    // Ya no necesitamos establecer estos valores porque los campos ya no existen
    // Solo aseguramos que el monto sea válido
    if (!currentAmount || currentAmount < 10000) {
      form.setValue('approximate_amount', 10000, { shouldValidate: true });
    }
  }, [form.setValue, currentAmount]);
  
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
      const success = await form.handleSubmit(async (data) => {
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
    <Card className="w-full shadow-md border-gray-200">
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Laptop className="h-5 w-5 text-blue-500" />
          Equipo de Interés
        </h2>
        <p className="text-sm text-gray-500">
          Configura los detalles de tu financiamiento médico
        </p>
      </CardHeader>
      
      <CardContent className="pt-6">
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Información del financiamiento */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-gray-600" />
                <h3 className="font-medium text-gray-700">
                  Información del financiamiento
                </h3>
              </div>
              
              {/* Monto y plazo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="approximate_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monto aproximado (MXN)</FormLabel>
                      <FormControl>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-gray-500">$</span>
                          <Input
                            type="number"
                            min="10000"
                            step="1000"
                            className="pl-7 w-full"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            value={field.value || 10000}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="desired_term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plazo deseado (meses)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un plazo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="12">12 meses</SelectItem>
                          <SelectItem value="24">24 meses</SelectItem>
                          <SelectItem value="36">36 meses</SelectItem>
                          <SelectItem value="48">48 meses</SelectItem>
                          <SelectItem value="60">60 meses</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Cálculo de pagos */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">
                  Cálculo aproximado
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Monto a financiar</p>
                    <p className="text-lg font-semibold">{formatCurrency(currentAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Pago mensual</p>
                    <p className="text-lg font-semibold">{formatCurrency(monthlyPayment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Tasa anual</p>
                    <p className="text-lg font-semibold">
                      {(calculateInterestRate(currentAmount || 0, currentTerm || 24) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-blue-600">
                  *Este es un cálculo aproximado. La tasa final y condiciones serán confirmadas después de la aprobación.
                </p>
              </div>
            </div>
            
            {/* Comentarios adicionales */}
            <FormField
              control={form.control}
              name="additional_comments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios adicionales (opcional)</FormLabel>
                  <FormControl>
                    <textarea 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                      placeholder="¿Hay algo más que quieras comentarnos sobre el equipo o financiamiento?"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4 border-t border-gray-100">
        <StepNavigation
          currentStep={4}
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </CardFooter>
    </Card>
  );
} 