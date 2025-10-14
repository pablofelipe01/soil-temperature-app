import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Obtener algunos registros de temperatura para diagnosticar
    const temperatureRecords = await prisma.soilTemperature.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        location: {
          select: {
            name: true,
            latitude: true,
            longitude: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: temperatureRecords,
      summary: {
        totalRecords: temperatureRecords.length,
        hasNonZeroTemperatures: temperatureRecords.some(r => 
          (r.tempLevel1 && parseFloat(r.tempLevel1.toString()) !== 0) ||
          (r.tempLevel2 && parseFloat(r.tempLevel2.toString()) !== 0) ||
          (r.tempLevel3 && parseFloat(r.tempLevel3.toString()) !== 0) ||
          (r.tempLevel4 && parseFloat(r.tempLevel4.toString()) !== 0)
        )
      }
    })
  } catch (error) {
    console.error('Error fetching temperature records:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener registros de temperatura'
    }, { status: 500 })
  }
}