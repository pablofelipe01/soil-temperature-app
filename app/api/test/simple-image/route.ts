import { NextResponse } from 'next/server'

export async function GET() {
  // Generar una imagen de prueba simple que SIEMPRE funcione
  const simpleImage = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#32CD32"/>
      <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="white">
        NDVI OK
      </text>
      <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="12" fill="white">
        Test Image
      </text>
    </svg>
  `
  
  const svgBuffer = Buffer.from(simpleImage, 'utf-8')
  
  return new NextResponse(svgBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60'
    },
  })
}