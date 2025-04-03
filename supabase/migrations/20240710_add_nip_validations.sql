-- Crear tabla para almacenar validaciones de NIP
CREATE TABLE IF NOT EXISTS nip_validations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES credit_applications(id) ON DELETE CASCADE,
  kiban_request_id TEXT NOT NULL,
  validated BOOLEAN NOT NULL DEFAULT FALSE,
  validation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar campo a credit_applications para controlar si ya pasó la validación de NIP
ALTER TABLE credit_applications 
ADD COLUMN IF NOT EXISTS nip_validated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kiban_request_id TEXT;

-- Crear índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_nip_validations_user_id ON nip_validations(user_id);
CREATE INDEX IF NOT EXISTS idx_nip_validations_application_id ON nip_validations(application_id);
CREATE INDEX IF NOT EXISTS idx_credit_applications_nip_validated ON credit_applications(nip_validated); 