import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Test del pipeline principal SIN autenticación
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate') || '2024-01-01'
    const endDate = searchParams.get('endDate') || '2024-01-31'
    
    if (!locationId) {
      return NextResponse.json({
        success: false,
        error: "locationId required"
      })
    }
    
    console.log(`🧪 Testing main pipeline for location ${locationId}`)
    console.log(`📅 Date range: ${startDate} to ${endDate}`)
    
    // 1. Verificar que la location existe
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true
      }
    })
    
    if (!location) {
      return NextResponse.json({
        success: false,
        error: "Location not found"
      })
    }
    
    console.log('✅ Location found:', location.name)
    
    // 2. Usar el servicio de GEE directamente (como en el arreglo)
    const { soilTemperatureService } = await import('@/lib/earth-engine/services')
    
    const geeResult = await soilTemperatureService.getSoilTemperatureData({
      latitude: parseFloat(location.latitude.toString()),
      longitude: parseFloat(location.longitude.toString()),
      startDate,
      endDate
    })
    
    if (!geeResult.success) {
      return NextResponse.json({
        success: false,
        error: "Error fetching from GEE",
        details: geeResult
      })
    }
    
    if (!geeResult.data) {
      return NextResponse.json({
        success: false,
        error: "No data received from GEE"
      })
    }
    
    console.log('✅ GEE data fetched:', geeResult.data.length, 'records')
    
    // 3. Guardar en la base de datos usando EXACTAMENTE la misma lógica del test exitoso
    const savedRecords = []
    
    // DEBUG: Mostrar estructura completa de datos
    console.log('🔍 Full geeResult structure:', JSON.stringify(geeResult, null, 2))
    
    for (const tempDataItem of geeResult.data) {
      console.log('🔍 Processing item:', JSON.stringify(tempDataItem, null, 2))
      console.log('🔍 temperature_level_1 value:', tempDataItem.temperature_level_1)
      console.log('🔍 typeof temperature_level_1:', typeof tempDataItem.temperature_level_1)
      
      const saved = await prisma.soilTemperature.upsert({
        where: {
          locationId_measurementDate_dataSource: {
            locationId: locationId,
            measurementDate: new Date(tempDataItem.date),
            dataSource: 'ERA5-Land'
          }
        },
        update: {
          tempLevel1: tempDataItem.temperature_level_1,
          tempLevel2: tempDataItem.temperature_level_2,
          tempLevel3: tempDataItem.temperature_level_3,
          tempLevel4: tempDataItem.temperature_level_4
        },
        create: {
          locationId: locationId,
          measurementDate: new Date(tempDataItem.date),
          tempLevel1: tempDataItem.temperature_level_1,
          tempLevel2: tempDataItem.temperature_level_2,
          tempLevel3: tempDataItem.temperature_level_3,
          tempLevel4: tempDataItem.temperature_level_4,
          dataSource: 'ERA5-Land'
        }
      })
      savedRecords.push(saved)
    }
    
    console.log('✅ Data saved:', savedRecords.length, 'records')
    
    // 4. Verificar en la base de datos
    const verifyData = await prisma.soilTemperature.findMany({
      where: {
        locationId: locationId,
        measurementDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: {
        measurementDate: 'asc'
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Main pipeline test complete!",
      data: {
        location,
        geeResult: {
          success: geeResult.success,
          recordCount: geeResult.data.length,
          sampleData: geeResult.data[0]
        },
        savedRecords: savedRecords.length,
        verificationRecords: verifyData.map(record => ({
          id: record.id,
          date: record.measurementDate.toISOString().split('T')[0],
          temperatures: {
            level1: `${record.tempLevel1}°C`,
            level2: `${record.tempLevel2}°C`,
            level3: `${record.tempLevel3}°C`,
            level4: `${record.tempLevel4}°C`
          },
          hasRealData: record.tempLevel1 !== null
        }))
      }
    })
    
  } catch (error) {
    console.error('❌ Main pipeline test failed:', error)
    return NextResponse.json({
      success: false,
      error: "Main pipeline test failed",
      details: error instanceof Error ? error.message : String(error)
    })
  }
}