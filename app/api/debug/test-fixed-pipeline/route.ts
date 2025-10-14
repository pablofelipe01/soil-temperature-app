import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { latitude, longitude, location } = await request.json()
    
    console.log(`🧪 Testing fixed pipeline for ${location} at [${latitude}, ${longitude}]`)
    
    // 1. Consultar GEE directamente
    const { soilTemperatureService } = await import('@/lib/earth-engine/services')
    
    const startDate = "2024-07-01"
    const endDate = "2024-07-31"
    
    console.log('🔍 Step 1: Fetching from GEE...')
    const geeData = await soilTemperatureService.getSoilTemperatureData({
      latitude,
      longitude,
      startDate,
      endDate
    })
    
    if (!geeData.success) {
      return NextResponse.json({
        success: false,
        error: "Error fetching from GEE",
        details: geeData
      })
    }
    
    console.log('✅ Step 1 complete - GEE data:', geeData)
    
    // 2. Verificar si existe alguna location para usar, o usar la primera disponible
    console.log('🔍 Step 2A: Finding existing location...')
    const existingLocation = await prisma.location.findFirst({
      select: { id: true, name: true }
    })
    
    if (!existingLocation) {
      return NextResponse.json({
        success: false,
        error: "No locations found in database. Create a location first."
      })
    }
    
    console.log('✅ Using existing location:', existingLocation)
    
    // 2B. Guardar temperatura en la base de datos
    console.log('🔍 Step 2B: Saving temperature to database...')
    
    // Los datos están en geeData.data[0]
    if (!geeData.data || geeData.data.length === 0) {
      return NextResponse.json({ success: false, error: "No temperature data available" })
    }
    const tempData = geeData.data[0]
    
    const newRecord = await prisma.soilTemperature.create({
      data: {
        locationId: existingLocation.id,
        measurementDate: new Date(startDate),
        tempLevel1: tempData.temperature_level_1,
        tempLevel2: tempData.temperature_level_2,
        tempLevel3: tempData.temperature_level_3,
        tempLevel4: tempData.temperature_level_4,
        dataSource: "ERA5-Land-FIXED"
      }
    })
    
    console.log('✅ Step 2 complete - Database record:', newRecord)
    
    return NextResponse.json({
      success: true,
      message: "Pipeline test complete - Temperature data fixed!",
      data: {
        geeResponse: geeData,
        databaseRecord: newRecord,
        temperatures: {
          level_1: `${tempData.temperature_level_1}°C`,
          level_2: `${tempData.temperature_level_2}°C`,  
          level_3: `${tempData.temperature_level_3}°C`,
          level_4: `${tempData.temperature_level_4}°C`
        }
      }
    })
    
  } catch (error) {
    console.error('❌ Pipeline test failed:', error)
    return NextResponse.json({
      success: false,
      error: "Pipeline test failed",
      details: error instanceof Error ? error.message : String(error)
    })
  }
}