import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // URL de prueba - una imagen pequeña de Earth Engine
    const testImageUrl = 'https://earthengine.googleapis.com/v1/projects/earthengine-legacy/thumbnails/test'
    
    console.log('🧪 [PROXY TEST] Probando proxy con URL de prueba...')
    
    // Intentar hacer proxy de la imagen
    const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(testImageUrl)}`
    
    console.log('🔗 [PROXY TEST] URL del proxy:', proxyUrl)
    
    return NextResponse.json({ 
      success: true, 
      message: 'URL de proxy creada',
      originalUrl: testImageUrl,
      proxyUrl: proxyUrl
    })
    
  } catch (error) {
    console.error('❌ [PROXY TEST] Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}