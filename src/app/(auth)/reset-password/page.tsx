import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { Header } from "@/components/shared/header";
import { Footer } from "@/components/shared/footer";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center py-12">
        <PasswordResetForm />
      </main>
      <Footer />
    </div>
  );
} 