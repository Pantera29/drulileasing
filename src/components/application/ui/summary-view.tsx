import React from 'react';
import Link from 'next/link';

interface SummaryDataType {
  profile?: {
    full_name: string;
    birth_date: Date | string;
    curp_rfc: string;
    marital_status: string;
    dependents: number;
  };
  contact?: {
    street: string;
    street_number: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    housing_type: string;
    residence_time: string;
    mobile_phone: string;
    home_phone?: string | null;
    alternative_email?: string | null;
  };
  financial?: {
    occupation: string;
    company_name: string;
    employment_time: string;
    monthly_income: number;
    additional_income?: number | null;
    income_proof_url?: string | null;
  };
  equipment?: {
    equipment_type: string;
    equipment_model: string;
    approximate_amount: number;
    desired_term: number;
    additional_comments?: string | null;
  };
}

interface SummaryViewProps {
  data: SummaryDataType;
}

export function SummaryView({ data }: SummaryViewProps) {
  // Dar formato a fecha
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Formato para valores monetarios
  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    });
  };
  
  // Traducciones para valores enumerados
  const translations = {
    marital_status: {
      soltero: 'Soltero/a',
      casado: 'Casado/a',
      union_libre: 'Unión libre',
      divorciado: 'Divorciado/a',
      viudo: 'Viudo/a',
    },
    housing_type: {
      propia: 'Propia',
      rentada: 'Rentada',
      familiar: 'Familiar',
    },
  };
  
  return (
    <div className="space-y-8">
      {/* Datos personales */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900">Datos Personales</h3>
          <Link 
            href="/step/1" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Editar
          </Link>
        </div>
        {data.profile ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Nombre completo</p>
              <p className="mt-1 text-sm text-gray-900">{data.profile.full_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Fecha de nacimiento</p>
              <p className="mt-1 text-sm text-gray-900">{formatDate(data.profile.birth_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">CURP/RFC</p>
              <p className="mt-1 text-sm text-gray-900">{data.profile.curp_rfc}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Estado civil</p>
              <p className="mt-1 text-sm text-gray-900">
                {translations.marital_status[data.profile.marital_status as keyof typeof translations.marital_status] || data.profile.marital_status}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Dependientes económicos</p>
              <p className="mt-1 text-sm text-gray-900">{data.profile.dependents}</p>
            </div>
          </div>
        ) : (
          <div className="p-5 text-center text-gray-500">
            Información no disponible
          </div>
        )}
      </div>
      
      {/* Información de contacto */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900">Información de Contacto</h3>
          <Link 
            href="/step/2" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Editar
          </Link>
        </div>
        {data.contact ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-gray-500">Dirección</p>
              <p className="mt-1 text-sm text-gray-900">
                {data.contact.street} {data.contact.street_number}, {data.contact.neighborhood}, {data.contact.city}, {data.contact.state}, CP {data.contact.zip_code}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tipo de vivienda</p>
              <p className="mt-1 text-sm text-gray-900">
                {translations.housing_type[data.contact.housing_type as keyof typeof translations.housing_type] || data.contact.housing_type}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Tiempo de residencia</p>
              <p className="mt-1 text-sm text-gray-900">{data.contact.residence_time}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Teléfono móvil</p>
              <p className="mt-1 text-sm text-gray-900">{data.contact.mobile_phone}</p>
            </div>
            {data.contact.home_phone && (
              <div>
                <p className="text-xs font-medium text-gray-500">Teléfono fijo</p>
                <p className="mt-1 text-sm text-gray-900">{data.contact.home_phone}</p>
              </div>
            )}
            {data.contact.alternative_email && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-gray-500">Email alternativo</p>
                <p className="mt-1 text-sm text-gray-900">{data.contact.alternative_email}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 text-center text-gray-500">
            Información no disponible
          </div>
        )}
      </div>
      
      {/* Información financiera */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900">Información Financiera</h3>
          <Link 
            href="/step/3" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Editar
          </Link>
        </div>
        {data.financial ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Ocupación / Profesión</p>
              <p className="mt-1 text-sm text-gray-900">{data.financial.occupation}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Empresa / Consultorio</p>
              <p className="mt-1 text-sm text-gray-900">{data.financial.company_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Antigüedad laboral</p>
              <p className="mt-1 text-sm text-gray-900">{data.financial.employment_time}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Ingreso mensual</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(data.financial.monthly_income)}</p>
            </div>
            {data.financial.additional_income !== null && data.financial.additional_income !== undefined && data.financial.additional_income > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500">Ingresos adicionales</p>
                <p className="mt-1 text-sm text-gray-900">{formatCurrency(data.financial.additional_income)}</p>
              </div>
            )}
            {data.financial.income_proof_url && (
              <div>
                <p className="text-xs font-medium text-gray-500">Comprobante de ingresos</p>
                <p className="mt-1 text-sm text-blue-600">
                  <a href={data.financial.income_proof_url} target="_blank" rel="noopener noreferrer">
                    Ver documento
                  </a>
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 text-center text-gray-500">
            Información no disponible
          </div>
        )}
      </div>
      
      {/* Información del equipo */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <h3 className="text-sm font-medium text-gray-900">Equipo de Interés</h3>
          <Link 
            href="/step/4" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Editar
          </Link>
        </div>
        {data.equipment ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <p className="text-xs font-medium text-gray-500">Equipo seleccionado</p>
              <p className="mt-1 text-sm text-gray-900">
                {data.equipment.equipment_type} - {data.equipment.equipment_model}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Monto aproximado</p>
              <p className="mt-1 text-sm font-medium text-gray-900">{formatCurrency(data.equipment.approximate_amount)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Plazo deseado</p>
              <p className="mt-1 text-sm text-gray-900">{data.equipment.desired_term} meses</p>
            </div>
            {data.equipment.additional_comments && (
              <div className="md:col-span-2">
                <p className="text-xs font-medium text-gray-500">Comentarios adicionales</p>
                <p className="mt-1 text-sm text-gray-900">{data.equipment.additional_comments}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 text-center text-gray-500">
            Información no disponible
          </div>
        )}
      </div>
    </div>
  );
} 