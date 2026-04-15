import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const imageUrl = url.searchParams.get('url')
    
    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 })
    }

    console.log('🖼️ [IMAGE PROXY] Proxying image:', imageUrl)

    // Hacer fetch de la imagen desde Earth Engine con headers mejorados
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; soil-temperature-app)',
        'Accept': 'image/png,image/*,*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      method: 'GET'
    })

    console.log('📡 [IMAGE PROXY] Response status:', response.status, response.statusText)
    console.log('📄 [IMAGE PROXY] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      console.error('❌ [IMAGE PROXY] Error fetching image:', response.status, response.statusText)
      return NextResponse.json({ error: `Failed to fetch image: ${response.status}` }, { status: response.status })
    }

    // Obtener el buffer de la imagen
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/png'
    
    console.log('✅ [IMAGE PROXY] Image fetched successfully, size:', imageBuffer.byteLength, 'bytes')

    // Retornar la imagen con los headers correctos
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Access-Control-Allow-Origin': '*',
      },
    })

  } catch (error) {
    console.error('❌ [IMAGE PROXY] Error:', error)
    return NextResponse.json({ 
      error: 'Failed to proxy image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}