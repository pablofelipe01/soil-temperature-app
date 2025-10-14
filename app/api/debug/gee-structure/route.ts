import { NextRequest, NextResponse } from "next/server"

// Debug específico para ver la estructura de datos de GEE
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '4.6')
    const lon = parseFloat(searchParams.get('lon') || '-74.08')
    
    console.log(`🔍 Debugging GEE data structure for [${lat}, ${lon}]`)
    
    const { soilTemperatureService } = await import('@/lib/earth-engine/services')
    
    const result = await soilTemperatureService.getSoilTemperatureData({
      latitude: lat,
      longitude: lon,
      startDate: '2024-02-01',
      endDate: '2024-02-28'
    })
    
    return NextResponse.json({
      success: true,
      rawResult: result,
      dataStructure: {
        success: result.success,
        hasData: result.data ? true : false,
        dataLength: result.data ? result.data.length : 0,
        firstRecord: result.data && result.data.length > 0 ? result.data[0] : null,
        temperatureKeys: result.data && result.data.length > 0 ? 
          Object.keys(result.data[0]).filter(key => key.includes('temperature')) : []
      }
    })
    
  } catch (error) {
    console.error('❌ Debug failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}