export interface FormData {
  // Datos personales
  first_name: string;
  last_name: string;
  second_last_name?: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  marital_status: string;
  rfc: string;
  curp: string;
  
  // Datos del equipo
  equipment_catalog_id?: string;
  equipment_type?: string;
  equipment_brand?: string;
  equipment_model?: string;
  equipment_full_name?: string;
  approximate_amount: number;
  desired_term: number;
  additional_comments?: string | null;
  
  // Datos financieros
  monthly_income: number;
  monthly_expenses: number;
  additional_income?: number;
  additional_income_source?: string;
  
  // Datos de la empresa
  company_name: string;
  company_position: string;
  company_industry: string;
  company_phone: string;
  years_at_company: number;
  
  // Datos de la dirección
  street: string;
  exterior_number: string;
  interior_number?: string;
  neighborhood: string;
  municipality: string;
  state: string;
  zip_code: string;
  residence_years: number;
  residence_type: string;
  
  // Referencias
  reference1_name: string;
  reference1_phone: string;
  reference1_relationship: string;
  reference2_name: string;
  reference2_phone: string;
  reference2_relationship: string;
}

export type PartialFormData = Partial<FormData>; 