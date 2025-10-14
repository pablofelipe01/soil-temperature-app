// Servicios para obtener datos de temperatura del suelo desde Google Earth Engine
import { earthEngineClient } from './client'
import type { 
  GEETemperatureQuery, 
  GEESoilTemperatureData, 
  GEETemperatureResponse,
  GEEValidationResult 
} from '@/types/earth-engine'
import { ERA5_LAND_CONFIG } from '@/types/earth-engine'

export class SoilTemperatureService {
  
  /**
   * Valida los parámetros de la consulta
   */
  private validateQuery(query: GEETemperatureQuery): GEEValidationResult {
    const errors: string[] = []

    // Validar coordenadas
    if (query.latitude < -90 || query.latitude > 90) {
      errors.push('La latitud debe estar entre -90 y 90')
    }
    if (query.longitude < -180 || query.longitude > 180) {
      errors.push('La longitud debe estar entre -180 y 180')
    }

    // Validar fechas
    const startDate = new Date(query.startDate)
    const endDate = new Date(query.endDate)
    const now = new Date()
    
    if (isNaN(startDate.getTime())) {
      errors.push('Fecha de inicio inválida')
    }
    if (isNaN(endDate.getTime())) {
      errors.push('Fecha de fin inválida')
    }
    if (startDate >= endDate) {
      errors.push('La fecha de inicio debe ser anterior a la fecha de fin')
    }
    if (endDate > now) {
      errors.push('La fecha de fin no puede ser futura')
    }

    // Validar rango de fechas (ERA5-Land disponible desde 1950)
    const minDate = new Date('1950-01-01')
    if (startDate < minDate) {
      errors.push('La fecha de inicio no puede ser anterior a 1950-01-01')
    }

    // Validar que no sea demasiado reciente (ERA5 tiene delay de ~3 meses)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    if (endDate > threeMonthsAgo) {
      errors.push('Los datos más recientes disponibles son de hace 3 meses aproximadamente')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Obtiene datos de temperatura del suelo para una ubicación y período específicos
   */
  async getSoilTemperatureData(query: GEETemperatureQuery): Promise<GEETemperatureResponse> {
    try {
      // Validar parámetros
      const validation = this.validateQuery(query)
      if (!validation.isValid) {
        return {
          success: false,
          error: `Parámetros inválidos: ${validation.errors.join(', ')}`
        }
      }

      // Asegurar que Earth Engine esté inicializado
      const ee = await earthEngineClient.getEE()

      // Crear punto de interés
      const point = ee.Geometry.Point([query.longitude, query.latitude])

      // Cargar colección ERA5-Land
      const era5Collection = ee.ImageCollection(ERA5_LAND_CONFIG.dataset)
        .filterDate(query.startDate, query.endDate)
        .filterBounds(point)

      // Seleccionar bandas de temperatura del suelo
      const soilTemperatureCollection = era5Collection.select([...ERA5_LAND_CONFIG.bands])

      // Función para extraer valores en el punto específico
      const extractTemperatureData = async (): Promise<GEESoilTemperatureData[]> => {
        return new Promise((resolve, reject) => {
          soilTemperatureCollection.getRegion(point, ERA5_LAND_CONFIG.scale, 'epsg:4326')
            .evaluate((result: unknown, error: unknown) => {
              if (error) {
                reject(error)
                return
              }

              try {
                // Procesar resultados
                const data = result as Array<Array<string | number>>
                
                if (!Array.isArray(data) || data.length <= 1) {
                  resolve([])
                  return
                }

                // La primera fila contiene los headers
                const headers = data[0] as string[]
                const temperatureData: GEESoilTemperatureData[] = []

                // Encontrar índices de las columnas
                const timeIndex = headers.indexOf('time')
                const level1Index = headers.indexOf('soil_temperature_level_1')
                const level2Index = headers.indexOf('soil_temperature_level_2')
                const level3Index = headers.indexOf('soil_temperature_level_3')
                const level4Index = headers.indexOf('soil_temperature_level_4')

                // Procesar cada fila de datos (saltando el header)
                for (let i = 1; i < data.length; i++) {
                  const row = data[i] as Array<string | number>
                  
                  // Extraer timestamp y convertir a fecha
                  const timestamp = row[timeIndex] as number
                  const date = new Date(timestamp).toISOString().split('T')[0]

                  // Extraer temperaturas y convertir de Kelvin a Celsius
                  const tempData: GEESoilTemperatureData = {
                    date,
                    temperature_level_1: level1Index >= 0 && row[level1Index] !== null 
                      ? ERA5_LAND_CONFIG.kelvinToCelsius(row[level1Index] as number) 
                      : undefined,
                    temperature_level_2: level2Index >= 0 && row[level2Index] !== null 
                      ? ERA5_LAND_CONFIG.kelvinToCelsius(row[level2Index] as number) 
                      : undefined,
                    temperature_level_3: level3Index >= 0 && row[level3Index] !== null 
                      ? ERA5_LAND_CONFIG.kelvinToCelsius(row[level3Index] as number) 
                      : undefined,
                    temperature_level_4: level4Index >= 0 && row[level4Index] !== null 
                      ? ERA5_LAND_CONFIG.kelvinToCelsius(row[level4Index] as number) 
                      : undefined,
                  }

                  temperatureData.push(tempData)
                }

                // Ordenar por fecha
                temperatureData.sort((a, b) => a.date.localeCompare(b.date))
                resolve(temperatureData)

              } catch (processError) {
                reject(processError)
              }
            })
        })
      }

      // Obtener los datos
      const temperatureData = await extractTemperatureData()

      return {
        success: true,
        data: temperatureData,
        metadata: {
          location: {
            latitude: query.latitude,
            longitude: query.longitude
          },
          dateRange: {
            start: query.startDate,
            end: query.endDate
          },
          recordCount: temperatureData.length,
          dataset: ERA5_LAND_CONFIG.dataset
        }
      }

    } catch (error) {
      console.error('❌ Error obteniendo datos de temperatura del suelo:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al obtener datos de temperatura'
      }
    }
  }

  /**
   * Obtiene datos agregados de temperatura para un período (promedio, min, max)
   */
  async getAggregatedTemperatureData(
    query: GEETemperatureQuery
  ): Promise<GEETemperatureResponse & { 
    aggregated?: { 
      level_1: { avg: number; min: number; max: number }
      level_2: { avg: number; min: number; max: number }
      level_3: { avg: number; min: number; max: number }
      level_4: { avg: number; min: number; max: number }
    } 
  }> {
    const response = await this.getSoilTemperatureData(query)
    
    if (!response.success || !response.data || response.data.length === 0) {
      return response
    }

    // Calcular estadísticas agregadas para cada nivel
    const calculateStats = (values: number[]) => {
      if (values.length === 0) return { avg: 0, min: 0, max: 0 }
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      
      return { avg: Number(avg.toFixed(2)), min, max }
    }

    const level1Values = response.data.map(d => d.temperature_level_1).filter(v => v !== undefined) as number[]
    const level2Values = response.data.map(d => d.temperature_level_2).filter(v => v !== undefined) as number[]
    const level3Values = response.data.map(d => d.temperature_level_3).filter(v => v !== undefined) as number[]
    const level4Values = response.data.map(d => d.temperature_level_4).filter(v => v !== undefined) as number[]

    return {
      ...response,
      aggregated: {
        level_1: calculateStats(level1Values),
        level_2: calculateStats(level2Values),
        level_3: calculateStats(level3Values),
        level_4: calculateStats(level4Values)
      }
    }
  }
}

// Exportar instancia singleton
export const soilTemperatureService = new SoilTemperatureService()