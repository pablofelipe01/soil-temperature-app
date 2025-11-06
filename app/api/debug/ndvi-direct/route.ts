import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 [NDVI DEBUG] Iniciando debug directo de NDVI...')
    
    // Hacer una llamada directa a nuestra API de NDVI
    const testParams = new URLSearchParams({
      lat: '4.316272',
      lon: '-74.669316',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      size: '256',
      radiusMeters: '1500'
    })
    
    const apiUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/earth-engine/ndvi?${testParams.toString()}`
    console.log('🔗 [NDVI DEBUG] Llamando API:', apiUrl)
    
    const response = await fetch(apiUrl)
    const data = await response.json()
    
    console.log('📊 [NDVI DEBUG] Respuesta API:', {
      status: response.status,
      success: data.success,
      hasUrl: !!data.url,
      error: data.error
    })
    
    if (data.success && data.url) {
      console.log('🔗 [NDVI DEBUG] URL generada:', data.url)
      
      // Intentar acceder directamente a la URL
      if (data.url.startsWith('/api/proxy/image')) {
        // Es una URL proxied, extraer la URL original
        const urlParams = new URLSearchParams(data.url.split('?')[1])
        const originalUrl = urlParams.get('url')
        
        console.log('🔍 [NDVI DEBUG] URL original extraída:', originalUrl)
        
        if (originalUrl) {
          // Test de la URL original
          try {
            const originalResponse = await fetch(originalUrl, {
              method: 'HEAD', // Solo headers para verificar
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; soil-temperature-app)'
              }
            })
            console.log('✅ [NDVI DEBUG] URL original accesible:', originalResponse.status, originalResponse.statusText)
          } catch (error) {
            console.error('❌ [NDVI DEBUG] URL original no accesible:', error)
          }
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Debug completado',
        apiResponse: data,
        testParams: Object.fromEntries(testParams.entries())
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Error en API de NDVI',
        apiResponse: data
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ [NDVI DEBUG] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}