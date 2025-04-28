import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';

// Forzar que la ruta sea dinámica
export const dynamic = 'force-dynamic';

// Lista de razones comunes de rechazo
const REJECTION_REASONS = [
  { id: 'insufficient_income', label: 'Ingresos insuficientes' },
  { id: 'poor_credit_history', label: 'Historial crediticio deficiente' },
  { id: 'incomplete_documentation', label: 'Documentación incompleta/incorrecta' },
  { id: 'high_debt_ratio', label: 'Alta relación deuda-ingreso' },
  { id: 'fraud_suspicion', label: 'Sospecha de fraude o información inconsistente' },
  { id: 'hawk_alerts', label: 'Alertas en buró de crédito' },
  { id: 'policy_restrictions', label: 'No cumple con políticas de la empresa' },
  { id: 'other', label: 'Otra razón (especificar en comentarios)' },
];

export default async function RejectApplicationPage({
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
  
  // Información del equipo solicitado
  const requestedAmount = application.equipment_requests?.approximate_amount || 0;
  const requestedTerm = application.equipment_requests?.desired_term || 12;
  
  // Función para rechazar la solicitud
  async function rejectApplication(formData: FormData) {
    'use server';
    
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, message: 'Sesión expirada' };
    }
    
    // Obtener datos del formulario
    const rejectionReason = formData.get('rejection_reason') as string;
    const comments = formData.get('comments') as string;
    
    // Validar datos
    if (!rejectionReason) {
      return { success: false, message: 'Debe seleccionar un motivo de rechazo' };
    }
    
    try {
      // Iniciar transacción
      // 1. Guardar la decisión del analista
      const { error: decisionError } = await supabase
        .from('analyst_decisions')
        .insert({
          application_id: id,
          analyst_id: session.user.id,
          decision_type: 'rejected',
          rejection_reason: rejectionReason === 'other' && comments ? comments : REJECTION_REASONS.find(r => r.id === rejectionReason)?.label,
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
          application_status: 'rejected',
          rejection_reason: rejectionReason === 'other' && comments ? comments : REJECTION_REASONS.find(r => r.id === rejectionReason)?.label,
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
        activity_type: 'reject',
        details: { rejection_reason: rejectionReason }
      });
      
      // 4. Enviar notificación al usuario (opcional)
      // Aquí se implementaría el código para enviar una notificación por email
      
      // REDIRECCIÓN AL ÉXITO
      redirect('/admin/applications?success=rejected');
    } catch (error) {
      console.error('Error en el proceso de rechazo:', error);
      return { success: false, message: 'Error en el proceso de rechazo' };
    }
  }
  
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href={`/admin/applications/${id}`} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver a la solicitud
        </Link>
        <h1 className="text-2xl font-bold">Rechazar solicitud</h1>
        <p className="text-gray-500">
          Solicitud de {application.profiles?.full_name || 'Cliente'}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Detalles del equipo solicitado</CardTitle>
          <CardDescription>Información de la solicitud</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Monto solicitado</p>
              <p className="font-medium">{formatCurrency(requestedAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Plazo solicitado</p>
              <p className="font-medium">{requestedTerm} meses</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Formulario de rechazo</CardTitle>
          <CardDescription>Seleccione el motivo de rechazo y agregue comentarios</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={rejectApplication} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                Motivo de rechazo
              </label>
              <RadioGroup name="rejection_reason" className="grid grid-cols-1 gap-2" required>
                {REJECTION_REASONS.map((reason) => (
                  <div key={reason.id} className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value={reason.id} id={reason.id} />
                    <Label htmlFor={reason.id} className="cursor-pointer flex-1">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="comments" className="text-sm font-medium">
                Comentarios detallados (internos)
              </label>
              <Textarea 
                id="comments"
                name="comments"
                placeholder="Explique en detalle los motivos del rechazo..."
                className="min-h-[150px]"
              />
              <p className="text-xs text-gray-500">
                Estos comentarios solo serán visibles para analistas y administradores, pero ayudarán a entender la decisión
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
              <p className="font-medium">Importante</p>
              <p>
                Esta acción rechazará permanentemente la solicitud de crédito del cliente. 
                El cliente será notificado del rechazo, pero no verá los detalles específicos del motivo.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white shadow flex-1 flex items-center justify-center">
                <XCircle className="h-5 w-5 mr-2" />
                Confirmar rechazo
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