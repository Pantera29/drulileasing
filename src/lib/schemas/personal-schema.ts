import { z } from 'zod';

// Validador para CURP (México)
const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;

// Validador para RFC (México)
const rfcRegex = /^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$/;

// Función para validar CURP o RFC
const validateCurpRfc = (value: string) => {
  // Eliminamos espacios y convertimos a mayúsculas
  const cleanValue = value.toUpperCase().trim();
  
  // Verificamos si es CURP o RFC
  return curpRegex.test(cleanValue) || rfcRegex.test(cleanValue);
};

// Función para calcular la edad a partir de la fecha de nacimiento
const calculateAge = (birthDate: Date) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Esquema para validación de datos personales
export const personalSchema = z.object({
  full_name: z
    .string()
    .min(5, { message: 'El nombre completo debe tener al menos 5 caracteres' })
    .max(100, { message: 'El nombre completo no puede exceder los 100 caracteres' }),
  
  birth_date: z
    .date()
    .refine((date) => calculateAge(date) >= 18, {
      message: 'Debes tener al menos 18 años para solicitar un crédito',
    }),
  
  curp_rfc: z
    .string()
    .min(10, { message: 'CURP/RFC debe tener al menos 10 caracteres' })
    .max(18, { message: 'CURP/RFC no puede exceder los 18 caracteres' })
    .refine(validateCurpRfc, {
      message: 'CURP o RFC inválido. Verifica el formato',
    }),
  
  marital_status: z.enum(
    ['soltero', 'casado', 'union_libre', 'divorciado', 'viudo'],
    {
      errorMap: () => ({ message: 'Selecciona un estado civil válido' }),
    }
  ),
  
  dependents: z
    .number()
    .int()
    .min(0, { message: 'El número de dependientes no puede ser negativo' })
    .max(20, { message: 'El número de dependientes parece ser demasiado alto' }),
  
  // Nuevos campos para soporte multi-tenant (opcionales para mantener compatibilidad)
  user_type: z.enum(['customer', 'equipment_company_employee', 'druli_employee']).default('customer'),
  equipment_company_id: z.string().uuid().optional(),
  is_active: z.boolean().default(true),
});

export type PersonalFormData = z.infer<typeof personalSchema>; 