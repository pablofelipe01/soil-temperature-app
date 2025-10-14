import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema de validación para actualizar ubicación
const updateLocationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es muy largo').optional(),
  description: z.string().optional(),
  latitude: z.number()
    .min(-90, 'Latitud debe estar entre -90 y 90')
    .max(90, 'Latitud debe estar entre -90 y 90')
    .optional(),
  longitude: z.number()
    .min(-180, 'Longitud debe estar entre -180 y 180')
    .max(180, 'Longitud debe estar entre -180 y 180')
    .optional(),
  elevation: z.number().optional(),
  soilType: z.string().optional(),
  landUse: z.string().optional(),
  clientName: z.string().min(1, 'El nombre del cliente es requerido').optional(),
  clientEmail: z.string().email('Email inválido').optional(),
  isActive: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/locations/[id] - Obtener una ubicación específica
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const locationId = id
    
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: userId
      },
      include: {
        _count: {
          select: {
            soilTemperatures: true
          }
        },
        soilTemperatures: {
          take: 10,
          orderBy: {
            measurementDate: 'desc'
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: location
    })

  } catch (error) {
    console.error('Error al obtener ubicación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT /api/locations/[id] - Actualizar una ubicación
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const locationId = id
    
    const body = await request.json()
    
    // Validar datos de entrada
    const validationResult = updateLocationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Verificar que la ubicación existe y pertenece al usuario
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: userId
      }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    // Si se están actualizando las coordenadas, verificar que no haya conflictos
    if (updateData.latitude !== undefined || updateData.longitude !== undefined) {
      const newLat = updateData.latitude ?? parseFloat(existingLocation.latitude.toString())
      const newLng = updateData.longitude ?? parseFloat(existingLocation.longitude.toString())

      const conflictingLocation = await prisma.location.findFirst({
        where: {
          userId: userId,
          id: { not: locationId },
          AND: [
            {
              latitude: {
                gte: newLat - 0.0001,
                lte: newLat + 0.0001
              }
            },
            {
              longitude: {
                gte: newLng - 0.0001,
                lte: newLng + 0.0001
              }
            }
          ]
        }
      })

      if (conflictingLocation) {
        return NextResponse.json(
          { 
            error: 'Ya existe otra ubicación muy cercana a estas coordenadas',
            conflictingLocation: {
              id: conflictingLocation.id,
              name: conflictingLocation.name
            }
          },
          { status: 409 }
        )
      }
    }

    // Actualizar la ubicación
    const updatedLocation = await prisma.location.update({
      where: {
        id: locationId
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            soilTemperatures: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: 'Ubicación actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error al actualizar ubicación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/locations/[id] - Eliminar una ubicación
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const locationId = id
    
    // Verificar que la ubicación existe y pertenece al usuario
    const existingLocation = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: userId
      },
      include: {
        _count: {
          select: {
            soilTemperatures: true
          }
        }
      }
    })

    if (!existingLocation) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar si tiene datos asociados
    if (existingLocation._count.soilTemperatures > 0) {
      // En lugar de eliminar, marcar como inactiva
      const deactivatedLocation = await prisma.location.update({
        where: { id: locationId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: deactivatedLocation,
        message: 'Ubicación desactivada (tiene datos históricos asociados)',
        action: 'deactivated'
      })
    } else {
      // Eliminar completamente si no tiene datos asociados
      await prisma.location.delete({
        where: { id: locationId }
      })

      return NextResponse.json({
        success: true,
        message: 'Ubicación eliminada exitosamente',
        action: 'deleted'
      })
    }

  } catch (error) {
    console.error('Error al eliminar ubicación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}