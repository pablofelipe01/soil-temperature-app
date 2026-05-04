import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { soilTemperatureService } from '@/lib/earth-engine/services'

const soilHealthSchema = z.object({
  locationId: z.string().uuid('ID de ubicación inválido'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

type DepthKey = 'tempLevel1' | 'tempLevel2' | 'tempLevel3' | 'tempLevel4'

interface TemperaturePoint {
  date: string
  tempLevel1: number | null
  tempLevel2: number | null
  tempLevel3: number | null
  tempLevel4: number | null
}

const DEPTH_KEYS: DepthKey[] = ['tempLevel1', 'tempLevel2', 'tempLevel3', 'tempLevel4']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function avg(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

function scoreTemperature(avgTemp: number | null): number {
  if (avgTemp == null) return 0
  // Ideal agronomic window around 18-30 C.
  if (avgTemp >= 18 && avgTemp <= 30) return 100
  const distance = avgTemp < 18 ? 18 - avgTemp : avgTemp - 30
  return clamp(100 - distance * 6, 0, 100)
}

function scoreMoisture(avgMoisture: number | null): number {
  if (avgMoisture == null) return 0
  // Typical volumetric soil moisture healthy interval for many soils.
  if (avgMoisture >= 0.2 && avgMoisture <= 0.4) return 100
  const distance = avgMoisture < 0.2 ? 0.2 - avgMoisture : avgMoisture - 0.4
  return clamp(100 - distance * 240, 0, 100)
}

function scoreBiochar(
  biocharStartDate: Date | null,
  readings: TemperaturePoint[],
): { score: number; deltaAvg: number | null; preCount: number; postCount: number } {
  if (!biocharStartDate) {
    return { score: 50, deltaAvg: null, preCount: 0, postCount: 0 }
  }

  const biocharTs = biocharStartDate.getTime()
  const pre = readings.filter((r) => new Date(r.date).getTime() < biocharTs)
  const post = readings.filter((r) => new Date(r.date).getTime() >= biocharTs)

  const perDepthDeltas: number[] = []
  for (const depthKey of DEPTH_KEYS) {
    const preVals = pre.map((r) => r[depthKey]).filter((v): v is number => v != null)
    const postVals = post.map((r) => r[depthKey]).filter((v): v is number => v != null)
    if (preVals.length > 0 && postVals.length > 0) {
      const preAvg = avg(preVals)
      const postAvg = avg(postVals)
      if (preAvg != null && postAvg != null) {
        perDepthDeltas.push(postAvg - preAvg)
      }
    }
  }

  if (perDepthDeltas.length === 0) {
    return { score: 60, deltaAvg: null, preCount: pre.length, postCount: post.length }
  }

  const deltaAvg = avg(perDepthDeltas)
  if (deltaAvg == null) {
    return { score: 60, deltaAvg: null, preCount: pre.length, postCount: post.length }
  }

  // Slight cooling after biochar is treated as beneficial; near-neutral still acceptable.
  const targetDelta = -1
  const distance = Math.abs(deltaAvg - targetDelta)
  const score = clamp(100 - distance * 20, 0, 100)

  return {
    score,
    deltaAvg,
    preCount: pre.length,
    postCount: post.length,
  }
}

function normalizeStatus(index: number): 'optimo' | 'alerta' | 'critico' {
  if (index >= 75) return 'optimo'
  if (index >= 45) return 'alerta'
  return 'critico'
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const validation = soilHealthSchema.safeParse({
      locationId: searchParams.get('locationId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validation.error.format() },
        { status: 400 },
      )
    }

    const { locationId, startDate, endDate } = validation.data
    if (new Date(startDate) > new Date(endDate)) {
      return NextResponse.json(
        { error: 'La fecha de inicio debe ser anterior a la fecha de fin' },
        { status: 400 },
      )
    }

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        biocharStartDate: true,
      },
    })

    if (!location) {
      return NextResponse.json({ error: 'Ubicación no encontrada' }, { status: 404 })
    }

    let temperatureRows = await prisma.soilTemperature.findMany({
      where: {
        locationId,
        measurementDate: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      orderBy: {
        measurementDate: 'asc',
      },
    })

    if (temperatureRows.length === 0) {
      const fetched = await soilTemperatureService.getSoilTemperatureData({
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        startDate,
        endDate,
      })

      if (fetched.success && fetched.data) {
        const persisted = []
        for (const d of fetched.data) {
          const upserted = await prisma.soilTemperature.upsert({
            where: {
              locationId_measurementDate_dataSource: {
                locationId,
                measurementDate: new Date(d.date),
                dataSource: 'ERA5-Land',
              },
            },
            update: {
              tempLevel1: d.temperature_level_1,
              tempLevel2: d.temperature_level_2,
              tempLevel3: d.temperature_level_3,
              tempLevel4: d.temperature_level_4,
            },
            create: {
              locationId,
              measurementDate: new Date(d.date),
              tempLevel1: d.temperature_level_1,
              tempLevel2: d.temperature_level_2,
              tempLevel3: d.temperature_level_3,
              tempLevel4: d.temperature_level_4,
              dataSource: 'ERA5-Land',
            },
          })
          persisted.push(upserted)
        }
        temperatureRows = persisted
      }
    }

    const temperatureData: TemperaturePoint[] = temperatureRows.map((r) => ({
      date: r.measurementDate.toISOString().split('T')[0],
      tempLevel1: r.tempLevel1 != null ? Number(r.tempLevel1) : null,
      tempLevel2: r.tempLevel2 != null ? Number(r.tempLevel2) : null,
      tempLevel3: r.tempLevel3 != null ? Number(r.tempLevel3) : null,
      tempLevel4: r.tempLevel4 != null ? Number(r.tempLevel4) : null,
    }))

    const moistureResponse = await soilTemperatureService.getSoilMoistureData({
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      startDate,
      endDate,
    })

    if (!moistureResponse.success) {
      return NextResponse.json(
        { error: moistureResponse.error || 'No se pudo obtener humedad del suelo' },
        { status: 502 },
      )
    }

    const temperatureValues: number[] = []
    for (const row of temperatureData) {
      for (const key of DEPTH_KEYS) {
        const value = row[key]
        if (value != null) temperatureValues.push(value)
      }
    }

    const moistureValues = (moistureResponse.data || []).flatMap((m) => [
      m.moisture_level_1,
      m.moisture_level_2,
      m.moisture_level_3,
      m.moisture_level_4,
    ]).filter((v): v is number => v != null)

    const avgTemp = avg(temperatureValues)
    const avgMoisture = avg(moistureValues)

    const temperatureScore = scoreTemperature(avgTemp)
    const moistureScore = scoreMoisture(avgMoisture)
    const biocharInfo = scoreBiochar(location.biocharStartDate, temperatureData)

    const compositeIndex = Math.round(
      temperatureScore * 0.4 + moistureScore * 0.4 + biocharInfo.score * 0.2,
    )

    return NextResponse.json({
      success: true,
      data: {
        location: {
          id: location.id,
          name: location.name,
        },
        period: {
          startDate,
          endDate,
        },
        compositeIndex,
        status: normalizeStatus(compositeIndex),
        scores: {
          temperature: Math.round(temperatureScore),
          moisture: Math.round(moistureScore),
          biochar: Math.round(biocharInfo.score),
        },
        metrics: {
          averageTemperature: avgTemp,
          averageMoisture: avgMoisture,
          biocharDeltaAverage: biocharInfo.deltaAvg,
          preBiocharSamples: biocharInfo.preCount,
          postBiocharSamples: biocharInfo.postCount,
          temperatureRecords: temperatureData.length,
          moistureRecords: moistureResponse.data?.length || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error calculando índice de salud del suelo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
