import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { z } from 'zod'

// Schema de validación para crear/actualizar ubicación
const locationSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200, 'El nombre es muy largo'),
  description: z.string().optional(),
  latitude: z.number()
    .min(-90, 'Latitud debe estar entre -90 y 90')
    .max(90, 'Latitud debe estar entre -90 y 90'),
  longitude: z.number()
    .min(-180, 'Longitud debe estar entre -180 y 180')
    .max(180, 'Longitud debe estar entre -180 y 180'),
  elevation: z.number().optional(),
  soilType: z.string().optional(),
  landUse: z.string().optional(),
  clientName: z.string().min(1, 'El nombre del cliente es requerido'),
  clientEmail: z.string().email('Email inválido').optional(),
  isActive: z.boolean().default(true)
})

// GET /api/locations - Obtener todas las ubicaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtro opcionales
    const isActive = searchParams.get('active') === 'true'
    const clientName = searchParams.get('client')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const whereClause: {
      userId: string
      isActive?: boolean
      clientName?: { contains: string; mode: 'insensitive' }
    } = {
      userId: userId
    }

    if (typeof isActive === 'boolean') {
      whereClause.isActive = isActive
    }

    if (clientName) {
      whereClause.clientName = {
        contains: clientName,
        mode: 'insensitive'
      }
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: {
            soilTemperatures: true
          }
        }
      }
    })

    const total = await prisma.location.count({
      where: whereClause
    })

    return NextResponse.json({
      success: true,
      data: locations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    })

  } catch (error) {
    console.error('Error al obtener ubicaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Crear nueva ubicación
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Validar datos de entrada
    const validationResult = locationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos',
          details: validationResult.error.format()
        },
        { status: 400 }
      )
    }

    const locationData = validationResult.data

    // Verificar si ya existe una ubicación con coordenadas muy similares
    const existingLocation = await prisma.location.findFirst({
      where: {
        userId: userId,
        AND: [
          {
            latitude: {
              gte: locationData.latitude - 0.0001,
              lte: locationData.latitude + 0.0001
            }
          },
          {
            longitude: {
              gte: locationData.longitude - 0.0001,
              lte: locationData.longitude + 0.0001
            }
          }
        ]
      }
    })

    if (existingLocation) {
      return NextResponse.json(
        { 
          error: 'Ya existe una ubicación muy cercana a estas coordenadas',
          existingLocation: {
            id: existingLocation.id,
            name: existingLocation.name,
            latitude: existingLocation.latitude,
            longitude: existingLocation.longitude
          }
        },
        { status: 409 }
      )
    }

    // Verificar si el usuario existe en nuestra base de datos, si no, crearlo
    await prisma.user.upsert({
      where: { id: userId },
      update: {}, // No hacer nada si ya existe
      create: {
        id: userId,
        email: request.headers.get('x-user-email') || 'unknown@example.com'
      }
    })

    // Crear la nueva ubicación
    const newLocation = await prisma.location.create({
      data: {
        ...locationData,
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

    return NextResponse.json({
      success: true,
      data: newLocation,
      message: 'Ubicación creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear ubicación:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}