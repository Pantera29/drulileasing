/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Ignorar errores durante el build
    ignoreDuringBuilds: true
  },
  typescript: {
    // Ignorar errores de TypeScript durante el build
    ignoreBuildErrors: true
  },
  // No hacer optimizaciones de generación estática para rutas dinámicas
  staticPageGenerationTimeout: 1000,
  // Configuración específica para forzar modo dinámico en ciertas rutas
  experimental: {
    // No mostrar advertencias para CSR bailout
    missingSuspenseWithCSRBailout: false,
    // Usar el nuevo sistema de compilación
    serverActions: true
  },
  // Ignorar las referencias a cookies() durante el build
  webpack: (config, { isServer }) => {
    // Configuraciones adicionales para webpack
    if (isServer) {
      config.externals = [...config.externals, 'cookies']
    }
    return config
  }
}

module.exports = nextConfig 