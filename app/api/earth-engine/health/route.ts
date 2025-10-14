// API Route: Health check para Google Earth Engine
import { NextResponse } from 'next/server'
import { earthEngineClient } from '@/lib/earth-engine/client'

export async function GET() {
  try {
    console.log('🔍 Verificando estado de Google Earth Engine...')
    
    const healthCheck = await earthEngineClient.healthCheck()
    
    if (healthCheck.status === 'ok') {
      console.log('✅ Google Earth Engine funcionando correctamente')
      return NextResponse.json({
        success: true,
        status: 'healthy',
        message: healthCheck.message,
        timestamp: new Date().toISOString()
      })
    } else {
      console.error('❌ Google Earth Engine con problemas:', healthCheck.message)
      return NextResponse.json({
        success: false,
        status: 'unhealthy',
        message: healthCheck.message,
        timestamp: new Date().toISOString()
      }, { status: 503 })
    }
  } catch (error) {
    console.error('💥 Error en health check de Google Earth Engine:', error)
    
    return NextResponse.json({
      success: false,
      status: 'error',
      message: error instanceof Error ? error.message : 'Error desconocido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}