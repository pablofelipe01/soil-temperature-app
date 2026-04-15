import { NextResponse } from 'next/server'
import { earthEngineClient } from '@/lib/earth-engine/client'

export async function GET() {
  try {
    console.log('🧪 [EE TEST] Iniciando prueba de Earth Engine...')
    
    // Inicializar cliente
    const ee = await earthEngineClient.getEE()
    console.log('✅ [EE TEST] Cliente Earth Engine inicializado')
    
    // Crear una imagen simple de prueba
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const testImage = (ee as any).Image('COPERNICUS/S2_SR_HARMONIZED/20241001T152639_20241001T152635_T18NVK')
    
    console.log('🖼️ [EE TEST] Imagen de prueba creada')
    
    // Intentar generar un thumbnail simple
    const testParams = {
      region: [[-74.7, 4.2], [-74.6, 4.2], [-74.6, 4.4], [-74.7, 4.4]],
      dimensions: 256,
      format: 'png',
      bands: ['B4', 'B3', 'B2'],
      min: 0,
      max: 3000
    }
    
    console.log('🔄 [EE TEST] Generando thumbnail de prueba...')
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const thumbnailUrl = await (testImage as any).getThumbURL(testParams)
    
    console.log('✅ [EE TEST] Thumbnail generado exitosamente')
    console.log('🔗 [EE TEST] URL:', thumbnailUrl.substring(0, 100) + '...')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Earth Engine funcionando correctamente',
      thumbnailUrl: thumbnailUrl,
      testParams
    })
    
  } catch (error) {
    console.error('❌ [EE TEST] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      details: error
    }, { status: 500 })
  }
}