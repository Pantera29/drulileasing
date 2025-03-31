import { z } from 'zod';

// Esquema para validación de datos financieros
export const financialSchema = z.object({
  occupation: z
    .string()
    .min(3, { message: 'La ocupación debe tener al menos 3 caracteres' })
    .max(100, { message: 'La ocupación no puede exceder los 100 caracteres' }),
  
  company_name: z
    .string()
    .min(3, { message: 'El nombre de la empresa debe tener al menos 3 caracteres' })
    .max(100, { message: 'El nombre de la empresa no puede exceder los 100 caracteres' }),
  
  employment_time: z
    .string()
    .min(3, { message: 'El tiempo de empleo es requerido' })
    .max(50, { message: 'El tiempo de empleo no puede exceder los 50 caracteres' }),
  
  monthly_income: z
    .number()
    .min(5000, { message: 'El ingreso mensual debe ser al menos $5,000 MXN' })
    .max(1000000, { message: 'El ingreso mensual parece ser demasiado alto' }),
  
  additional_income: z
    .number()
    .min(0, { message: 'Los ingresos adicionales no pueden ser negativos' })
    .max(1000000, { message: 'Los ingresos adicionales parecen ser demasiado altos' })
    .optional()
    .nullable(),
  
  // El campo income_proof_url se maneja separadamente con el componente de carga de archivos
  income_proof_url: z
    .string()
    .optional()
    .nullable(),
});

export type FinancialFormData = z.infer<typeof financialSchema>; 