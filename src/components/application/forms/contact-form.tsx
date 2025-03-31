"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactFormData } from '@/lib/schemas/contact-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { useRouter } from 'next/navigation';

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
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  });
  
  const handleFormSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      console.log('Enviando datos de contacto:', data);
      const success = await onSubmit(data);
      
      if (success) {
        console.log('Datos de contacto guardados exitosamente');
        setSaveSuccess(true);
        // Esperamos un momento antes de navegar al siguiente paso
        setTimeout(() => {
          router.push(`/application/step/3`);
        }, 500);
        return true;
      } else {
        console.error('Error al guardar los datos de contacto: el servidor retornó false');
        setSaveError('No se pudieron guardar los datos. Por favor intenta nuevamente.');
        return false;
      }
    } catch (error) {
      console.error('Error al guardar los datos de contacto:', error);
      setSaveError('Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Wrapper para StepNavigation que se asegura de devolver un boolean
  const handleStepSave = async () => {
    console.log('Guardando datos del formulario de contacto...');
    try {
      const result = await handleSubmit(handleFormSubmit)();
      // Si handleSubmit no devuelve nada, asumimos que fue exitoso (no hubo errores de validación)
      return result !== undefined ? result : true;
    } catch (error) {
      console.error('Error al guardar datos de contacto:', error);
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
          Información de Contacto
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
          {/* Dirección */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label 
                htmlFor="street" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Calle
              </label>
              <input
                id="street"
                type="text"
                {...register('street')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Nombre de la calle"
              />
              {errors.street && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.street.message}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="street_number" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Número
              </label>
              <input
                id="street_number"
                type="text"
                {...register('street_number')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Número exterior/interior"
              />
              {errors.street_number && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.street_number.message}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <label 
              htmlFor="neighborhood" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Colonia
            </label>
            <input
              id="neighborhood"
              type="text"
              {...register('neighborhood')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Nombre de la colonia"
            />
            {errors.neighborhood && (
              <p className="mt-1 text-sm text-red-600">
                {errors.neighborhood.message}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label 
                htmlFor="city" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Ciudad
              </label>
              <input
                id="city"
                type="text"
                {...register('city')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Ciudad"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.city.message}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="state" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Estado
              </label>
              <select
                id="state"
                {...register('state')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecciona un estado</option>
                <option value="Aguascalientes">Aguascalientes</option>
                <option value="Baja California">Baja California</option>
                <option value="Baja California Sur">Baja California Sur</option>
                <option value="Campeche">Campeche</option>
                <option value="Chiapas">Chiapas</option>
                <option value="Chihuahua">Chihuahua</option>
                <option value="Ciudad de México">Ciudad de México</option>
                <option value="Coahuila">Coahuila</option>
                <option value="Colima">Colima</option>
                <option value="Durango">Durango</option>
                <option value="Estado de México">Estado de México</option>
                <option value="Guanajuato">Guanajuato</option>
                <option value="Guerrero">Guerrero</option>
                <option value="Hidalgo">Hidalgo</option>
                <option value="Jalisco">Jalisco</option>
                <option value="Michoacán">Michoacán</option>
                <option value="Morelos">Morelos</option>
                <option value="Nayarit">Nayarit</option>
                <option value="Nuevo León">Nuevo León</option>
                <option value="Oaxaca">Oaxaca</option>
                <option value="Puebla">Puebla</option>
                <option value="Querétaro">Querétaro</option>
                <option value="Quintana Roo">Quintana Roo</option>
                <option value="San Luis Potosí">San Luis Potosí</option>
                <option value="Sinaloa">Sinaloa</option>
                <option value="Sonora">Sonora</option>
                <option value="Tabasco">Tabasco</option>
                <option value="Tamaulipas">Tamaulipas</option>
                <option value="Tlaxcala">Tlaxcala</option>
                <option value="Veracruz">Veracruz</option>
                <option value="Yucatán">Yucatán</option>
                <option value="Zacatecas">Zacatecas</option>
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.state.message}
                </p>
              )}
            </div>
            
            <div>
              <label 
                htmlFor="zip_code" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Código Postal
              </label>
              <input
                id="zip_code"
                type="text"
                maxLength={5}
                {...register('zip_code')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="5 dígitos"
              />
              {errors.zip_code && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.zip_code.message}
                </p>
              )}
            </div>
          </div>
          
          {/* Teléfono móvil */}
          <div>
            <label 
              htmlFor="mobile_phone" 
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Teléfono móvil
            </label>
            <input
              id="mobile_phone"
              type="tel"
              maxLength={10}
              {...register('mobile_phone')}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="10 dígitos"
            />
            {errors.mobile_phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.mobile_phone.message}
              </p>
            )}
          </div>
        </div>
        
        <StepNavigation 
          currentStep={2} 
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
} 