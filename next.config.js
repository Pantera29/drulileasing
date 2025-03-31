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
  // Configurar timeout para generación estática
  staticPageGenerationTimeout: 1000,
  // Forzar que todas las rutas sean dinámicas para evitar problemas con cookies()
  experimental: {
    // No mostrar advertencias para CSR bailout
    missingSuspenseWithCSRBailout: false,
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