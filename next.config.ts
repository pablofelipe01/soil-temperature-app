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
    
    // Optimización para Leaflet
    config.resolve.alias = {
      ...config.resolve.alias,
      'leaflet': 'leaflet/dist/leaflet.js'
    }
    
    return config
  },
  
  // Configuración de Turbopack para mejor hot reload
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Optimización de chunks para evitar errores de módulos perdidos
  output: 'standalone'
};

export default nextConfig;
