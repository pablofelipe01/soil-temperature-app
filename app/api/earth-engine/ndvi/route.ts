import { NextResponse } from 'next/server'
import { earthEngineClient } from '@/lib/earth-engine/client'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const latParam = url.searchParams.get('lat')
    const lonParam = url.searchParams.get('lon')
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''
    const sizeParam = url.searchParams.get('size') || '512'
    const zoomRadiusMetersParam = url.searchParams.get('radiusMeters') || '2000'

    if (!latParam || !lonParam) {
      return NextResponse.json({ success: false, error: 'Parámetros lat/lon requeridos' }, { status: 400 })
    }

    const latitude = parseFloat(latParam)
    const longitude = parseFloat(lonParam)
    const size = parseInt(sizeParam, 10)
    const radiusMeters = parseInt(zoomRadiusMetersParam, 10)

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json({ success: false, error: 'Latitud o longitud inválida' }, { status: 400 })
    }

    // Inicializar cliente ee
    const ee = await earthEngineClient.getEE()

  // Crear punto y región (usar any para evitar incompatibilidades de tipos con la librería ee)
  const point: any = ee.Geometry.Point([longitude, latitude])
  const region: any = (point as any).buffer(radiusMeters).bounds()

    // Fechas (usar rango por defecto si no se proporcionan)
    const defaultStart = startDate || '2024-01-01'
    const defaultEnd = endDate || new Date().toISOString().split('T')[0]

    // Construir colección Sentinel-2 Surface Reflectance con filtros de calidad
    const collection: any = (ee as any)
      .ImageCollection('COPERNICUS/S2_SR')
      .filterBounds(point)
      .filterDate(defaultStart, defaultEnd)
      .filter((ee as any).Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Menos del 20% de nubes
      .filter((ee as any).Filter.lt('CLOUD_COVERAGE_ASSESSMENT', 20))

    // Función para enmascarar nubes usando la banda SCL (Scene Classification Layer)
    const maskS2clouds = (image: any) => {
      const scl = image.select('SCL')
      // Valores SCL: 3=nubes sombras, 8=nubes medias, 9=nubes altas, 10=nubes cirrus, 11=nieve/hielo
      const cloudMask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10)).and(scl.neq(11))
      return image.updateMask(cloudMask)
    }

    // Aplicar máscara de nubes y componer imagen
    const filtered = collection.map(maskS2clouds)
    
    // Verificar si hay imágenes disponibles
    const imageCount: any = await filtered.size().getInfo()
    
    if (imageCount === 0) {
      // Si no hay imágenes buenas, usar colección sin filtro de nubes pero con menos días
      const fallbackCollection: any = (ee as any)
        .ImageCollection('COPERNICUS/S2_SR')
        .filterBounds(point)
        .filterDate(defaultStart, defaultEnd)
        .sort('CLOUDY_PIXEL_PERCENTAGE')
        .limit(3) // Solo las 3 mejores imágenes disponibles
        
      const fallbackComposite: any = fallbackCollection.median()
      var ndvi: any = fallbackComposite.normalizedDifference(['B8', 'B4']).rename('NDVI')
    } else {
      // Usar percentile 50 en lugar de median para mejor calidad
      const composite: any = filtered.reduce((ee as any).Reducer.percentile([50]))
      
      // Renombrar bandas para que coincidan con los nombres esperados
      const renamedComposite = composite.select(
        ['B4_p50', 'B8_p50'],
        ['B4', 'B8']
      )

      // Calcular NDVI con mejor rango
      var ndvi: any = renamedComposite.normalizedDifference(['B8', 'B4']).rename('NDVI')
    }

    // Parámetros de visualización mejorados para agricultura
    const visParams = {
      min: -0.2,  // Valores más negativos para agua/suelo desnudo
      max: 0.8,   // Valores más altos para vegetación densa
      palette: [
        '#8B4513', // Marrón para suelo desnudo/seco
        '#D2691E', // Marrón claro
        '#DAA520', // Dorado para vegetación escasa
        '#ADFF2F', // Verde amarillento para vegetación moderada
        '#32CD32', // Verde lima para vegetación buena
        '#228B22', // Verde bosque para vegetación densa
        '#006400'  // Verde oscuro para vegetación muy densa
      ]
    }

    // Obtener URL de la miniatura (thumbnail)
    const thumbOptions = {
      region: region,
      dimensions: size,
      format: 'png',
      min: visParams.min,
      max: visParams.max,
      palette: visParams.palette
    }

    const thumbnailUrl: string = await ndvi.getThumbURL(thumbOptions)

    return NextResponse.json({ success: true, url: thumbnailUrl })
  } catch (error) {
    console.error('Error generating NDVI thumbnail:', error)
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 })
  }
}
