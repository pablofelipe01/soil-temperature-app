import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización para mejor estabilidad de webpack
  webpack: (config, { dev }) => {
    if (dev) {
      // Configuraciones para desarrollo más estable
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/
      }
    }
    
    // Optimización para Leaflet y módulos de reportes
    config.resolve.alias = {
      ...config.resolve.alias,
      'leaflet': 'leaflet/dist/leaflet.js'
    }
    
    return config
  },
  
  // Optimización de chunks para evitar errores de módulos perdidos
  experimental: {
    // Removido optimizeCss que causaba problemas con critters
    optimizePackageImports: ['leaflet']
  }
};

export default nextConfig;
