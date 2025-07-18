"use client";

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { equipmentSchema, type EquipmentFormData } from '@/lib/schemas/equipment-schema';
import { StepNavigation } from '@/components/application/layout/step-navigation';
import { useRouter } from 'next/navigation';
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
import { CheckCircle, Search, StethoscopeIcon } from 'lucide-react';
import type { Equipment } from '@/lib/types/equipment';
import { LoanSimulator } from '@/components/application/ui/loan-simulator';

interface EquipmentFormProps {
  selectedEquipment?: any; // Cambiado de initialData a selectedEquipment
  equipmentCatalog?: any[]; // Cambiado de Equipment[] a any[] para evitar errores de tipos
  onSubmit: (data: { equipment_id: string; desired_term: number; additional_comments?: string }) => Promise<boolean>;
  applicationId: string;
}

export function EquipmentForm({ 
  selectedEquipment: initialSelectedEquipment, 
  equipmentCatalog = [], 
  onSubmit, 
  applicationId 
}: EquipmentFormProps) {
  const router = useRouter();
  const simulatorRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(24);

  const defaultValues = {
    equipment_catalog_id: '',
    equipment_type: '',
    equipment_brand: '',
    equipment_model: '',
    equipment_full_name: '',
    approximate_amount: 100000,
    desired_term: 24,
    additional_comments: '',
  };
  
  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues,
  });

  // Filtrar equipos según término de búsqueda
  const filteredEquipment = equipmentCatalog
    .sort((a, b) => a.price - b.price) // Ordenar por precio de menor a mayor
    .filter(equipment => {
      const searchLower = searchTerm.toLowerCase();
      return (
        equipment.full_name.toLowerCase().includes(searchLower) ||
        equipment.brand.toLowerCase().includes(searchLower) ||
        equipment.model.toLowerCase().includes(searchLower) ||
        equipment.family.toLowerCase().includes(searchLower) ||
        (equipment.features && Array.isArray(equipment.features) && 
          equipment.features.some((feature: any) => 
            typeof feature === 'string' && feature.toLowerCase().includes(searchLower)
          ))
      );
    });

  // Agrupar equipos por marca
  const groupedEquipment = filteredEquipment.reduce<Record<string, Equipment[]>>((acc, equipment) => {
    if (!acc[equipment.brand]) {
      acc[equipment.brand] = [];
    }
    acc[equipment.brand].push(equipment);
    return acc;
  }, {});

  const handleEquipmentSelect = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setSelectedTerm(24); // Reset term to default
    
    // Actualizar el formulario con los datos del equipo
    form.setValue('equipment_catalog_id', equipment.id);
    form.setValue('equipment_type', equipment.family);
    form.setValue('equipment_brand', equipment.brand);
    form.setValue('equipment_model', equipment.model);
    form.setValue('equipment_full_name', equipment.full_name);
    form.setValue('approximate_amount', equipment.price);
    form.setValue('desired_term', selectedTerm);

    // Scroll suave al simulador después de un pequeño delay
    setTimeout(() => {
      simulatorRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  };

  const handleTermChange = (term: number) => {
    setSelectedTerm(term);
    form.setValue('desired_term', term);
  };

  const handleFormSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      if (!selectedEquipment) {
        setSaveError('Por favor selecciona un equipo antes de continuar.');
        return false;
      }
      
      const submitData = {
        equipment_id: selectedEquipment.id,
        desired_term: data.desired_term,
        additional_comments: data.additional_comments || undefined
      };
      
      console.log('Enviando datos del equipo:', submitData);
      const success = await onSubmit(submitData);
      
      if (success) {
        console.log('¡Datos guardados correctamente!');
        setSaveSuccess(true);
        
        setTimeout(() => {
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

  const handleStepSave = async () => {
    console.log('Guardando datos del formulario de equipo...');
    try {
      const success = await form.handleSubmit(async (data) => {
        return await handleFormSubmit(data);
      })();
      
      return success === undefined ? true : success;
    } catch (error) {
      console.error('Error al guardar datos de equipo:', error);
      return false;
    }
  };

  return (
    <div className="w-full">
      <div className="pb-2">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2 mb-1">
          <StethoscopeIcon className="h-5 w-5 text-purple-500" />
          Selección de Equipo
        </h2>
        <p className="text-sm text-gray-500">
          Explora nuestro catálogo y selecciona el equipo que mejor se adapte a tus necesidades
        </p>
      </div>
      
      <div className="pt-2">
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
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar por nombre, marca o características..."
                className="pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Catálogo de equipos */}
            <div className="space-y-6">
              {Object.entries(groupedEquipment).map(([brand, equipments]) => (
                <div key={brand} className="w-full">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">{brand}</h3>
                  <div className="space-y-4 w-full">
                    {equipments.map((equipment) => (
                      <div
                        key={equipment.id}
                        className={`w-full p-4 border rounded-lg transition-all duration-200 hover:shadow-lg cursor-pointer ${
                          selectedEquipment?.id === equipment.id 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-200'
                        }`}
                        onClick={() => handleEquipmentSelect(equipment)}
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-grow space-y-1">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {equipment.full_name}
                            </h4>
                            <div className="flex flex-wrap gap-x-6 text-sm text-gray-600">
                              <p><span className="font-medium">Marca:</span> {equipment.brand}</p>
                              <p><span className="font-medium">Modelo:</span> {equipment.model}</p>
                              <p><span className="font-medium">Familia:</span> {equipment.family}</p>
                            </div>
                            {equipment.description && (
                              <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                {equipment.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <p className="text-lg font-bold text-purple-600 whitespace-nowrap">
                              ${equipment.price.toLocaleString('es-MX')}
                            </p>
                            <Button
                              type="button"
                              variant={selectedEquipment?.id === equipment.id ? "secondary" : "outline"}
                              className="w-full md:w-auto whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEquipmentSelect(equipment);
                              }}
                            >
                              {selectedEquipment?.id === equipment.id ? 'Seleccionado' : 'Seleccionar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredEquipment.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {equipmentCatalog.length === 0 
                      ? "No hay equipos disponibles en el catálogo."
                      : "No se encontraron equipos que coincidan con tu búsqueda."}
                  </p>
                </div>
              )}
            </div>

            {/* Simulador de préstamo */}
            {selectedEquipment && (
              <div ref={simulatorRef} className="mt-8">
                <LoanSimulator
                  amount={selectedEquipment.price}
                  selectedTerm={selectedTerm}
                  onTermChange={handleTermChange}
                />
              </div>
            )}

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
                      value={field.value || ''}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>
      
      <div className="flex justify-between pt-6 mt-6 border-t border-gray-100">
        <StepNavigation
          currentStep={4}
          totalSteps={5}
          onSave={handleStepSave}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
} 