import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Nuevo test usando CREATE en lugar de UPSERT
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate') || '2024-08-01'
    const endDate = searchParams.get('endDate') || '2024-08-31'
    
    if (!locationId) {
      return NextResponse.json({
        success: false,
        error: "locationId required"
      })
    }
    
    console.log(`🧪 Testing CREATE logic for location ${locationId}`)
    
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
    
    // 2. Usar el servicio de GEE directamente
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
    
    console.log('✅ GEE data fetched:', JSON.stringify(geeResult, null, 2))
    
    // 3. USAR CREATE directamente como en el test exitoso
    const savedRecords = []
    if (geeResult.data) {
      for (const tempDataItem of geeResult.data) {
      console.log('🔍 Creating record with data:', {
        date: tempDataItem.date,
        temp_level_1: tempDataItem.temperature_level_1,
        temp_level_2: tempDataItem.temperature_level_2,
        temp_level_3: tempDataItem.temperature_level_3,
        temp_level_4: tempDataItem.temperature_level_4
      })
      
      const saved = await prisma.soilTemperature.upsert({
        where: {
          locationId_measurementDate_dataSource: {
            locationId: locationId,
            measurementDate: new Date(tempDataItem.date),
            dataSource: 'ERA5-Land-CREATE-TEST'
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
          dataSource: 'ERA5-Land-CREATE-TEST'
        }
      })
      
      savedRecords.push(saved)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "CREATE test successful!",
      data: {
        location,
        geeResult: {
          success: geeResult.success,
          recordCount: geeResult.data?.length || 0,
          rawData: geeResult.data
        },
        savedRecords: savedRecords.map(record => ({
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
    console.error('❌ CREATE test failed:', error)
    return NextResponse.json({
      success: false,
      error: "CREATE test failed",
      details: error instanceof Error ? error.message : String(error)
    })
  }
}