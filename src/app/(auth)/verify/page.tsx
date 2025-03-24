import { VerifyEmail } from "@/components/auth/verify-email";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export default function VerifyPage() {
  // En un entorno real, este email se obtendría del estado compartido o desde URL search params
  // después del registro. Aquí lo usamos como ejemplo.
  const emailExample = "usuario@ejemplo.com";
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-12">
        <VerifyEmail email={emailExample} />
      </main>
      <Footer />
    </div>
  );
} 