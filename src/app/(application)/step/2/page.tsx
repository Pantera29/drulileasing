import React from 'react';
import { ContactForm } from '@/components/application/forms/contact-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { type ContactFormData } from '@/lib/schemas/contact-schema';

export default async function ContactInfoPage() {
  const supabase = createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener la aplicación actual
  const { data: application } = await supabase
    .from('credit_applications')
    .select('id, contact_id')
    .eq('user_id', session.user.id)
    .eq('application_status', 'incomplete')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!application) {
    // Si no hay aplicación, redirigir a la página principal para crear una
    redirect('/');
  }
  
  // Obtener los datos de contacto si existen
  let contactData = null;
  if (application.contact_id) {
    const { data: contact } = await supabase
      .from('contact_info')
      .select('*')
      .eq('id', application.contact_id)
      .single();
      
    if (contact) {
      contactData = contact;
    }
  }
  
  // Función para guardar los datos de contacto
  async function saveContactData(data: ContactFormData) {
    'use server';
    
    const cookieStore = cookies();
    const supabase = createClient();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }
      
      // Obtener la aplicación actual
      const { data: application } = await supabase
        .from('credit_applications')
        .select('id, contact_id')
        .eq('user_id', session.user.id)
        .eq('application_status', 'incomplete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!application) {
        return false;
      }
      
      let contactId;
      
      // Si ya existe información de contacto, actualizarla
      if (application.contact_id) {
        const { error: updateError } = await supabase
          .from('contact_info')
          .update({
            street: data.street,
            street_number: data.street_number,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            housing_type: null,
            residence_time: null,
            mobile_phone: data.mobile_phone,
            home_phone: null,
            alternative_email: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', application.contact_id);
          
        if (updateError) {
          console.error('Error al actualizar información de contacto:', updateError);
          return false;
        }
        
        contactId = application.contact_id;
      } else {
        // Crear nueva información de contacto
        const { data: newContact, error: insertError } = await supabase
          .from('contact_info')
          .insert({
            user_id: session.user.id,
            street: data.street,
            street_number: data.street_number,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            zip_code: data.zip_code,
            housing_type: null,
            residence_time: null,
            mobile_phone: data.mobile_phone,
            home_phone: null,
            alternative_email: null,
          })
          .select('id')
          .single();
          
        if (insertError) {
          console.error('Error al crear información de contacto:', insertError);
          return false;
        }
        
        contactId = newContact.id;
      }
      
      // Actualizar la referencia en la aplicación
      const { error: appError } = await supabase
        .from('credit_applications')
        .update({
          contact_id: contactId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', application.id);
        
      if (appError) {
        console.error('Error al actualizar aplicación:', appError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error al guardar los datos de contacto:', error);
      return false;
    }
  }
  
  return (
    <div>
      <ContactForm 
        initialData={contactData} 
        onSubmit={saveContactData}
        applicationId={application.id}
      />
    </div>
  );
} 