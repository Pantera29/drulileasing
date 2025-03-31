import React from 'react';
import { FinancialForm } from '@/components/application/forms/financial-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { type FinancialFormData } from '@/lib/schemas/financial-schema';

export default async function FinancialInfoPage() {
  console.log('Inicializando FinancialInfoPage');
  const supabase = await createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener la aplicación actual
  const { data: application } = await supabase
    .from('credit_applications')
    .select('id, financial_id')
    .eq('user_id', session.user.id)
    .eq('application_status', 'incomplete')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!application) {
    // Si no hay aplicación, redirigir a la página principal para crear una
    redirect('/');
  }
  
  // Obtener los datos financieros si existen
  let financialData = null;
  if (application.financial_id) {
    const { data: financial } = await supabase
      .from('financial_info')
      .select('*')
      .eq('id', application.financial_id)
      .single();
      
    if (financial) {
      financialData = financial;
    }
  }
  
  // Función para guardar los datos financieros
  async function saveFinancialData(data: FinancialFormData) {
    'use server';
    
    const supabase = await createClient();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }
      
      // Obtener la aplicación actual
      const { data: application } = await supabase
        .from('credit_applications')
        .select('id, financial_id')
        .eq('user_id', session.user.id)
        .eq('application_status', 'incomplete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!application) {
        return false;
      }
      
      let financialId;
      
      // Si ya existe información financiera, actualizarla
      if (application.financial_id) {
        const { error: updateError } = await supabase
          .from('financial_info')
          .update({
            occupation: data.occupation,
            company_name: data.company_name,
            employment_time: data.employment_time,
            monthly_income: data.monthly_income,
            additional_income: data.additional_income || null,
            income_proof_url: data.income_proof_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.financial_id);
          
        if (updateError) {
          console.error('Error al actualizar información financiera:', updateError);
          return false;
        }
        
        financialId = application.financial_id;
      } else {
        // Crear nueva información financiera
        const { data: newFinancial, error: insertError } = await supabase
          .from('financial_info')
          .insert({
            user_id: session.user.id,
            occupation: data.occupation,
            company_name: data.company_name,
            employment_time: data.employment_time,
            monthly_income: data.monthly_income,
            additional_income: data.additional_income || null,
            income_proof_url: data.income_proof_url || null,
          })
          .select('id')
          .single();
          
        if (insertError) {
          console.error('Error al crear información financiera:', insertError);
          return false;
        }
        
        financialId = newFinancial.id;
        
        // Registrar el documento en la tabla de documentos si existe
        if (data.income_proof_url) {
          const { error: docError } = await supabase
            .from('documents')
            .insert({
              user_id: session.user.id,
              document_type: 'proof_of_income',
              document_url: data.income_proof_url,
              uploaded_at: new Date().toISOString(),
              verified: false,
            });
            
          if (docError) {
            console.error('Error al registrar documento:', docError);
            // Continuamos aunque haya error en el registro del documento
          }
        }
      }
      
      // Actualizar la referencia en la aplicación
      const { error: appError } = await supabase
        .from('credit_applications')
        .update({
          financial_id: financialId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);
        
      if (appError) {
        console.error('Error al actualizar aplicación:', appError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar la información financiera:', error);
      return false;
    }
  }
  
  return (
    <div>
      <FinancialForm 
        initialData={financialData} 
        onSubmit={saveFinancialData}
        applicationId={application.id}
        userId={session.user.id}
      />
    </div>
  );
} 