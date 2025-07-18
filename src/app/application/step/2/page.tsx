import React from 'react';
import { ContactForm } from '@/components/application/forms/contact-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type ContactFormData } from '@/lib/schemas/contact-schema';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';
// Indicar el runtime de Node.js
export const runtime = 'nodejs';

export default async function ContactInfoPage() {
  console.log('Inicializando ContactInfoPage');
  const supabase = await createClient();
  
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
    .eq('status', 'pending')
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
    
    console.log('Iniciando saveContactData con datos:', JSON.stringify(data));
    const supabase = await createClient();
    
    try {
      // Verificar la sesión del usuario
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('Error: No hay sesión de usuario activa');
        return false;
      }
      
      console.log('Sesión válida para usuario:', session.user.id);
      
      // Obtener la aplicación actual
      const { data: application, error: appQueryError } = await supabase
        .from('credit_applications')
        .select('id, contact_id')
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (appQueryError || !application) {
        console.error('Error al obtener la aplicación:', appQueryError?.message);
        return false;
      }
      
      console.log('Aplicación encontrada:', application.id);
      
      let contactId;
      
      // Si ya existe información de contacto, actualizarla
      if (application.contact_id) {
        console.log('Actualizando contact_id existente:', application.contact_id);
        
        // Verificar si el contact_id existe en la tabla de contactos
        const { data: existingContact, error: checkError } = await supabase
          .from('contact_info')
          .select('id')
          .eq('id', application.contact_id)
          .single();
        
        if (checkError || !existingContact) {
          console.log('El contact_id no existe en la tabla, creando nuevo registro');
          // Si no existe, crear un nuevo registro en lugar de actualizar
          contactId = null;
        } else {
          const { error: updateError } = await supabase
            .from('contact_info')
            .update({
              address_street: data.street,
              address_city: data.city,
              address_state: data.state,
              address_postal_code: data.zip_code,
              phone: data.mobile_phone,
              updated_at: new Date().toISOString(),
            })
            .eq('id', application.contact_id);
            
          if (updateError) {
            console.error('Error al actualizar información de contacto:', updateError);
            return false;
          }
          
          contactId = application.contact_id;
          console.log('Contact_info actualizado con éxito, ID:', contactId);
        }
      }
      
      // Si no hay contact_id o no existe en la tabla, crear nuevo registro
      if (!contactId) {
        console.log('Creando nuevo registro de contact_info');
        const { data: newContact, error: insertError } = await supabase
          .from('contact_info')
          .insert({
            user_id: session.user.id,
            address_street: data.street,
            address_city: data.city,
            address_state: data.state,
            address_postal_code: data.zip_code,
            phone: data.mobile_phone,
          })
          .select('id')
          .single();
          
        if (insertError || !newContact) {
          console.error('Error al crear información de contacto:', insertError?.message);
          return false;
        }
        
        contactId = newContact.id;
        console.log('Nuevo contact_info creado con éxito, ID:', contactId);
      }
      
      // Actualizar la referencia en la aplicación
      console.log('Actualizando la referencia en credit_applications');
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
      
      console.log('Todo el proceso completado con éxito');
      return true;
    } catch (error) {
      console.error('Error general al guardar los datos de contacto:', error);
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