// Configuración del sitio - constantes globales
export const siteConfig = {
  name: "Sistema de Monitoreo de Temperatura del Suelo",
  description: "Sistema para obtener, almacenar y reportar datos de temperatura del suelo para certificación de bonos de carbono por biochar",
  version: "1.0.0",
  author: "Pablo Felipe",
  
  // URLs
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  
  // Configuración de la aplicación
  app: {
    defaultPageSize: 10,
    maxPageSize: 100,
    
    // Configuración Earth Engine
    earthEngine: {
      dataset: 'ECMWF/ERA5_LAND/MONTHLY_AGGR',
      bands: [
        'soil_temperature_level_1', // 0-7 cm
        'soil_temperature_level_2', // 7-28 cm  
        'soil_temperature_level_3', // 28-100 cm
        'soil_temperature_level_4'  // 100-289 cm
      ],
      resolution: 11132, // ~11km en metros
    },
    
    // Configuración de reportes
    reports: {
      maxPeriodMonths: 24,
      allowedFormats: ['pdf', 'xlsx'],
      defaultStatus: 'pending' as const
    }
  },
  
  // Links de navegación
  mainNav: [
    {
      title: "Dashboard",
      href: "/",
    },
    {
      title: "Clientes", 
      href: "/clients",
    },
    {
      title: "Ubicaciones",
      href: "/locations", 
    },
    {
      title: "Reportes",
      href: "/reports",
    }
  ],
  
  // Enlaces externos
  links: {
    supabase: "https://supabase.com",
    earthEngine: "https://earthengine.google.com",
    puroEarth: "https://puro.earth"
  }
} as const