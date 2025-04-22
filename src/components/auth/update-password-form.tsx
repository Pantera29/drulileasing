"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createClient } from '../../lib/supabase/client';

// Esquema de validación
const updatePasswordSchema = z.object({
  password: z.string().min(8, {
    message: "La contraseña debe tener al menos 8 caracteres",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

export function UpdatePasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  // Configurar el formulario
  const form = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      // Actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: form.getValues("password")
      });

      if (updateError) throw updateError;

      // Redireccionar al login con mensaje de éxito
      router.push("/login?msg=password_updated");
      setSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Error al actualizar contraseña:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Ha ocurrido un error al actualizar la contraseña"
      );
    }
  };

  return (
    <div className="w-full max-w-md p-6 space-y-4">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Actualizar contraseña</h1>
        <p className="text-gray-500">Ingresa tu nueva contraseña</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nueva contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="********" {...field} />
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

          {success && (
            <p className="text-sm text-green-600">Contraseña actualizada exitosamente</p>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Actualizando..." : "Actualizar contraseña"}
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