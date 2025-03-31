import { z } from 'zod';

// Validador para código postal mexicano
const zipCodeRegex = /^\d{5}$/;

// Validador para teléfono mexicano (10 dígitos)
const phoneRegex = /^\d{10}$/;

// Esquema para validación de datos de contacto
export const contactSchema = z.object({
  street: z
    .string()
    .min(3, { message: 'La calle debe tener al menos 3 caracteres' })
    .max(100, { message: 'La calle no puede exceder los 100 caracteres' }),
  
  street_number: z
    .string()
    .min(1, { message: 'El número es requerido' })
    .max(20, { message: 'El número no puede exceder los 20 caracteres' }),
  
  neighborhood: z
    .string()
    .min(3, { message: 'La colonia debe tener al menos 3 caracteres' })
    .max(100, { message: 'La colonia no puede exceder los 100 caracteres' }),
  
  city: z
    .string()
    .min(3, { message: 'La ciudad debe tener al menos 3 caracteres' })
    .max(100, { message: 'La ciudad no puede exceder los 100 caracteres' }),
  
  state: z
    .string()
    .min(3, { message: 'El estado debe tener al menos 3 caracteres' })
    .max(50, { message: 'El estado no puede exceder los 50 caracteres' }),
  
  zip_code: z
    .string()
    .min(5, { message: 'El código postal debe tener 5 dígitos' })
    .max(5, { message: 'El código postal debe tener 5 dígitos' })
    .refine((value) => zipCodeRegex.test(value), {
      message: 'El código postal debe contener 5 dígitos',
    }),
  
  mobile_phone: z
    .string()
    .min(10, { message: 'El teléfono móvil debe tener 10 dígitos' })
    .max(10, { message: 'El teléfono móvil debe tener 10 dígitos' })
    .refine((value) => phoneRegex.test(value), {
      message: 'El teléfono móvil debe contener 10 dígitos',
    }),
});

export type ContactFormData = z.infer<typeof contactSchema>; 