import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Borrar todos los registros de temperatura con valores null
    const deletedCount = await prisma.soilTemperature.deleteMany({
      where: {
        AND: [
          { tempLevel1: null },
          { tempLevel2: null },
          { tempLevel3: null },
          { tempLevel4: null }
        ]
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Registros con valores null eliminados',
      deletedCount: deletedCount.count
    })
  } catch (error) {
    console.error('Error cleaning temperature records:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al limpiar registros de temperatura'
    }, { status: 500 })
  }
}