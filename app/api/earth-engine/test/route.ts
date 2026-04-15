import { NextResponse } from 'next/server'
import { isGEEConfigured, getGEEConfig } from '@/config/env'

export async function GET() {
  try {
    console.log('🔍 Verificando configuración de Google Earth Engine...')
    
    const isConfigured = isGEEConfigured()
    console.log('GEE configurado:', isConfigured)
    
    if (!isConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Google Earth Engine no está configurado',
        details: 'Faltan variables de entorno: GEE_PROJECT_ID, GEE_SERVICE_ACCOUNT_EMAIL, GEE_PRIVATE_KEY'
      }, { status: 500 })
    }

    // Obtener configuración
    const config = getGEEConfig()
    
    console.log('Config obtenida:', { 
      projectId: config.projectId,
      email: config.serviceAccountEmail,
      hasPrivateKey: !!config.privateKey 
    })
    
    // Simplemente retornar que está configurado
    return NextResponse.json({
      success: true,
      message: 'Google Earth Engine está configurado correctamente',
      config: {
        projectId: config.projectId,
        serviceAccountEmail: config.serviceAccountEmail,
        hasPrivateKey: !!config.privateKey
      }
    })
    
  } catch (error) {
    console.error('Error verificando GEE:', error)
    return NextResponse.json({
      success: false,
      error: 'Error verificando configuración de GEE',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}