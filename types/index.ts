// Tipos generales de la aplicación
export * from './database'

// Tipos para Google Earth Engine
export interface GEETemperatureData {
  date: string
  temperature: number
  level: number
}

export interface GEEQueryParams {
  latitude: number
  longitude: number
  startDate: string
  endDate: string
}

// Tipos para reportes
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed'

// Tipos para formularios
export interface ClientFormData {
  company_name: string
  contact_email: string
  contact_phone?: string
}

export interface LocationFormData {
  client_id: string
  site_name: string
  latitude: number
  longitude: number
  area_hectares?: number
  application_date?: string
}

// Tipos para respuestas de API
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}