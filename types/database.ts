// Tipos TypeScript generados para la base de datos Supabase
// Basado en el schema SQL que creamos

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          company_name: string
          contact_email: string
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_name: string
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_name?: string
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          client_id: string
          site_name: string
          latitude: number
          longitude: number
          area_hectares: number | null
          application_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          site_name: string
          latitude: number
          longitude: number
          area_hectares?: number | null
          application_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          site_name?: string
          latitude?: number
          longitude?: number
          area_hectares?: number | null
          application_date?: string | null
          created_at?: string
        }
      }
      soil_temperatures: {
        Row: {
          id: string
          location_id: string
          measurement_date: string
          temp_level_1: number | null
          temp_level_2: number | null
          temp_level_3: number | null
          temp_level_4: number | null
          data_source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          measurement_date: string
          temp_level_1?: number | null
          temp_level_2?: number | null
          temp_level_3?: number | null
          temp_level_4?: number | null
          data_source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          measurement_date?: string
          temp_level_1?: number | null
          temp_level_2?: number | null
          temp_level_3?: number | null
          temp_level_4?: number | null
          data_source?: string | null
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          client_id: string
          period_start: string
          period_end: string
          file_url: string | null
          status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          period_start: string
          period_end: string
          file_url?: string | null
          status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          period_start?: string
          period_end?: string
          file_url?: string | null
          status?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Tipos de conveniencia para uso en la aplicación
export type Client = Database['public']['Tables']['clients']['Row']
export type Location = Database['public']['Tables']['locations']['Row']
export type SoilTemperature = Database['public']['Tables']['soil_temperatures']['Row']
export type Report = Database['public']['Tables']['reports']['Row']

export type ClientInsert = Database['public']['Tables']['clients']['Insert']
export type LocationInsert = Database['public']['Tables']['locations']['Insert']
export type SoilTemperatureInsert = Database['public']['Tables']['soil_temperatures']['Insert']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']

export type ClientUpdate = Database['public']['Tables']['clients']['Update']
export type LocationUpdate = Database['public']['Tables']['locations']['Update']
export type SoilTemperatureUpdate = Database['public']['Tables']['soil_temperatures']['Update']
export type ReportUpdate = Database['public']['Tables']['reports']['Update']