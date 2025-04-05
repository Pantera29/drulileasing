import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatCurrency } from '@/lib/utils';

// Forzar que la ruta sea dinámica
export const dynamic = 'force-dynamic';

export default async function ApproveApplicationPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params;
  const supabase = await createClient();
  
  // Verificar autenticación y rol
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login?error=session_expired');
  }
  
  // Verificar si es analista o admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id);
    
  const roles = userRoles?.map(ur => ur.role) || [];
  const isAnalyst = roles.includes('analyst');
  const isAdmin = roles.includes('admin');
  
  if (!isAnalyst && !isAdmin) {
    redirect('/admin/dashboard?error=unauthorized');
  }
  
  // Obtener datos mínimos de la solicitud
  const { data: application, error } = await supabase
    .from('credit_applications')
    .select(`
      id,
      application_status,
      analyst_id,
      analysis_started_at,
      equipment_id,
      profiles!credit_applications_profile_id_fkey(full_name),
      equipment_requests!credit_applications_equipment_id_fkey(approximate_amount, desired_term)
    `)
    .eq('id', id)
    .single();
    
  if (error || !application) {
    console.error('Error al obtener la solicitud:', error);
    redirect('/admin/applications?error=application_not_found');
  }
  
  // Verificar que la solicitud esté asignada al analista actual
  if (application.analyst_id !== session.user.id && !isAdmin) {
    redirect(`/admin/applications/${id}?error=not_assigned`);
  }
  
  // Verificar que la solicitud esté en análisis y tenga fecha de inicio
  if (application.application_status !== 'pending_analysis' || !application.analysis_started_at) {
    redirect(`/admin/applications/${id}?error=invalid_status`);
  }
  
  // Información del equipo solicitado para mostrar y sugerir montos
  const requestedAmount = application.equipment_requests?.approximate_amount || 0;
  const requestedTerm = application.equipment_requests?.desired_term || 12;
  
  // Función para aprobar la solicitud
  async function approveApplication(formData: FormData) {
    'use server';
    
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, message: 'Sesión expirada' };
    }
    
    // Obtener datos del formulario
    const adjustedAmount = parseFloat(formData.get('adjusted_amount') as string);
    const adjustedTerm = parseInt(formData.get('adjusted_term') as string);
    const comments = formData.get('comments') as string;
    
    // Validar datos
    if (isNaN(adjustedAmount) || adjustedAmount <= 0) {
      return { success: false, message: 'El monto ajustado no es válido' };
    }
    
    if (isNaN(adjustedTerm) || adjustedTerm <= 0) {
      return { success: false, message: 'El plazo ajustado no es válido' };
    }
    
    // Calcular pago mensual (tasa anual del 15%)
    const annualRate = 0.15;
    const monthlyRate = annualRate / 12;
    const monthlyPayment = Math.round(
      (adjustedAmount * monthlyRate * Math.pow(1 + monthlyRate, adjustedTerm)) / 
      (Math.pow(1 + monthlyRate, adjustedTerm) - 1)
    );
    
    try {
      // Iniciar transacción
      // 1. Guardar la decisión del analista
      const { error: decisionError } = await supabase
        .from('analyst_decisions')
        .insert({
          application_id: id,
          analyst_id: session.user.id,
          decision_type: 'approved',
          adjusted_amount: adjustedAmount,
          adjusted_term: adjustedTerm,
          comments: comments
        });
        
      if (decisionError) {
        console.error('Error al guardar decisión:', decisionError);
        throw new Error('No se pudo guardar la decisión');
      }
      
      // 2. Actualizar solicitud
      const { error: updateError } = await supabase
        .from('credit_applications')
        .update({
          application_status: 'approved',
          approved_amount: adjustedAmount,
          approved_term: adjustedTerm,
          monthly_payment: monthlyPayment,
          analysis_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (updateError) {
        console.error('Error al actualizar solicitud:', updateError);
        throw new Error('No se pudo actualizar la solicitud');
      }
      
      // 3. Registrar actividad
      await supabase.from('analyst_activities').insert({
        analyst_id: session.user.id,
        application_id: id,
        activity_type: 'approve',
        details: { 
          adjusted_amount: adjustedAmount,
          adjusted_term: adjustedTerm
        }
      });
      
      // 4. Enviar notificación al usuario (opcional)
      // Aquí se implementaría el código para enviar una notificación por email
      
      return { success: true };
    } catch (error) {
      console.error('Error en el proceso de aprobación:', error);
      return { success: false, message: 'Error en el proceso de aprobación' };
    }
  }
  
  // Calcular pago mensual estimado
  const calculateMonthlyPayment = (amount: number, term: number) => {
    const annualRate = 0.15; // 15% anual
    const monthlyRate = annualRate / 12;
    return Math.round(
      (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
      (Math.pow(1 + monthlyRate, term) - 1)
    );
  };
  
  // Pago mensual con los valores originales
  const originalMonthlyPayment = calculateMonthlyPayment(requestedAmount, requestedTerm);
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/admin/applications/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a la solicitud
        </Link>
        <h1 className="text-2xl font-bold">Aprobar solicitud</h1>
        <p className="text-gray-500">
          Solicitud de {application.profiles?.full_name || 'Cliente'}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalles del equipo solicitado</CardTitle>
          <CardDescription>Valores originales solicitados por el cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Monto solicitado</p>
              <p className="font-medium">{formatCurrency(requestedAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plazo solicitado</p>
              <p className="font-medium">{requestedTerm} meses</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pago mensual estimado</p>
              <p className="font-medium">{formatCurrency(originalMonthlyPayment)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulario de aprobación</CardTitle>
          <CardDescription>Ajuste los términos del crédito si es necesario</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={approveApplication} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="adjusted_amount" className="text-sm font-medium">
                  Monto aprobado
                </label>
                <Input 
                  id="adjusted_amount"
                  name="adjusted_amount"
                  type="number"
                  defaultValue={requestedAmount}
                  min="1000"
                  step="1000"
                  required
                />
                <p className="text-xs text-gray-500">
                  Ingrese el monto final aprobado para el cliente
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="adjusted_term" className="text-sm font-medium">
                  Plazo aprobado (meses)
                </label>
                <Input 
                  id="adjusted_term"
                  name="adjusted_term"
                  type="number"
                  defaultValue={requestedTerm}
                  min="1"
                  max="60"
                  required
                />
                <p className="text-xs text-gray-500">
                  Ingrese el plazo en meses (máximo 60)
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-medium">
                Comentarios (internos)
              </label>
              <Textarea 
                id="comments"
                name="comments"
                placeholder="Agregue comentarios relevantes sobre la decisión..."
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500">
                Estos comentarios solo serán visibles para analistas y administradores
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start">
              <Calculator className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Cálculo preliminar
                </p>
                <p className="text-sm text-amber-700">
                  Con los valores actuales, el pago mensual sería de aproximadamente <strong>{formatCurrency(originalMonthlyPayment)}</strong> (tasa anual del 15%).
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="flex-1 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmar aprobación
              </Button>
              
              <Link href={`/admin/applications/${id}`}>
                <Button variant="outline" className="flex-1 w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 