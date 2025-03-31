/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Tratar directorios con paréntesis normalmente
  transpilePackages: [],
  // Configuración para generar una aplicación independiente
  output: 'standalone',
  eslint: {
    // Ignorar errores durante el build
    ignoreDuringBuilds: true
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true
  },
  // Configurar timeout para generación estática
  staticPageGenerationTimeout: 1000,
  // Forzar que todas las rutas sean dinámicas
  experimental: {
    // Habilitar server actions
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Ignorar las referencias a cookies durante el build
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, 'cookies']
    }
    return config
  }
}

module.exports = nextConfig 