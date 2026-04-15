import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    console.log(`[DEBUG] Checking locations for user: ${userId}`)

    // Obtener ubicaciones del usuario actual
    const userLocations = await prisma.location.findMany({
      where: {
        userId: userId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        userId: true,
        clientName: true
      }
    })

    // Obtener todas las ubicaciones para comparación
    const allLocations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        clientName: true
      }
    })

    return NextResponse.json({
      success: true,
      currentUserId: userId,
      userLocations,
      totalLocations: allLocations.length,
      allLocations: allLocations.map(loc => ({
        id: loc.id,
        name: loc.name,
        userId: loc.userId,
        belongsToCurrentUser: loc.userId === userId
      }))
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}