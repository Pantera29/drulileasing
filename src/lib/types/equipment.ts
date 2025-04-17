export interface Equipment {
  id: string;
  brand: string;
  family: string;
  model: string;
  full_name: string;
  category: string;
  price: number;
  description?: string | null;
  features: string[];
  specifications: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentDisplay extends Equipment {
  fullName: string;
  recommendedTerms: number[];
}

export interface EquipmentGroup {
  brand: string;
  models: Equipment[];
}

export interface EquipmentCatalogProps {
  equipment: Equipment;
  isSelected: boolean;
  onSelect: (equipment: Equipment) => void;
}

export interface EquipmentDetailsProps {
  equipment: Equipment;
  onConfirm: () => void;
  onCancel: () => void;
  selectedTerm: number;
  onTermChange: (term: number) => void;
}

export interface EquipmentCatalogResponse {
  data: Equipment[];
  error: string | null;
} 