import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createBrowserClient } from '@supabase/ssr';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Bell,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/LogoutButton';

// Forzar que la ruta sea dinámica para siempre verificar la autenticación
export const dynamic = 'force-dynamic';

// Función para verificar el rol del usuario
async function checkUserRole() {
  const supabase = await createClient();
  
  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { isAuthenticated: false, isAnalyst: false, isAdmin: false };
  }
  
  // Verificar si el usuario tiene el rol de analista o admin
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', session.user.id);
  
  const roles = userRoles?.map(ur => ur.role) || [];
  const isAnalyst = roles.includes('analyst');
  const isAdmin = roles.includes('admin');
  
  return {
    isAuthenticated: true,
    isAnalyst,
    isAdmin,
    user: session.user
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isAnalyst, isAdmin, user } = await checkUserRole();
  
  // Redireccionar si no está autenticado o no tiene permisos
  if (!isAuthenticated || (!isAnalyst && !isAdmin)) {
    redirect('/login?error=unauthorized');
  }
  
  // Obtener el nombre y correo del usuario directamente de la vista user_emails
  const supabase = await createClient();
  const { data: authUser } = await supabase
    .from('user_emails')
    .select('full_name, email')
    .eq('id', user?.id)
    .single();

  const userName = authUser?.full_name || authUser?.email?.split('@')[0] || 'Usuario';
  
  // Handler para logout desde el cliente
  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Barra lateral */}
      <div className="w-64 bg-indigo-900 text-white flex-shrink-0">
        <div className="p-6">
          <Link href="/admin/dashboard" className="flex items-center">
            <span className="text-2xl font-bold">Druli Admin</span>
          </Link>
        </div>
        
        <nav className="mt-6">
          <div className="px-4 mb-2 text-xs font-semibold text-indigo-300 uppercase">
            Principal
          </div>
          
          <Link href="/admin/dashboard">
            <div className="flex items-center px-6 py-3 hover:bg-indigo-800 transition-colors">
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </div>
          </Link>
          
          <Link href="/admin/applications">
            <div className="flex items-center px-6 py-3 hover:bg-indigo-800 transition-colors">
              <ClipboardList className="h-5 w-5 mr-3" />
              <span>Solicitudes</span>
            </div>
          </Link>
          
          {isAdmin && (
            <Link href="/admin/settings">
              <div className="flex items-center px-6 py-3 hover:bg-indigo-800 transition-colors">
                <Settings className="h-5 w-5 mr-3" />
                <span>Configuración</span>
              </div>
            </Link>
          )}
          
          <div className="border-t border-indigo-800 my-4"></div>
          
          <LogoutButton />
        </nav>
      </div>
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm py-3 px-6 flex justify-between items-center">
          <div className="flex-1">
            <div className="relative w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                <Search className="h-4 w-4 text-gray-400" />
              </span>
              <input 
                type="text" 
                placeholder="Buscar solicitudes..." 
                className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notificaciones */}
            <div className="relative">
              <button className="relative p-1 rounded-full text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
              </button>
            </div>
            
            {/* Perfil de usuario */}
            <div className="relative">
              <button className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-700">{userName}</p>
                  <p className="text-xs text-gray-500">{isAdmin ? 'Administrador' : 'Analista'}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
} 