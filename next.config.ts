import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  // Forzar que todas las rutas sean renderizadas dinámicamente
  experimental: {},
  // Para los errores de hidratación de suspense
  reactStrictMode: true,
};

export default nextConfig;
