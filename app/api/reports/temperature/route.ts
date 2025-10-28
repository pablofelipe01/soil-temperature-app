import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import * as XLSX from 'xlsx'

// Schema de validación para reportes
const reportQuerySchema = z.object({
  locationId: z.string().uuid('ID de ubicación debe ser un UUID válido'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  format: z.enum(['excel', 'pdf'], 'Formato debe ser excel o pdf')
})

interface TemperatureStats {
  count: number
  min: number
  max: number
  average: number
  range: number
}

interface TemperatureData {
  id: string
  date: string
  temperatureCelsius: number
  dataSource: string
  isPostBiochar?: boolean
}

// GET /api/reports/temperature - Generar reporte de temperatura
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Solicitud de reporte de temperatura recibida')
    
    // Extraer parámetros de la URL
    const { searchParams } = new URL(request.url)
    
    // Validar parámetros
    const validation = reportQuerySchema.safeParse({
      locationId: searchParams.get('locationId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      format: searchParams.get('format')
    })

    if (!validation.success) {
      const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      console.error('❌ Parámetros inválidos:', errors)
      
      return NextResponse.json({
        success: false,
        error: 'Parámetros inválidos',
        details: errors
      }, { status: 400 })
    }

    const { locationId, startDate, endDate, format } = validation.data

    // Obtener información de la ubicación
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        siteName: true,
        latitude: true,
        longitude: true,
        areaHectares: true,
        applicationDate: true,
        clientName: true,
        clientEmail: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    // Obtener datos de temperatura
    const temperatureRecords = await prisma.soilTemperature.findMany({
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

    // Transformar datos
    const temperatureData: TemperatureData[] = temperatureRecords.map(record => {
      // Usar temp_level_1 como temperatura principal - convertir Decimal a number
      const temperature = record.tempLevel1 ? Number(record.tempLevel1) : 0
      
      // Determinar si es post-biochar
      const isPostBiochar = location.applicationDate ? 
        new Date(record.measurementDate) >= new Date(location.applicationDate) : 
        false

      return {
        id: record.id,
        date: record.measurementDate.toISOString().split('T')[0],
        temperatureCelsius: temperature,
        dataSource: record.dataSource || 'ERA5-Land',
        isPostBiochar
      }
    })

    // Calcular estadísticas
    const temperatures = temperatureData.map(d => d.temperatureCelsius)
    const stats: TemperatureStats = {
      count: temperatures.length,
      min: Math.min(...temperatures),
      max: Math.max(...temperatures),
      average: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      range: Math.max(...temperatures) - Math.min(...temperatures)
    }

    if (format === 'excel') {
      return await generateExcelReport({
        ...location,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        areaHectares: location.areaHectares ? Number(location.areaHectares) : null
      }, temperatureData, stats, startDate, endDate)
    } else {
      // Para PDF, devolver los datos para que el frontend lo genere
      return NextResponse.json({
        success: true,
        data: temperatureData,
        stats,
        location,
        period: { startDate, endDate }
      })
    }

  } catch (error) {
    console.error('💥 Error generando reporte:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 })
  }
}

async function generateExcelReport(
  location: {
    id: string
    siteName: string | null
    latitude: number
    longitude: number
    areaHectares: number | null
    applicationDate: Date | null
    clientName: string
    clientEmail: string | null
    user?: {
      email: string
    } | null
  },
  temperatureData: TemperatureData[],
  stats: TemperatureStats,
  startDate: string,
  endDate: string
) {
  try {
    // Crear libro de trabajo
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Información general
    const infoData = [
      ['REPORTE DE TEMPERATURA DEL SUELO'],
      [''],
      ['Información de la Ubicación'],
      ['Sitio:', location.siteName || 'N/A'],
      ['Cliente:', location.clientName || 'N/A'],
      ['Email:', location.clientEmail || location.user?.email || 'N/A'],
      ['Latitud:', location.latitude],
      ['Longitud:', location.longitude],
      ['Área (hectáreas):', location.areaHectares || 'N/A'],
      ['Fecha de aplicación biochar:', location.applicationDate || 'N/A'],
      [''],
      ['Período del Reporte'],
      ['Fecha de inicio:', startDate],
      ['Fecha de fin:', endDate],
      [''],
      ['Estadísticas Generales'],
      ['Total de registros:', stats.count],
      ['Temperatura mínima:', `${stats.min.toFixed(2)}°C`],
      ['Temperatura máxima:', `${stats.max.toFixed(2)}°C`],
      ['Temperatura promedio:', `${stats.average.toFixed(2)}°C`],
      ['Rango de temperatura:', `${stats.range.toFixed(2)}°C`],
      [''],
      ['Fecha de generación:', new Date().toLocaleDateString('es-CO')]
    ]

    const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
    XLSX.utils.book_append_sheet(workbook, infoSheet, 'Información')

    // Hoja 2: Datos de temperatura
    const dataHeaders = ['Fecha', 'Temperatura (°C)', 'Fuente de Datos', 'Post-Biochar']
    const dataRows = temperatureData.map(record => [
      record.date,
      record.temperatureCelsius,
      record.dataSource,
      record.isPostBiochar ? 'Sí' : 'No'
    ])

    const dataSheet = XLSX.utils.aoa_to_sheet([dataHeaders, ...dataRows])
    XLSX.utils.book_append_sheet(workbook, dataSheet, 'Datos de Temperatura')

    // Hoja 3: Análisis por períodos (si hay aplicación de biochar)
    if (location.applicationDate) {
      const preBiochar = temperatureData.filter(d => !d.isPostBiochar)
      const postBiochar = temperatureData.filter(d => d.isPostBiochar)

      const analysisData = [
        ['ANÁLISIS COMPARATIVO PRE/POST BIOCHAR'],
        [''],
        ['Fecha de aplicación de biochar:', location.applicationDate],
        [''],
        ['Estadísticas Pre-Biochar'],
        ['Registros:', preBiochar.length],
        ['Temperatura promedio:', preBiochar.length > 0 ? `${(preBiochar.reduce((a, b) => a + b.temperatureCelsius, 0) / preBiochar.length).toFixed(2)}°C` : 'N/A'],
        ['Temperatura mínima:', preBiochar.length > 0 ? `${Math.min(...preBiochar.map(d => d.temperatureCelsius)).toFixed(2)}°C` : 'N/A'],
        ['Temperatura máxima:', preBiochar.length > 0 ? `${Math.max(...preBiochar.map(d => d.temperatureCelsius)).toFixed(2)}°C` : 'N/A'],
        [''],
        ['Estadísticas Post-Biochar'],
        ['Registros:', postBiochar.length],
        ['Temperatura promedio:', postBiochar.length > 0 ? `${(postBiochar.reduce((a, b) => a + b.temperatureCelsius, 0) / postBiochar.length).toFixed(2)}°C` : 'N/A'],
        ['Temperatura mínima:', postBiochar.length > 0 ? `${Math.min(...postBiochar.map(d => d.temperatureCelsius)).toFixed(2)}°C` : 'N/A'],
        ['Temperatura máxima:', postBiochar.length > 0 ? `${Math.max(...postBiochar.map(d => d.temperatureCelsius)).toFixed(2)}°C` : 'N/A'],
        [''],
        ['Diferencia en Promedio'],
        ['Cambio:', preBiochar.length > 0 && postBiochar.length > 0 ? 
          `${((postBiochar.reduce((a, b) => a + b.temperatureCelsius, 0) / postBiochar.length) - 
            (preBiochar.reduce((a, b) => a + b.temperatureCelsius, 0) / preBiochar.length)).toFixed(2)}°C` : 'N/A']
      ]

      const analysisSheet = XLSX.utils.aoa_to_sheet(analysisData)
      XLSX.utils.book_append_sheet(workbook, analysisSheet, 'Análisis')
    }

    // Generar archivo Excel
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Generar nombre de archivo
    const siteName = location.siteName || 'ubicacion'
    const fileName = `reporte_temperatura_${siteName.replace(/[^a-zA-Z0-9]/g, '_')}_${startDate}_${endDate}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString()
      }
    })

  } catch (error) {
    console.error('❌ Error generando Excel:', error)
    throw error
  }
}