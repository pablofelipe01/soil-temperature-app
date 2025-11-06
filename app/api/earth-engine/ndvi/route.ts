import { NextResponse } from 'next/server'
import { earthEngineClient } from '@/lib/earth-engine/client'

export async function GET(req: Request) {
  const startTime = Date.now()
  try {
    const url = new URL(req.url)
    const latParam = url.searchParams.get('lat')
    const lonParam = url.searchParams.get('lon')
    const startDate = url.searchParams.get('startDate') || ''
    const endDate = url.searchParams.get('endDate') || ''
    const sizeParam = url.searchParams.get('size') || '256'
    const zoomRadiusMetersParam = url.searchParams.get('radiusMeters') || '2000'
    
    console.log(`🚀 [NDVI API] Nueva solicitud - Lat: ${latParam}, Lon: ${lonParam}, Período: ${startDate} a ${endDate}`)

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

    // Crear punto y región
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const point = (ee as any).Geometry.Point([longitude, latitude])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const region = (point as any).buffer(radiusMeters).bounds()
    
    // Fechas (usar rango por defecto si no se proporcionan)
    const defaultStart = startDate || '2024-01-01'
    const defaultEnd = endDate || new Date().toISOString().split('T')[0]

    // Determinar qué satélite usar basado en la fecha
    const startYear = new Date(defaultStart).getFullYear()
    let ndvi

    if (startYear >= 2015) {
      // Usar Sentinel-2 para 2015 en adelante con múltiples fallbacks
      console.log('🛰️ Usando Sentinel-2 para', defaultStart, '-', defaultEnd)
      
      // Estrategia de múltiples intentos con filtros progresivamente menos restrictivos
      let s2Collection
      
      // Intento 1: Filtros estrictos
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s2Collection = (ee as any)
        .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(point)
        .filterDate(defaultStart, defaultEnd)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((ee as any).Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
        .sort('CLOUDY_PIXEL_PERCENTAGE')
        .limit(10)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let imageCount = await (s2Collection.size() as any).getInfo()
      console.log(`📊 Sentinel-2 (filtro 20%): ${imageCount} imágenes encontradas`)
      
      // Intento 2: Si no hay imágenes, relajar filtros de nubes
      if (imageCount === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s2Collection = (ee as any)
          .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(point)
          .filterDate(defaultStart, defaultEnd)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((ee as any).Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 50))
          .sort('CLOUDY_PIXEL_PERCENTAGE')
          .limit(10)
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageCount = await (s2Collection.size() as any).getInfo()
        console.log(`📊 Sentinel-2 (filtro 50%): ${imageCount} imágenes encontradas`)
      }
      
      // Intento 3: Sin filtros de nubes si aún no hay imágenes
      if (imageCount === 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s2Collection = (ee as any)
          .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(point)
          .filterDate(defaultStart, defaultEnd)
          .sort('CLOUDY_PIXEL_PERCENTAGE')
          .limit(5)
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageCount = await (s2Collection.size() as any).getInfo()
        console.log(`📊 Sentinel-2 (sin filtro nubes): ${imageCount} imágenes encontradas`)
      }
      
      // Intento 4: Usar colección SR normal si Harmonized falla
      if (imageCount === 0) {
        console.log('🔄 Intentando con COPERNICUS/S2_SR...')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        s2Collection = (ee as any)
          .ImageCollection('COPERNICUS/S2_SR')
          .filterBounds(point)
          .filterDate(defaultStart, defaultEnd)
          .sort('CLOUDY_PIXEL_PERCENTAGE')
          .limit(5)
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageCount = await (s2Collection.size() as any).getInfo()
        console.log(`📊 Sentinel-2 SR: ${imageCount} imágenes encontradas`)
      }
      
      if (imageCount > 0) {
        // Función simple de máscara de nubes para Sentinel-2
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const maskClouds = (image: any) => {
          const qa = image.select('QA60')
          const cloudBitMask = 1 << 10
          const cirrusBitMask = 1 << 11
          const mask = qa.bitwiseAnd(cloudBitMask).eq(0).and(qa.bitwiseAnd(cirrusBitMask).eq(0))
          return image.updateMask(mask)
        }

        const s2Masked = s2Collection.map(maskClouds)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const s2Composite = (s2Masked as any).median()
        
        // Validar bandas disponibles en Sentinel-2
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const availableBands = await (s2Composite.bandNames() as any).getInfo()
        console.log('🔍 Bandas disponibles en Sentinel-2:', availableBands)
        
        const nirBand = 'B8'
        const redBand = 'B4'
        
        if (!availableBands.includes(nirBand) || !availableBands.includes(redBand)) {
          throw new Error(`Bandas Sentinel-2 requeridas no encontradas. Necesarias: ${nirBand}, ${redBand}. Disponibles: ${availableBands.join(', ')}`)
        }
        
        // Calcular NDVI con bandas validadas
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ndvi = (s2Composite as any).normalizedDifference([nirBand, redBand]).rename('NDVI')
      } else {
        throw new Error('No hay imágenes Sentinel-2 disponibles para este período y ubicación')
      }
      
    } else {
      // Usar Landsat para fechas anteriores a 2015 con múltiples fallbacks
      console.log('🛰️ Usando Landsat para', defaultStart, '-', defaultEnd)
      
      let collection
      let satelliteName
      if (startYear >= 2013) {
        // Landsat 8 (2013+)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection = (ee as any).ImageCollection('LANDSAT/LC08/C02/T1_L2')
        satelliteName = 'Landsat 8'
      } else if (startYear >= 1999) {
        // Landsat 7 (1999-2013)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection = (ee as any).ImageCollection('LANDSAT/LE07/C02/T1_L2')
        satelliteName = 'Landsat 7'
      } else {
        // Landsat 5 (1984-2012)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        collection = (ee as any).ImageCollection('LANDSAT/LT05/C02/T1_L2')
        satelliteName = 'Landsat 5'
      }

      // Intento 1: Filtros estrictos
      let landsatFiltered = collection
        .filterBounds(point)
        .filterDate(defaultStart, defaultEnd)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((ee as any).Filter.lt('CLOUD_COVER', 20))
        .sort('CLOUD_COVER')
        .limit(10)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let imageCount = await (landsatFiltered.size() as any).getInfo()
      console.log(`📊 ${satelliteName} (filtro 20%): ${imageCount} imágenes encontradas`)

      // Intento 2: Relajar filtros si no hay imágenes
      if (imageCount === 0) {
        landsatFiltered = collection
          .filterBounds(point)
          .filterDate(defaultStart, defaultEnd)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((ee as any).Filter.lt('CLOUD_COVER', 50))
          .sort('CLOUD_COVER')
          .limit(10)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageCount = await (landsatFiltered.size() as any).getInfo()
        console.log(`📊 ${satelliteName} (filtro 50%): ${imageCount} imágenes encontradas`)
      }

      // Intento 3: Sin filtros de nubes
      if (imageCount === 0) {
        landsatFiltered = collection
          .filterBounds(point)
          .filterDate(defaultStart, defaultEnd)
          .sort('CLOUD_COVER')
          .limit(5)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageCount = await (landsatFiltered.size() as any).getInfo()
        console.log(`📊 ${satelliteName} (sin filtro): ${imageCount} imágenes encontradas`)
      }

      if (imageCount === 0) {
        throw new Error(`No hay imágenes ${satelliteName} disponibles para este período y ubicación`)
      }

      // Función de máscara para Landsat
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const maskLandsatClouds = (image: any) => {
        const qa = image.select('QA_PIXEL')
        const cloudMask = qa.bitwiseAnd(1 << 3).eq(0).and(qa.bitwiseAnd(1 << 4).eq(0))
        return image.updateMask(cloudMask)
      }

      const landsatMasked = landsatFiltered.map(maskLandsatClouds)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const landsatComposite = (landsatMasked as any).median()
      
      // Validar que el composite tenga bandas antes de calcular NDVI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const availableBands = await (landsatComposite.bandNames() as any).getInfo()
      console.log(`🔍 Bandas disponibles en ${satelliteName}:`, availableBands)
      
      // Verificar bandas requeridas según el satélite
      let nirBand, redBand
      if (startYear >= 2013) {
        nirBand = 'SR_B5'
        redBand = 'SR_B4'
      } else {
        nirBand = 'SR_B4'
        redBand = 'SR_B3'
      }
      
      if (!availableBands.includes(nirBand) || !availableBands.includes(redBand)) {
        throw new Error(`Bandas requeridas no encontradas. Necesarias: ${nirBand}, ${redBand}. Disponibles: ${availableBands.join(', ')}`)
      }
      
      // Calcular NDVI con bandas validadas
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ndvi = (landsatComposite as any).normalizedDifference([nirBand, redBand]).rename('NDVI')
    }

    // Parámetros de visualización optimizados para detectar estrés vegetativo
    const visParams = {
      min: -0.3,  // Incluir agua y suelos muy secos
      max: 0.9,   // Vegetación muy densa
      palette: [
        '#000080', // Azul oscuro: Agua
        '#8B4513', // Marrón: Suelo desnudo/muy seco (ESTRÉS MÁXIMO)
        '#D2691E', // Marrón claro: Suelo con poca materia orgánica
        '#FF4500', // Rojo naranja: Vegetación muy estresada/muriendo
        '#FF6347', // Rojo tomate: Vegetación estresada
        '#FFD700', // Amarillo dorado: Vegetación con estrés moderado
        '#ADFF2F', // Verde amarillento: Vegetación recuperándose
        '#32CD32', // Verde lima: Vegetación buena
        '#228B22', // Verde bosque: Vegetación muy buena
        '#006400', // Verde oscuro: Vegetación óptima
        '#004225'  // Verde muy oscuro: Vegetación exuberante
      ]
    }

    // Configuración optimizada para velocidad
    const thumbOptions = {
      region: region,
      dimensions: Math.min(size, 256), // Limitar tamaño máximo para velocidad
      format: 'png',
      min: visParams.min,
      max: visParams.max,
      palette: visParams.palette
    }

    // Validar que el NDVI esté correctamente calculado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ndviBands = await (ndvi.bandNames() as any).getInfo()
    console.log('🔍 Bandas NDVI calculadas:', ndviBands)
    
    if (!ndviBands.includes('NDVI')) {
      throw new Error(`NDVI no calculado correctamente. Bandas disponibles: ${ndviBands.join(', ')}`)
    }

    console.log('🔄 Generando thumbnail NDVI...')
    
    // Timeout para evitar requests eternos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbnailPromise = (ndvi as any).getThumbURL(thumbOptions) as Promise<string>
    const timeoutPromise: Promise<string> = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: NDVI generation took too long')), 30000)
    )
    
    const thumbnailUrl: string = await Promise.race([thumbnailPromise, timeoutPromise])
    
    const totalTime = Date.now() - startTime
    console.log(`✅ [NDVI API] Thumbnail generado exitosamente en ${totalTime}ms`)
    console.log(`🔗 URL original: ${thumbnailUrl.substring(0, 100)}...`)

    // Crear URL proxied para evitar problemas de CORS/autenticación
    const proxiedUrl = `/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`
    console.log(`🔀 URL proxied: ${proxiedUrl}`)

    return NextResponse.json({ success: true, url: proxiedUrl })
  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error(`❌ [NDVI API] Error después de ${totalTime}ms:`, error)
    
    // Usar fallback cuando Earth Engine falle
    console.log('🔄 [NDVI API] Usando imagen sintética de fallback...')
    
    const fallbackParams = new URLSearchParams({
      date: req.url.includes('startDate=') ? new URL(req.url).searchParams.get('startDate')! : new Date().toISOString().split('T')[0],
      width: req.url.includes('size=') ? new URL(req.url).searchParams.get('size')! : '256',
      height: req.url.includes('size=') ? new URL(req.url).searchParams.get('size')! : '256'
    })
    
    const fallbackUrl = `/api/fallback/ndvi?${fallbackParams.toString()}`
    
    console.log(`✅ [NDVI API] Fallback creado: ${fallbackUrl}`)
    
    return NextResponse.json({ 
      success: true, 
      url: fallbackUrl,
      fallback: true,
      originalError: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}
