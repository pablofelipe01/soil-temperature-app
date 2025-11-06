import { NextResponse } from 'next/server'
import { earthEngineClient } from '@/lib/earth-engine/client'

export async function GET() {
  try {
    console.log('🧪 [NDVI TEST] Iniciando prueba NDVI simple...')
    
    // Parámetros fijos para Aroco
    const latitude = 4.316272
    const longitude = -74.669316
    const startDate = '2024-01-01'
    const endDate = '2024-01-31'
    
    console.log(`📍 [NDVI TEST] Ubicación: ${latitude}, ${longitude}`)
    console.log(`📅 [NDVI TEST] Período: ${startDate} a ${endDate}`)
    
    const ee = await earthEngineClient.getEE()
    
    // Crear punto y región
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point = (ee as any).Geometry.Point([longitude, latitude])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const region = (point as any).buffer(1500).bounds()
    
    console.log('🗺️ [NDVI TEST] Geometrías creadas')
    
    // Usar Sentinel-2 (año 2024)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s2Collection = (ee as any)
      .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
      .filterBounds(point)
      .filterDate(startDate, endDate)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((ee as any).Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
      .sort('CLOUDY_PIXEL_PERCENTAGE')
      .limit(3)
    
    console.log('📊 [NDVI TEST] Colección Sentinel-2 creada')
    
    // Verificar que hay imágenes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const imageCount = await (s2Collection.size() as any).getInfo()
    console.log(`🔢 [NDVI TEST] Imágenes encontradas: ${imageCount}`)
    
    if (imageCount === 0) {
      throw new Error('No se encontraron imágenes Sentinel-2 para el período especificado')
    }
    
    // Crear composite
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s2Composite = (s2Collection as any).median()
    
    // Verificar bandas disponibles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const availableBands = await (s2Composite.bandNames() as any).getInfo()
    console.log('🎵 [NDVI TEST] Bandas disponibles:', availableBands)
    
    // Calcular NDVI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ndvi = (s2Composite as any).normalizedDifference(['B8', 'B4']).rename('NDVI')
    
    console.log('📈 [NDVI TEST] NDVI calculado')
    
    // Verificar banda NDVI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ndviBands = await (ndvi.bandNames() as any).getInfo()
    console.log('📊 [NDVI TEST] Bandas NDVI:', ndviBands)
    
    // Generar thumbnail
    const thumbOptions = {
      region: region,
      dimensions: 256,
      format: 'png',
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
    
    console.log('🖼️ [NDVI TEST] Generando thumbnail...')
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbnailUrl = await (ndvi as any).getThumbURL(thumbOptions)
    
    console.log('✅ [NDVI TEST] Thumbnail NDVI generado exitosamente')
    console.log('🔗 [NDVI TEST] URL:', thumbnailUrl.substring(0, 100) + '...')
    
    return NextResponse.json({ 
      success: true, 
      message: 'NDVI generado exitosamente',
      imageCount,
      availableBands,
      ndviBands,
      thumbnailUrl,
      parameters: {
        latitude,
        longitude,
        startDate,
        endDate,
        thumbOptions
      }
    })
    
  } catch (error) {
    console.error('❌ [NDVI TEST] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}