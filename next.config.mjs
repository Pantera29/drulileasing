/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Ignorar errores durante el despliegue
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Declarar el entorno del servidor como dinámico
  experimental: {
    serverActions: {
      allowedOrigins: ["vercel.app", "localhost:3000"],
    },
  },
}

export default nextConfig; 