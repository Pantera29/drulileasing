import { z } from 'zod';

// Esquema para validación de la solicitud de equipo
export const equipmentSchema = z.object({
  equipment_catalog_id: z
    .string()
    .uuid({ message: 'ID de catálogo inválido' })
    .optional(),
  
  equipment_type: z
    .string()
    .min(1, { message: 'El tipo de equipo es requerido' })
    .optional(),
  
  equipment_brand: z
    .string()
    .min(1, { message: 'La marca del equipo es requerida' })
    .optional(),
  
  equipment_model: z
    .string()
    .min(1, { message: 'El modelo del equipo es requerido' })
    .optional(),
  
  equipment_full_name: z
    .string()
    .min(1, { message: 'El nombre completo del equipo es requerido' })
    .optional(),
  
  approximate_amount: z
    .number()
    .min(10000, { message: 'El monto debe ser al menos $10,000 MXN' })
    .max(10000000, { message: 'El monto parece ser demasiado alto' }),
  
  desired_term: z
    .number()
    .int()
    .min(12, { message: 'El plazo mínimo es de 12 meses' })
    .max(60, { message: 'El plazo máximo es de 60 meses' }),
  
  additional_comments: z
    .string()
    .max(500, { message: 'Los comentarios no pueden exceder los 500 caracteres' })
    .optional()
    .nullable(),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>; 