"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormData } from '@/lib/schemas/contact-schema';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { MapPinIcon } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ContactFormProps {
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<boolean>;
  applicationId: string;
}

export function ContactForm({ initialData, onSubmit, applicationId }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [isLoadingPostalCode, setIsLoadingPostalCode] = React.useState(false);
  const router = useRouter();
  
  const defaultValues = {
    street: initialData?.street || '',
    street_number: initialData?.street_number || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    zip_code: initialData?.zip_code || '',
    mobile_phone: initialData?.mobile_phone || '',
  };
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });
  
  const handlePostalCodeChange = async (postalCode: string) => {
    if (postalCode.length !== 5) return;
    
    setIsLoadingPostalCode(true);
    try {
      const response = await fetch(`/api/postal-code?postalCode=${postalCode}`);
      const data = await response.json();
      
      if (!response.ok) {
        toast({
          title: "Error",
          description: data.error || "No se pudo obtener la información del código postal.",
          variant: "destructive",
        });
        return;
      }
      
      const postalCodeInfo = Array.isArray(data) ? data[0] : data;
      
      if (!postalCodeInfo || !postalCodeInfo.municipality || !postalCodeInfo.state || !postalCodeInfo.city) {
        toast({
          title: "Error",
          description: "La información del código postal está incompleta.",
          variant: "destructive",
        });
        return;
      }
      
      form.setValue('neighborhood', postalCodeInfo.neighborhood);
      form.setValue('city', postalCodeInfo.city);
      form.setValue('state', postalCodeInfo.state);
      
    } catch (error) {
      console.error('Error al consultar código postal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo obtener la información del código postal.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPostalCode(false);
    }
  };

  const handleFormSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      console.log('Enviando datos de contacto al servidor:', data);
      
      // Llamada al servidor
      const response = await onSubmit(data);
      console.log('Respuesta del servidor:', response);
      
      if (response === true) {
        console.log('Datos de contacto guardados exitosamente');
        setSaveSuccess(true);
        // Esperamos un momento antes de navegar al siguiente paso
        setTimeout(() => {
          router.push(`/application/step/3`);
        }, 500);
        return true;
      } else {
        console.error('Error al guardar los datos de contacto: el servidor retornó false');
        setSaveError('No se pudieron guardar los datos. Por favor intenta nuevamente. El servidor no pudo procesar la solicitud.');
        return false;
      }
    } catch (error) {
      console.error('Error en cliente al guardar los datos de contacto:', error);
      setSaveError(`Ocurrió un error al procesar tu solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper para StepNavigation que se asegura de devolver un boolean
  const handleStepSave = async () => {
    console.log('Guardando datos del formulario de contacto...');
    try {
      const result = await form.handleSubmit(handleFormSubmit)();
      // Si handleSubmit no devuelve nada, asumimos que fue exitoso (no hubo errores de validación)
      return result !== undefined ? result : true;
    } catch (error) {
      console.error('Error al guardar datos de contacto:', error);
      return false;
    }
  };

  return (
    <Card className="w-full shadow-md border-gray-200">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <MapPinIcon className="h-5 w-5 text-blue-500" />
          Datos de Contacto
        </h2>
        <p className="text-sm text-gray-500">
          Proporciona tu información de contacto y dirección
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
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-medium text-gray-700 mb-2">Dirección</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calle</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la calle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="street_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="Número exterior/interior" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mb-4">
                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="Ingresa el código postal para autocompletar la dirección" 
                            {...field} 
                            onChange={(e) => {
                              field.onChange(e);
                              if (e.target.value.length === 5) {
                                handlePostalCodeChange(e.target.value);
                              }
                            }}
                          />
                          {isLoadingPostalCode && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <p className="text-sm text-muted-foreground mt-1">
                        Al ingresar el código postal se autocompletarán la colonia, ciudad y estado
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia</FormLabel>
                      <FormControl>
                        <Input placeholder="Se autocompletará al ingresar el código postal" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Se autocompletará al ingresar el código postal" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Se autocompletará al ingresar el código postal" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Información de Contacto */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <h3 className="font-medium text-gray-700 mb-2">Información de Contacto</h3>
              
              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono Móvil</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel" 
                        placeholder="Ej: 5512345678" 
                        {...field} 
                      />
                    </FormControl>
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
          currentStep={2}
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </CardFooter>
    </Card>
  );
} 