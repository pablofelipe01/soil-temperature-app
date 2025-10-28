import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para la consulta de datos
const temperatureQuerySchema = z.object({
  locationId: z.string().uuid('ID de ubicación debe ser un UUID válido'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  forceRefresh: z.boolean().default(false)
})

// GET /api/temperature-data - Obtener datos de temperatura para una ubicación
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Validar parámetros de entrada
    const validationResult = temperatureQuerySchema.safeParse({
      locationId: searchParams.get('locationId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      forceRefresh: searchParams.get('forceRefresh') === 'true'
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Parámetros inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const { locationId, startDate, endDate, forceRefresh } = validationResult.data

    // Verificar que la ubicación pertenezca al usuario
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: userId,
        isActive: true
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada o no autorizada' },
        { status: 404 }
      )
    }

    // Si no se fuerza la actualización, buscar datos existentes en la base de datos
    if (!forceRefresh) {
      const existingData = await prisma.soilTemperature.findMany({
        where: {
          locationId: locationId,
          measurementDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        orderBy: {
          measurementDate: 'asc'
        }
      })

      // Si tenemos datos completos, devolverlos
      if (existingData.length > 0) {
        const dateRange = getDaysInRange(startDate, endDate)
        const existingDates = existingData.map(d => d.measurementDate.toISOString().split('T')[0])
        const missingDates = dateRange.filter(date => !existingDates.includes(date))

        // Si no faltan muchos días (menos del 10%), usar datos existentes
        if (missingDates.length < dateRange.length * 0.1) {
          // Obtener fecha de biochar para clasificar datos
          const biocharStartDate = location.biocharStartDate

          // Transformar datos al formato esperado por el frontend
          const transformedData = existingData.map(record => {
            const recordDate = record.measurementDate.toISOString().split('T')[0]
            return {
              id: record.id,
              date: recordDate,
              temperatureCelsius: parseFloat((record.tempLevel1 || 0).toString()), // Usar el primer nivel como default
              dataSource: record.dataSource || 'ERA5-Land',
              isPostBiochar: biocharStartDate ? new Date(recordDate) >= biocharStartDate : false
            }
          })

          return NextResponse.json({
            success: true,
            data: transformedData,
            source: 'database',
            location: {
              id: location.id,
              name: location.name,
              latitude: parseFloat(location.latitude.toString()),
              longitude: parseFloat(location.longitude.toString())
            },
            biochar: {
              startDate: location.biocharStartDate?.toISOString().split('T')[0],
              quantity: location.biocharQuantity ? parseFloat(location.biocharQuantity.toString()) : undefined,
              unit: location.biocharUnit,
              frequency: location.biocharFrequency,
              notes: location.biocharNotes
            },
            dateRange: { startDate, endDate },
            stats: calculateStats(transformedData)
          })
        }
      }
    }

    // Intentar consultar datos desde Google Earth Engine
    const geeResult = await fetchTemperatureFromGEE(
      parseFloat(location.latitude.toString()),
      parseFloat(location.longitude.toString()),
      startDate,
      endDate
    )

    if (!geeResult.success) {
      // Si GEE no tiene datos disponibles, retornar mensaje informativo
      return NextResponse.json({
        success: false,
        error: geeResult.error || 'Datos satelitales no disponibles para las fechas seleccionadas',
        suggestion: 'Los datos más recientes disponibles son de hace aproximadamente 3 meses. Por favor, selecciona fechas anteriores a julio 2025.',
        availableDataUntil: '2025-07-31',
        location: {
          id: location.id,
          name: location.name,
          latitude: parseFloat(location.latitude.toString()),
          longitude: parseFloat(location.longitude.toString())
        },
        dateRange: { startDate, endDate }
      })
    }

    const temperatureRecords = geeResult.data

    // Guardar datos en la base de datos usando la estructura correcta
    const savedRecords = []
    console.log('🔍 geeResult.data structure:', JSON.stringify(temperatureRecords, null, 2))
    
    if (temperatureRecords) {
      for (const tempData of temperatureRecords) {
      console.log('🔍 Processing tempData:', JSON.stringify(tempData, null, 2))
      console.log('🔍 Direct access temperature_level_1:', tempData.temperature_level_1)
      
      const saved = await prisma.soilTemperature.upsert({
        where: {
          locationId_measurementDate_dataSource: {
            locationId: locationId,
            measurementDate: new Date(tempData.date),
            dataSource: 'ERA5-Land'
          }
        },
        update: {
          tempLevel1: tempData.temperature_level_1,
          tempLevel2: tempData.temperature_level_2,
          tempLevel3: tempData.temperature_level_3,
          tempLevel4: tempData.temperature_level_4
        },
        create: {
          locationId: locationId,
          measurementDate: new Date(tempData.date),
          tempLevel1: tempData.temperature_level_1,
          tempLevel2: tempData.temperature_level_2,
          tempLevel3: tempData.temperature_level_3,
          tempLevel4: tempData.temperature_level_4,
          dataSource: 'ERA5-Land'
        }
      })
      savedRecords.push(saved)
      }
    }
    
    // Obtener fecha de biochar para clasificar datos
    const biocharStartDate = location.biocharStartDate

    // Transformar datos al formato esperado por el frontend
    const transformedData = savedRecords.map(record => {
      const recordDate = record.measurementDate.toISOString().split('T')[0]
      return {
        id: record.id,
        date: recordDate,
        temperatureCelsius: parseFloat((record.tempLevel1 || 0).toString()),
        dataSource: record.dataSource || 'ERA5-Land',
        isPostBiochar: biocharStartDate ? new Date(recordDate) >= biocharStartDate : false
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedData,
      source: 'google_earth_engine',
      location: {
        id: location.id,
        name: location.name,
        latitude: parseFloat(location.latitude.toString()),
        longitude: parseFloat(location.longitude.toString())
      },
      biochar: {
        startDate: location.biocharStartDate?.toISOString().split('T')[0],
        quantity: location.biocharQuantity ? parseFloat(location.biocharQuantity.toString()) : undefined,
        unit: location.biocharUnit,
        frequency: location.biocharFrequency,
        notes: location.biocharNotes
      },
      dateRange: { startDate, endDate },
      stats: calculateStats(transformedData),
      message: 'Datos obtenidos desde Google Earth Engine'
    })

  } catch (error) {
    console.error('Error al obtener datos de temperatura:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Función para obtener datos de Google Earth Engine
async function fetchTemperatureFromGEE(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
) {
  try {
    // Usar directamente el servicio GEE en lugar del API endpoint
    const { soilTemperatureService } = await import('@/lib/earth-engine/services')
    
    console.log(`📍 POST - Consultando temperatura para: ${latitude}, ${longitude}`)
    
    const result = await soilTemperatureService.getSoilTemperatureData({
      latitude,
      longitude,
      startDate,
      endDate
    })
    
    console.log('Respuesta de GEE:', result)
    
    return result

  } catch (error) {
    console.error('Error al consultar Google Earth Engine:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}

// Tipos para los datos de temperatura - comentado porque no se usa actualmente
// interface TemperatureRecord {
//   date: string
//   temperature: number
//   metadata?: Record<string, unknown>
// }

// Función para guardar datos de temperatura en la base de datos - comentada porque no se usa actualmente
/*
interface GEETemperatureRecord {
  date: string
  temperature_level_1?: number
  temperature_level_2?: number  
  temperature_level_3?: number
  temperature_level_4?: number
}

async function saveTemperatureData(locationId: string, temperatureData: GEETemperatureRecord[]) {
  const dataToSave = temperatureData.map(item => ({
    locationId: locationId,
    measurementDate: new Date(item.date),
    tempLevel1: item.temperature_level_1 || null,
    tempLevel2: item.temperature_level_2 || null,
    tempLevel3: item.temperature_level_3 || null,
    tempLevel4: item.temperature_level_4 || null,
    dataSource: 'ERA5-Land'
  }))

  // Usar upsert para evitar duplicados
  const savedRecords = []
  for (const data of dataToSave) {
    const saved = await prisma.soilTemperature.upsert({
      where: {
        locationId_measurementDate_dataSource: {
          locationId: data.locationId,
          measurementDate: data.measurementDate,
          dataSource: data.dataSource
        }
      },
      update: {
        tempLevel1: data.tempLevel1,
        tempLevel2: data.tempLevel2,
        tempLevel3: data.tempLevel3,
        tempLevel4: data.tempLevel4
      },
      create: data
    })
    savedRecords.push(saved)
  }

  return savedRecords
}
*/

// Función auxiliar para generar rango de fechas
function getDaysInRange(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = []
  
  const current = new Date(start)
  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  
  return days
}



// Función para calcular estadísticas
function calculateStats(data: { temperatureCelsius: number | string }[]) {
  if (data.length === 0) {
    return null
  }

  const temperatures = data.map(d => parseFloat(d.temperatureCelsius.toString())).filter(t => !isNaN(t))
  
  if (temperatures.length === 0) {
    return null
  }
  
  return {
    count: temperatures.length,
    min: Math.min(...temperatures),
    max: Math.max(...temperatures),
    average: temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length,
    range: Math.max(...temperatures) - Math.min(...temperatures)
  }
}