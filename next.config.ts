import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuraciones esenciales para Next.js 15
  reactStrictMode: true,
  // Marcar todas las rutas del grupo /app como dinámicas
  unstable_runtimeJS: true,
};

export default nextConfig;
