import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Equipment } from '@/lib/types/equipment';

interface EquipmentCardProps {
  equipment: Equipment;
  isSelected: boolean;
  onSelect: (equipment: Equipment) => void;
}

export function EquipmentCard({ equipment, isSelected, onSelect }: EquipmentCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'ring-2 ring-purple-500' : ''
      }`}
      onClick={() => onSelect(equipment)}
    >
      <CardContent className="p-4">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          {equipment.full_name}
        </h4>
        
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Marca:</span> {equipment.brand}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Modelo:</span> {equipment.model}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Familia:</span> {equipment.family}
          </p>
          
          {equipment.description && (
            <p className="text-sm text-gray-500 mt-2">
              {equipment.description}
            </p>
          )}

          <div className="mt-4">
            <p className="text-lg font-bold text-purple-600">
              ${equipment.price.toLocaleString('es-MX')}
            </p>
          </div>

          <Button
            type="button"
            variant={isSelected ? "secondary" : "outline"}
            className="w-full mt-4"
            onClick={() => onSelect(equipment)}
          >
            {isSelected ? 'Seleccionado' : 'Seleccionar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 