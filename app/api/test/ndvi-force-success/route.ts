import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 [NDVI FORCE] Forzando respuesta exitosa')
  
  // SIEMPRE retornar éxito con imagen de test
  const testImageUrl = '/api/test/simple-image'
  
  return NextResponse.json({ 
    success: true, 
    url: testImageUrl,
    message: 'Forced success for testing'
  })
}