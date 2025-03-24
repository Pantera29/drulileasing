"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

type VerifyEmailProps = {
  email?: string;
};

export function VerifyEmail({ email }: VerifyEmailProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para reenviar el correo de verificación
  async function handleResendEmail() {
    if (!email) return;
    
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (resendError) throw resendError;

      setResendSuccess(true);
    } catch (error) {
      console.error("Error al reenviar correo de verificación:", error);
      setError(
        error instanceof Error 
          ? error.message 
          : "Ha ocurrido un error al reenviar el correo de verificación"
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8 text-center">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          className="w-8 h-8 text-primary"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Verifica tu correo electrónico</h1>
      <p className="text-gray-600">
        Hemos enviado un correo de verificación a{" "}
        <span className="font-medium text-primary">{email || "tu correo"}</span>.
        <br />
        Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación.
      </p>

      {resendSuccess && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm">
          ¡Correo de verificación reenviado con éxito!
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4 pt-4">
        <Button
          onClick={handleResendEmail}
          variant="outline"
          disabled={isResending || !email}
          className="w-full"
        >
          {isResending ? "Reenviando..." : "Reenviar correo de verificación"}
        </Button>

        <div className="text-sm text-gray-500">
          ¿Ya verificaste tu correo?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  );
} 