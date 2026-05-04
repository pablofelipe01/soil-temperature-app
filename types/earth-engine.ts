// Tipos específicos para Google Earth Engine
export interface GEECredentials {
  serviceAccountEmail: string
  privateKey: string
  projectId: string
}

export interface GEETemperatureQuery {
  latitude: number
  longitude: number
  startDate: string // Format: 'YYYY-MM-DD'
  endDate: string   // Format: 'YYYY-MM-DD'
}

export interface GEESoilTemperatureData {
  date: string // Format: 'YYYY-MM-DD'
  temperature_level_1?: number // 0-7 cm depth (Celsius)
  temperature_level_2?: number // 7-28 cm depth (Celsius)
  temperature_level_3?: number // 28-100 cm depth (Celsius)
  temperature_level_4?: number // 100-289 cm depth (Celsius)
}

export interface GEESoilMoistureData {
  date: string // Format: 'YYYY-MM-DD'
  moisture_level_1?: number // 0-7 cm depth (m3/m3)
  moisture_level_2?: number // 7-28 cm depth (m3/m3)
  moisture_level_3?: number // 28-100 cm depth (m3/m3)
  moisture_level_4?: number // 100-289 cm depth (m3/m3)
}

export interface GEETemperatureResponse {
  success: boolean
  data?: GEESoilTemperatureData[]
  error?: string
  metadata?: {
    location: {
      latitude: number
      longitude: number
    }
    dateRange: {
      start: string
      end: string
    }
    recordCount: number
    dataset: string
  }
}

export interface GEEMoistureResponse {
  success: boolean
  data?: GEESoilMoistureData[]
  error?: string
  metadata?: {
    location: {
      latitude: number
      longitude: number
    }
    dateRange: {
      start: string
      end: string
    }
    recordCount: number
    dataset: string
  }
}

// Configuración del dataset ERA5-Land
export const ERA5_LAND_CONFIG = {
  dataset: 'ECMWF/ERA5_LAND/MONTHLY_AGGR',
  temperatureBands: [
    'soil_temperature_level_1', // 0-7 cm
    'soil_temperature_level_2', // 7-28 cm
    'soil_temperature_level_3', // 28-100 cm
    'soil_temperature_level_4'  // 100-289 cm
  ],
  moistureBands: [
    'volumetric_soil_water_layer_1', // 0-7 cm
    'volumetric_soil_water_layer_2', // 7-28 cm
    'volumetric_soil_water_layer_3', // 28-100 cm
    'volumetric_soil_water_layer_4'  // 100-289 cm
  ],
  scale: 11132, // Resolución aproximada en metros (~11km)
  maxPixels: 1e9,
  // Conversión de Kelvin a Celsius
  kelvinToCelsius: (kelvin: number) => kelvin - 273.15
} as const

// Tipos para errores de GEE
export interface GEEError {
  code?: string
  message: string
  details?: unknown
}

// Tipos para validación de parámetros
export interface GEEValidationResult {
  isValid: boolean
  errors: string[]
}

// Helper types
export type GEETemperatureBand = typeof ERA5_LAND_CONFIG.temperatureBands[number]
export type GEEMoistureBand = typeof ERA5_LAND_CONFIG.moistureBands[number]
export type GEETemperatureLevel = 1 | 2 | 3 | 4