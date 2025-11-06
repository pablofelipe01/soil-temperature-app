import { NextResponse } from 'next/server'
import { earthEngineClient } from '@/lib/earth-engine/client'

export async function GET(req: Request) {
  const startTime = Date.now()
  
  try {
    const url = new URL(req.url)
    const latParam = url.searchParams.get('lat')
    const lonParam = url.searchParams.get('lon')
    const startDate = url.searchParams.get('startDate') || '2024-02-01'
    const endDate = url.searchParams.get('endDate') || '2024-02-29'
    const sizeParam = url.searchParams.get('size') || '256'
    
    console.log(`🚀 [SIMPLE NDVI] Nueva solicitud - Lat: ${latParam}, Lon: ${lonParam}, Período: ${startDate} a ${endDate}`)

    if (!latParam || !lonParam) {
      return NextResponse.json({ success: false, error: 'Parámetros lat/lon requeridos' }, { status: 400 })
    }

    const latitude = parseFloat(latParam)
    const longitude = parseFloat(lonParam)
    const size = parseInt(sizeParam, 10)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json({ success: false, error: 'Latitud o longitud inválida' }, { status: 400 })
    }

    console.log('🔧 [SIMPLE NDVI] Inicializando cliente Earth Engine...')

    // Inicializar cliente ee
    const ee = await earthEngineClient.getEE()
    console.log('✅ [SIMPLE NDVI] Cliente Earth Engine inicializado')

    // Crear punto y región
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point = (ee as any).Geometry.Point([longitude, latitude])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const region = (point as any).buffer(1500).bounds()
    
    console.log('🗺️ [SIMPLE NDVI] Geometrías creadas')

    // Usar Sentinel-2 con filtros simples
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collection = (ee as any)
      .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(point)
      .filterDate(startDate, endDate)
      .sort('CLOUDY_PIXEL_PERCENTAGE')
      .first() // Solo la primera imagen (menos nubosa)

    console.log('📊 [SIMPLE NDVI] Colección Sentinel-2 creada')

    // Calcular NDVI directamente
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ndvi = (collection as any).normalizedDifference(['B8', 'B4']).rename('NDVI')
    
    console.log('📈 [SIMPLE NDVI] NDVI calculado')

    // Parámetros simples de visualización
    const visParams = {
      min: -0.3,
      max: 0.9,
      palette: [
        '#8B4513', // Marrón: Suelo/estrés
        '#FF4500', // Rojo: Estrés severo  
        '#FFD700', // Amarillo: Estrés moderado
        '#32CD32', // Verde: Saludable
        '#006400'  // Verde oscuro: Muy saludable
      ]
    }

    // Configuración del thumbnail
    const thumbOptions = {
      region: region,
      dimensions: size,
      format: 'png',
      ...visParams
    }

    console.log('🔄 [SIMPLE NDVI] Generando thumbnail...')
    
    // Generar thumbnail con timeout simple
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbnailUrl: string = await (ndvi as any).getThumbURL(thumbOptions)
    
    const totalTime = Date.now() - startTime
    console.log(`✅ [SIMPLE NDVI] Thumbnail generado exitosamente en ${totalTime}ms`)
    console.log(`🔗 [SIMPLE NDVI] URL original: ${thumbnailUrl.substring(0, 100)}...`)

    // Crear URL proxied
    const proxiedUrl = `/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`

    return NextResponse.json({ 
      success: true, 
      url: proxiedUrl,
      originalUrl: thumbnailUrl,
      processingTime: totalTime
    })
    
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ [SIMPLE NDVI] Error después de ${totalTime}ms:`, error)
    
    // Fallback directo
    const fallbackParams = new URLSearchParams(req.url.split('?')[1] || '')
    const fallbackDate = fallbackParams.get('startDate') || '2024-02-01'
    const fallbackSize = fallbackParams.get('size') || '256'
    const fallbackUrl = `/api/fallback/ndvi?date=${fallbackDate}&width=${fallbackSize}&height=${fallbackSize}`
    
    return NextResponse.json({ 
      success: true, 
      url: fallbackUrl,
      fallback: true,
      error: error instanceof Error ? error.message : 'Error desconocido',
      processingTime: totalTime
    })
  }
}