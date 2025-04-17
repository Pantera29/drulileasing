import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Equipment } from '@/lib/types/equipment';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EquipmentDetailsProps {
  equipment: Equipment;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedTerm: number;
  onTermChange: (term: number) => void;
}

export function EquipmentDetails({
  equipment,
  isOpen,
  onClose,
  onConfirm,
  selectedTerm,
  onTermChange,
}: EquipmentDetailsProps) {
  const terms = [24, 36, 48]; // Términos disponibles

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white">
        <DialogHeader className="border-b border-gray-100 pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {equipment.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Detalles del equipo</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Marca:</span>{' '}
                  <span className="text-gray-600">{equipment.brand}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Modelo:</span>{' '}
                  <span className="text-gray-600">{equipment.model}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Familia:</span>{' '}
                  <span className="text-gray-600">{equipment.family}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium text-gray-700">Categoría:</span>{' '}
                  <span className="text-gray-600">{equipment.category}</span>
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Precio y financiamiento</h4>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-purple-900 mb-1">Precio del equipo</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${equipment.price.toLocaleString('es-MX')}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 block">
                    Plazo de financiamiento
                  </label>
                  <Select
                    value={selectedTerm.toString()}
                    onValueChange={(value) => onTermChange(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona un plazo" />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term} value={term.toString()}>
                          {term} meses
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {equipment.description && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Descripción</h4>
              <p className="text-sm text-gray-600">{equipment.description}</p>
            </div>
          )}

          {equipment.features && equipment.features.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Características</h4>
              <ul className="list-disc list-inside space-y-1">
                {equipment.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600">{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Especificaciones</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Object.entries(equipment.specifications).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium text-gray-700">{key}:</span>{' '}
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-gray-100 pt-4">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="bg-purple-600 hover:bg-purple-700">
            Confirmar selección
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 