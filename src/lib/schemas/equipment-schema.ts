import { z } from 'zod';

// Esquema para validación de la solicitud de equipo
export const equipmentSchema = z.object({
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