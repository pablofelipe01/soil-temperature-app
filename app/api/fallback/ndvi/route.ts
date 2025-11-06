import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
    const width = parseInt(url.searchParams.get('width') || '256', 10)
    const height = parseInt(url.searchParams.get('height') || '256', 10)
    
    console.log(`🎨 [NDVI FALLBACK] Generando imagen sintética para ${date}`)
    
    // Crear un canvas simple con datos NDVI sintéticos
    const canvas = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ndviGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
            <stop offset="25%" style="stop-color:#FF4500;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#FFD700;stop-opacity:1" />
            <stop offset="75%" style="stop-color:#32CD32;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#006400;stop-opacity:1" />
          </linearGradient>
          <pattern id="noise" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="url(#ndviGradient)" opacity="0.8"/>
            <circle cx="2" cy="2" r="1" fill="white" opacity="0.1"/>
          </pattern>
        </defs>
        
        <!-- Background gradient -->
        <rect width="100%" height="100%" fill="url(#noise)"/>
        
        <!-- Simulated vegetation patches -->
        <circle cx="${width * 0.3}" cy="${height * 0.4}" r="${width * 0.15}" fill="#228B22" opacity="0.7"/>
        <circle cx="${width * 0.7}" cy="${height * 0.6}" r="${width * 0.12}" fill="#32CD32" opacity="0.8"/>
        <ellipse cx="${width * 0.5}" cy="${height * 0.3}" rx="${width * 0.2}" ry="${width * 0.1}" fill="#90EE90" opacity="0.6"/>
        
        <!-- Simulated stress areas -->
        <polygon points="${width * 0.1},${height * 0.8} ${width * 0.3},${height * 0.9} ${width * 0.2},${height}" 
                 fill="#FF6347" opacity="0.7"/>
        
        <!-- Date label -->
        <rect x="5" y="5" width="${width * 0.4}" height="20" fill="white" opacity="0.8" rx="3"/>
        <text x="10" y="18" font-family="Arial" font-size="12" fill="#333">${date.substring(0, 7)}</text>
        
        <!-- NDVI legend -->
        <rect x="${width - 60}" y="${height - 80}" width="55" height="75" fill="white" opacity="0.9" rx="3"/>
        <text x="${width - 55}" y="${height - 65}" font-family="Arial" font-size="8" fill="#333">NDVI</text>
        <rect x="${width - 55}" y="${height - 60}" width="10" height="8" fill="#8B4513"/>
        <text x="${width - 40}" y="${height - 53}" font-family="Arial" font-size="6" fill="#333">Seco</text>
        <rect x="${width - 55}" y="${height - 50}" width="10" height="8" fill="#FFD700"/>
        <text x="${width - 40}" y="${height - 43}" font-family="Arial" font-size="6" fill="#333">Mod</text>
        <rect x="${width - 55}" y="${height - 40}" width="10" height="8" fill="#32CD32"/>
        <text x="${width - 40}" y="${height - 33}" font-family="Arial" font-size="6" fill="#333">Bueno</text>
        <rect x="${width - 55}" y="${height - 30}" width="10" height="8" fill="#006400"/>
        <text x="${width - 40}" y="${height - 23}" font-family="Arial" font-size="6" fill="#333">Exel</text>
        
        <!-- Fallback indicator -->
        <text x="10" y="${height - 10}" font-family="Arial" font-size="10" fill="#666" opacity="0.7">Simulado</text>
      </svg>
    `
    
    // Convertir SVG a buffer
    const svgBuffer = Buffer.from(canvas, 'utf-8')
    
    console.log(`✅ [NDVI FALLBACK] Imagen sintética generada (${svgBuffer.length} bytes)`)
    
    return new NextResponse(svgBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // Cache corto para fallbacks
        'X-Fallback': 'true'
      },
    })

  } catch (error) {
    console.error('❌ [NDVI FALLBACK] Error generando fallback:', error)
    return NextResponse.json({ 
      error: 'Failed to generate fallback image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}