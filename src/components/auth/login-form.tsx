"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createBrowserClient } from '@supabase/ssr';
import { AlertCircle } from "lucide-react";

// Esquema de validación
const loginSchema = z.object({
  email: z.string().email({
    message: "Por favor ingresa un correo electrónico válido",
  }),
  password: z.string().min(1, {
    message: "La contraseña es requerida",
  }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningSession, setIsCleaningSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  // Obtener el returnUrl si existe para redireccionar después del login
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';
  const errorParam = searchParams.get('error');

  // Comprobar si hay una sesión activa al cargar
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(returnUrl);
      }
    };
    
    checkSession();

    // Mostrar error si viene de una redirección
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'session_error': 'Error al verificar la sesión. Por favor, inicia sesión nuevamente.',
        'no_session': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        'invalid_user': 'Usuario no válido. Por favor, inicia sesión nuevamente.',
        'user_check_error': 'Error al verificar el usuario. Por favor, inicia sesión nuevamente.',
        'check_auth_error': 'Error al verificar la autenticación. Por favor, inicia sesión nuevamente.',
        'signed_out': 'Has cerrado sesión correctamente.',
        'event_no_session': 'Tu sesión ha finalizado. Por favor, inicia sesión nuevamente.',
      };
      
      setError(errorMessages[errorParam] || 'Error de autenticación. Por favor, inicia sesión nuevamente.');
    }
  }, [router, supabase, returnUrl, errorParam]);

  // Configurar el formulario
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  // Función para forzar la eliminación de sesiones
  const handleForceCleanSession = async () => {
    setIsCleaningSession(true);
    setError(null);
    
    try {
      // Intentar cerrar la sesión en Supabase
      await supabase.auth.signOut({ scope: 'global' });
      
      // Limpiar localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('supabase') || key.includes('sb-'))) {
          localStorage.removeItem(key);
        }
      }
      
      // Limpiar cookies
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const [name] = cookie.trim().split('=');
        if (name && (name.includes('supabase') || name.includes('sb-'))) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
      }
      
      // Mostrar mensaje de éxito
      setError("Sesión limpiada. Ahora puedes intentar iniciar sesión nuevamente.");
    } catch (error) {
      console.error("Error al limpiar la sesión:", error);
      setError("Error al limpiar la sesión. Intenta recargar la página.");
    } finally {
      setIsCleaningSession(false);
    }
  };

  // Función para manejar el envío del formulario
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Intentando iniciar sesión con email:', data.email);
      
      // Iniciar sesión con Supabase
      const { error: signInError, data: signInData } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.error('Error de Supabase al iniciar sesión:', signInError);
        throw signInError;
      }

      // Verificar que el inicio de sesión fue exitoso
      if (signInData?.user) {
        console.log('Inicio de sesión exitoso para el usuario:', signInData.user.id);
        
        // Esperar un momento para asegurar que la sesión se haya propagado
        setTimeout(() => {
          // Redireccionar a la URL de retorno o al dashboard
          router.push(returnUrl);
        }, 500);
      } else {
        throw new Error("No se pudo iniciar sesión");
      }
    } catch (error) {
      console.error("Error durante el inicio de sesión:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Ha ocurrido un error durante el inicio de sesión"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Iniciar sesión</h1>
        <p className="text-gray-500">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      {errorParam && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-md flex items-start space-x-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="tu@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Contraseña</FormLabel>
                  <Link
                    href="/reset-password"
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="remember"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-normal">
                    Recordarme
                  </FormLabel>
                </div>
              </FormItem>
            )}
          />

          {error && !errorParam && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        ¿No tienes una cuenta?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Regístrate ahora
        </Link>
      </div>

      <div className="border-t pt-4 mt-4">
        <p className="text-xs text-gray-500 mb-2">
          ¿Problemas para iniciar sesión? Prueba a limpiar tu sesión:
        </p>
        <Button 
          type="button" 
          variant="outline"
          size="sm"
          className="w-full text-xs" 
          disabled={isCleaningSession}
          onClick={handleForceCleanSession}
        >
          {isCleaningSession ? "Limpiando sesión..." : "Forzar limpieza de sesión"}
        </Button>
      </div>
    </div>
  );
} 