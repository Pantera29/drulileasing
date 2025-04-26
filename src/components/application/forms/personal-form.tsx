"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { personalSchema, type PersonalFormData } from '@/lib/schemas/personal-schema';
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, Info } from 'lucide-react';

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
      
  const form = useForm<PersonalFormData>({
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
      form.setValue('curp_rfc', upperValue, { shouldValidate: true });
      
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
      const result = await form.handleSubmit(handleFormSubmit)();
      // Si handleSubmit no devuelve nada, asumimos que fue exitoso (no hubo errores de validación)
      return result !== undefined ? result : true;
    } catch (error) {
      console.error('Error al guardar datos:', error);
      return false;
    }
  };

  return (
    <Card className="w-full shadow-md border-gray-200">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold text-gray-800 mb-1">
          Datos Personales
        </h2>
        <p className="text-sm text-gray-500">
          Ingresa tus datos personales para continuar con la solicitud
        </p>
      </CardHeader>

      <CardContent className="pt-2">
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
            <CheckCircle className="text-green-500 h-5 w-5" />
            <p className="text-green-800 text-sm font-medium">
              ¡Datos guardados correctamente! Redirigiendo al siguiente paso...
            </p>
          </div>
        )}
        
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm font-medium">
              {saveError}
            </p>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre completo</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nombre(s) y apellidos"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de nacimiento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                      onChange={e => {
                        const date = e.target.valueAsDate;
                        field.onChange(date);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="curp_rfc"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <FormLabel>CURP o RFC</FormLabel>
                    <Info className="h-4 w-4 text-gray-400" />
                  </div>
                  <FormControl>
                    <Input
                      placeholder="Ingresa tu CURP o RFC"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        handleCurpRfcChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="marital_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado civil</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una opción" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="soltero">Soltero/a</SelectItem>
                      <SelectItem value="casado">Casado/a</SelectItem>
                      <SelectItem value="union_libre">Unión libre</SelectItem>
                      <SelectItem value="divorciado">Divorciado/a</SelectItem>
                      <SelectItem value="viudo">Viudo/a</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dependents"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Número de dependientes económicos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="20"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500 italic">
                    Indica cuántas personas dependen económicamente de ti
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <StepNavigation
                currentStep={1}
                totalSteps={5}
                onSave={handleStepSave}
                isSubmitting={isSubmitting}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 