import React from 'react';
import { EquipmentForm } from '@/components/application/forms/equipment-form';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { type EquipmentFormData } from '@/lib/schemas/equipment-schema';
import type { Equipment } from '@/lib/types/equipment';

// Forzar que esta ruta sea dinámica
export const dynamic = 'force-dynamic';
// Indicar el runtime de Node.js
export const runtime = 'nodejs';

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
    .eq('status', 'pending')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();
    
  if (!application) {
    // Si no hay aplicación, redirigir a la página principal para crear una
    redirect('/');
  }

  // Obtener el catálogo de equipos activos
  const { data: equipmentCatalog } = await supabase
    .from('equipment')
    .select(`
      id,
      name,
      brand,
      model,
      price,
      description,
      specifications,
      company_id,
      equipment_companies!inner(
        name,
        is_active
      )
    `)
    .eq('is_active', true)
    .eq('equipment_companies.is_active', true)
    .order('brand', { ascending: true });
  
  // Obtener el equipo seleccionado si existe
  let selectedEquipment = null;
  if (application.equipment_id) {
    const { data: equipment } = await supabase
      .from('equipment')
      .select(`
        id,
        name,
        brand,
        model,
        price,
        description,
        equipment_companies(name)
      `)
      .eq('id', application.equipment_id)
      .single();
      
    if (equipment) {
      selectedEquipment = equipment;
    }
  }
  
  // Función simplificada para guardar selección de equipo
  async function saveEquipmentSelection(data: { equipment_id: string; desired_term: number; additional_comments?: string }) {
    'use server';
    
    const supabase = await createClient();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return false;
      }
      
      // Obtener aplicación actual
      const { data: application } = await supabase
        .from('credit_applications')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('status', 'pending')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!application) {
        return false;
      }
      
      // Obtener datos del equipo seleccionado
      const { data: equipment } = await supabase
        .from('equipment')
        .select('price')
        .eq('id', data.equipment_id)
        .single();
      
      if (!equipment) {
        return false;
      }
      
      // Actualizar solicitud con equipo seleccionado y términos básicos
      const { error } = await supabase
        .from('credit_applications')
        .update({
          equipment_id: data.equipment_id,
          equipment_price: equipment.price,
          financed_amount: equipment.price, // Sin enganche por defecto
          term_months: data.desired_term,
          // Cálculos básicos (después los haremos más sofisticados)
          interest_rate: 0.125, // 12.5% por defecto
          monthly_payment: equipment.price * 0.125 / 12 * data.desired_term,
          total_to_pay: equipment.price * 1.125,
          updated_at: new Date().toISOString()
        })
        .eq('id', application.id);
      
      return !error;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  }
  
  return (
    <div>
      <EquipmentForm 
        selectedEquipment={selectedEquipment} 
        equipmentCatalog={equipmentCatalog || []}
        onSubmit={saveEquipmentSelection}
        applicationId={application.id}
      />
    </div>
  );
} 