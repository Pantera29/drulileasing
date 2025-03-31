import React from 'react';
import { PersonalForm } from '@/components/application/forms/personal-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type PersonalFormData } from '@/lib/schemas/personal-schema';

// Definir la estructura de la aplicación para evitar errores de tipo
interface Application {
  id: string;
  profile_id?: string;
}

export default async function PersonalDataPage() {
  console.log('Inicializando PersonalInfoPage');
  const supabase = await createClient();
  
  try {
    // Verificar si el usuario está autenticado
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error al obtener la sesión:', sessionError);
      redirect('/login');
    }
    
    if (!session) {
      console.log('No hay sesión de usuario activa');
      redirect('/login');
    }
    
    console.log('Usuario autenticado:', session.user.id);
    
    // Intentar obtener aplicación existente
    let application: Application | null = null;
    
    try {
      const { data: existingApp, error: queryError } = await supabase
        .from('credit_applications')
        .select('id, profile_id')
        .eq('user_id', session.user.id)
        .eq('application_status', 'incomplete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Usamos maybeSingle en lugar de single para evitar errores
      
      if (queryError) {
        console.error('Error en la consulta de aplicaciones:', queryError.message, queryError.details, queryError.hint);
        // Continuaremos y crearemos una nueva aplicación
      } else if (existingApp) {
        console.log('Aplicación existente encontrada:', existingApp.id);
        application = existingApp as Application;
      } else {
        console.log('No se encontraron aplicaciones incompletas');
        // Continuaremos y crearemos una nueva aplicación
      }
    } catch (queryError) {
      console.error('Excepción al consultar aplicaciones:', queryError);
      // Continuaremos y crearemos una nueva aplicación
    }
    
    // Si no encontramos una aplicación, crear una nueva
    if (!application) {
      console.log('Creando nueva aplicación para el usuario', session.user.id);
      
      try {
        const { data: newApplication, error: createError } = await supabase
          .from('credit_applications')
          .insert({
            user_id: session.user.id,
            application_status: 'incomplete'
          })
          .select('id')
          .single();
          
        if (createError) {
          console.error('Error al crear nueva aplicación:', 
            createError.message, 
            createError.details, 
            createError.hint
          );
          throw new Error(`No se pudo crear una nueva aplicación: ${createError.message}`);
        }
        
        if (!newApplication) {
          throw new Error('Se creó la aplicación pero no se retornaron datos');
        }
        
        console.log('Nueva aplicación creada exitosamente:', newApplication.id);
        application = { id: newApplication.id } as Application;
      } catch (createError) {
        console.error('Excepción al crear aplicación:', createError);
        throw new Error('Error al crear nueva aplicación en la base de datos');
      }
    }
    
    // Obtener los datos del perfil si existen
    let profileData = null;
    
    try {
      if (application.profile_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) {
          console.error('Error al obtener perfil:', profileError);
        } else if (profile) {
          profileData = profile;
          console.log('Perfil encontrado para el usuario');
        }
      } else {
        console.log('La aplicación no tiene perfil asociado aún');
      }
    } catch (profileError) {
      console.error('Excepción al obtener perfil:', profileError);
      // Continuamos sin datos de perfil
    }
    
    // Función para guardar los datos del perfil
    async function savePersonalData(data: PersonalFormData) {
      'use server';
      
      const supabase = await createClient();
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No hay sesión al intentar guardar datos personales');
          return false;
        }
        
        // Verificar si el perfil ya existe
        const { data: existingProfile, error: profileQueryError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profileQueryError) {
          console.error('Error al verificar perfil existente:', profileQueryError);
        }
        
        let profileId;
        
        if (existingProfile) {
          console.log('Actualizando perfil existente');
          // Actualizar perfil existente
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              full_name: data.full_name,
              birth_date: data.birth_date,
              curp_rfc: data.curp_rfc,
              marital_status: data.marital_status,
              dependents: data.dependents,
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.user.id);
            
          if (updateError) {
            console.error('Error al actualizar perfil:', updateError);
            return false;
          }
          
          profileId = session.user.id;
        } else {
          console.log('Creando nuevo perfil');
          // Crear nuevo perfil
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: data.full_name,
              birth_date: data.birth_date,
              curp_rfc: data.curp_rfc,
              marital_status: data.marital_status,
              dependents: data.dependents,
            })
            .select('id')
            .single();
            
          if (insertError) {
            console.error('Error al crear perfil:', insertError);
            return false;
          }
          
          if (!newProfile) {
            console.error('No se retornaron datos al crear el perfil');
            return false;
          }
          
          profileId = newProfile.id;
        }
        
        // Obtener la aplicación actual
        const { data: currentApp, error: appQueryError } = await supabase
          .from('credit_applications')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('application_status', 'incomplete')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (appQueryError) {
          console.error('Error al buscar la aplicación actual:', appQueryError);
          return false;
        }
        
        if (!currentApp) {
          console.error('No se encontró la aplicación actual');
          return false;
        }
        
        // Actualizar la referencia en la aplicación
        const { error: appError } = await supabase
          .from('credit_applications')
          .update({
            profile_id: profileId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentApp.id);
          
        if (appError) {
          console.error('Error al actualizar aplicación:', appError);
          return false;
        }
        
        console.log('Datos personales guardados exitosamente');
        return true;
      } catch (error) {
        console.error('Error inesperado al guardar los datos personales:', error);
        return false;
      }
    }
    
    console.log('Renderizando formulario personal con ID de aplicación:', application.id);
    return (
      <div>
        <PersonalForm 
          initialData={profileData} 
          onSubmit={savePersonalData}
          applicationId={application.id}
        />
      </div>
    );
  } catch (error) {
    console.error('Error inesperado en la página de datos personales:', error);
    redirect('/login');
  }
} 