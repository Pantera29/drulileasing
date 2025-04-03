-- Actualizar registros existentes con application_status 'pending' a 'pending_nip'
UPDATE credit_applications
SET application_status = 'pending_nip'
WHERE application_status = 'pending';

-- Actualizar registros existentes en credit_evaluation_history
UPDATE credit_evaluation_history
SET result = 'pending_nip'
WHERE result = 'pending'; 