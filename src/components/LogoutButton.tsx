"use client";

import { LogOut } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export function LogoutButton() {
  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full flex items-center px-6 py-3 hover:bg-indigo-800 transition-colors"
    >
      <LogOut className="h-5 w-5 mr-3" />
      <span>Cerrar sesión</span>
    </button>
  );
} 