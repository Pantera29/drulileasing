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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, MapPin } from 'lucide-react';

interface ContactFormProps {
  initialData?: Partial<ContactFormData>;
  onSubmit: (data: ContactFormData) => Promise<boolean>;
  applicationId: string;
}

export function ContactForm({ initialData, onSubmit, applicationId }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const router = useRouter();
  
  const defaultValues = initialData || {
    street: '',
    street_number: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    mobile_phone: '',
  };
  
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });
  
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
      <CardHeader className="pb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-500" />
          Información de Contacto
        </h2>
        <p className="text-sm text-gray-500">
          Ingresa tus datos de contacto para poder comunicarnos contigo
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
            {/* Dirección */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-4">
              <h3 className="font-medium text-gray-700 mb-4">Dirección</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la colonia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad" {...field} />
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
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="Aguascalientes">Aguascalientes</SelectItem>
                          <SelectItem value="Baja California">Baja California</SelectItem>
                          <SelectItem value="Baja California Sur">Baja California Sur</SelectItem>
                          <SelectItem value="Campeche">Campeche</SelectItem>
                          <SelectItem value="Chiapas">Chiapas</SelectItem>
                          <SelectItem value="Chihuahua">Chihuahua</SelectItem>
                          <SelectItem value="Ciudad de México">Ciudad de México</SelectItem>
                          <SelectItem value="Coahuila">Coahuila</SelectItem>
                          <SelectItem value="Colima">Colima</SelectItem>
                          <SelectItem value="Durango">Durango</SelectItem>
                          <SelectItem value="Estado de México">Estado de México</SelectItem>
                          <SelectItem value="Guanajuato">Guanajuato</SelectItem>
                          <SelectItem value="Guerrero">Guerrero</SelectItem>
                          <SelectItem value="Hidalgo">Hidalgo</SelectItem>
                          <SelectItem value="Jalisco">Jalisco</SelectItem>
                          <SelectItem value="Michoacán">Michoacán</SelectItem>
                          <SelectItem value="Morelos">Morelos</SelectItem>
                          <SelectItem value="Nayarit">Nayarit</SelectItem>
                          <SelectItem value="Nuevo León">Nuevo León</SelectItem>
                          <SelectItem value="Oaxaca">Oaxaca</SelectItem>
                          <SelectItem value="Puebla">Puebla</SelectItem>
                          <SelectItem value="Querétaro">Querétaro</SelectItem>
                          <SelectItem value="Quintana Roo">Quintana Roo</SelectItem>
                          <SelectItem value="San Luis Potosí">San Luis Potosí</SelectItem>
                          <SelectItem value="Sinaloa">Sinaloa</SelectItem>
                          <SelectItem value="Sonora">Sonora</SelectItem>
                          <SelectItem value="Tabasco">Tabasco</SelectItem>
                          <SelectItem value="Tamaulipas">Tamaulipas</SelectItem>
                          <SelectItem value="Tlaxcala">Tlaxcala</SelectItem>
                          <SelectItem value="Veracruz">Veracruz</SelectItem>
                          <SelectItem value="Yucatán">Yucatán</SelectItem>
                          <SelectItem value="Zacatecas">Zacatecas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código Postal</FormLabel>
                      <FormControl>
                        <Input placeholder="Código Postal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Información de Contacto */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="font-medium text-gray-700 mb-4">Información de Contacto</h3>
              
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