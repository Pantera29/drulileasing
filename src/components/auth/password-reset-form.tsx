"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { supabase } from "@/lib/supabase";

// Esquema de validación
const resetPasswordSchema = z.object({
  email: z.string().email({
    message: "Por favor ingresa un correo electrónico válido",
  }),
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Configurar el formulario
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Función para manejar el envío del formulario
  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Enviar correo de restablecimiento de contraseña
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email, 
        {
          redirectTo: `${window.location.origin}/reset-password/update`,
        }
      );

      if (resetError) throw resetError;

      // Mostrar mensaje de éxito
      setIsEmailSent(true);
    } catch (error) {
      console.error("Error al enviar correo de restablecimiento:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Ha ocurrido un error al enviar el correo de restablecimiento"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Mensaje de éxito cuando se envía el correo
  if (isEmailSent) {
    return (
      <div className="mx-auto max-w-md space-y-6 px-4 py-8 text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="w-6 h-6 text-green-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Correo enviado</h1>
        <p className="text-gray-500">
          Hemos enviado un correo electrónico con instrucciones para restablecer tu contraseña.
          Por favor revisa tu bandeja de entrada.
        </p>
        <Link href="/login">
          <Button className="mt-4">Volver a inicio de sesión</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Restablecer contraseña</h1>
        <p className="text-gray-500">
          Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña
        </p>
      </div>

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

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Enviando..." : "Enviar instrucciones"}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
} 