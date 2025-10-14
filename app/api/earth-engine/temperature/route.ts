// API Route: Obtener datos de temperatura del suelo desde Google Earth Engine
import { NextRequest, NextResponse } from 'next/server'
import { soilTemperatureService } from '@/lib/earth-engine/services'
import { z } from 'zod'

// Schema de validación para los parámetros de consulta
const temperatureQuerySchema = z.object({
  latitude: z.string().transform(Number).refine(n => !isNaN(n) && n >= -90 && n <= 90, 'Latitud inválida'),
  longitude: z.string().transform(Number).refine(n => !isNaN(n) && n >= -180 && n <= 180, 'Longitud inválida'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  aggregated: z.string().nullish().transform(val => val === 'true')
})

export async function GET(request: NextRequest) {
  try {
    console.log('🌡️ Solicitud de datos de temperatura del suelo recibida')
    
    // Extraer parámetros de la URL
    const { searchParams } = new URL(request.url)
    
    // Validar parámetros
    const validation = temperatureQuerySchema.safeParse({
      latitude: searchParams.get('latitude'),
      longitude: searchParams.get('longitude'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      aggregated: searchParams.get('aggregated')
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

    const { latitude, longitude, startDate, endDate, aggregated } = validation.data

    console.log(`📍 Consultando temperatura para: ${latitude}, ${longitude} (${startDate} - ${endDate})`)

    // Obtener datos del servicio
    let response
    if (aggregated) {
      response = await soilTemperatureService.getAggregatedTemperatureData({
        latitude,
        longitude,
        startDate,
        endDate
      })
    } else {
      response = await soilTemperatureService.getSoilTemperatureData({
        latitude,
        longitude,
        startDate,
        endDate
      })
    }

    if (!response.success) {
      console.error('❌ Error del servicio GEE:', response.error)
      return NextResponse.json(response, { status: 500 })
    }

    console.log(`✅ Datos obtenidos: ${response.data?.length || 0} registros`)

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Error en API de temperatura del suelo:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Manejar método POST para consultas más complejas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar body con el mismo schema
    const validation = temperatureQuerySchema.safeParse(body)
    
    if (!validation.success) {
      const errors = validation.error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      return NextResponse.json({
        success: false,
        error: 'Datos inválidos',
        details: errors
      }, { status: 400 })
    }

    const { latitude, longitude, startDate, endDate, aggregated } = validation.data

    console.log(`📍 POST - Consultando temperatura para: ${latitude}, ${longitude}`)

    // Usar el mismo servicio
    let response
    if (aggregated) {
      response = await soilTemperatureService.getAggregatedTemperatureData({
        latitude,
        longitude,
        startDate,
        endDate
      })
    } else {
      response = await soilTemperatureService.getSoilTemperatureData({
        latitude,
        longitude,
        startDate,
        endDate
      })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('💥 Error en POST de temperatura del suelo:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}