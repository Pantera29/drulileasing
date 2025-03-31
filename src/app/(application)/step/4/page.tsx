import React from 'react';
import { EquipmentForm } from '@/components/application/forms/equipment-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type EquipmentFormData } from '@/lib/schemas/equipment-schema';

export default async function EquipmentInfoPage() {
  console.log('Inicializando EquipmentInfoPage');
  const supabase = await createClient();
  
  // Verificar si el usuario está autenticado
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  // Obtener la aplicación actual
  const { data: application } = await supabase
    .from('credit_applications')
    .select('id, equipment_id')
    .eq('user_id', session.user.id)
    .eq('application_status', 'incomplete')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!application) {
    // Si no hay aplicación, redirigir a la página principal para crear una
    redirect('/');
  }
  
  // Obtener los datos del equipo si existen
  let equipmentData = null;
  if (application.equipment_id) {
    const { data: equipment } = await supabase
      .from('equipment_requests')
      .select('*')
      .eq('id', application.equipment_id)
      .single();
      
    if (equipment) {
      equipmentData = equipment;
    }
  }
  
  // Función para guardar los datos del equipo
  async function saveEquipmentData(data: EquipmentFormData) {
    'use server';
    
    const supabase = await createClient();
    
    try {
      console.log("Recibiendo datos en servidor:", JSON.stringify(data));
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error("No hay sesión activa");
        return false;
      }
      
      // Obtener aplicación actual
      const { data: application, error: appError } = await supabase
        .from('credit_applications')
        .select('id, equipment_id')
        .eq('user_id', session.user.id)
        .eq('application_status', 'incomplete')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (appError || !application) {
        console.error("Error al buscar aplicación:", appError?.message);
        return false;
      }
      
      // Preparar datos exactamente como están en la tabla
      const equipmentData = {
        user_id: session.user.id,
        approximate_amount: data.approximate_amount || 10000,
        desired_term: data.desired_term || 24,
        additional_comments: data.additional_comments || null,
        updated_at: new Date().toISOString()
      };
      
      // Creación o actualización simplificada
      let equipmentId;
      
      if (application.equipment_id) {
        // Actualizar equipo existente - eliminar user_id porque no se debe actualizar
        const { error: updateError } = await supabase
          .from('equipment_requests')
          .update({
            approximate_amount: equipmentData.approximate_amount,
            desired_term: equipmentData.desired_term,
            additional_comments: equipmentData.additional_comments,
            updated_at: equipmentData.updated_at
          })
          .eq('id', application.equipment_id);
          
        if (updateError) {
          console.error("Error al actualizar equipo:", updateError);
          return false;
        }
        
        equipmentId = application.equipment_id;
      } else {
        // Crear nuevo equipo
        const { data: newEquipment, error: insertError } = await supabase
          .from('equipment_requests')
          .insert(equipmentData)
          .select('id')
          .single();
        
        if (insertError || !newEquipment) {
          console.error("Error al crear equipo:", insertError?.message);
          return false;
        }
        
        equipmentId = newEquipment.id;
      }
      
      // Actualizar referencia en aplicación
      const { error: appUpdateError } = await supabase
        .from('credit_applications')
        .update({
          equipment_id: equipmentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);
        
      if (appUpdateError) {
        console.error("Error al actualizar aplicación:", appUpdateError);
        return false;
      }
      
      console.log("Datos guardados exitosamente");
      return true;
    } catch (error) {
      console.error("Error general:", error);
      return false;
    }
  }
  
  return (
    <div>
      <EquipmentForm 
        initialData={equipmentData} 
        onSubmit={saveEquipmentData}
        applicationId={application.id}
      />
    </div>
  );
} 