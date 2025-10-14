import { NextResponse } from 'next/server'
import { soilTemperatureService } from '@/lib/earth-engine/services'

export async function GET() {
  try {
    console.log('🔍 Testing GEE service directly...')

    const testQuery = {
      latitude: 4.727515,
      longitude: -74.072357,
      startDate: '2025-01-01',
      endDate: '2025-02-01'
    }

    console.log('📍 Test query:', testQuery)

    const result = await soilTemperatureService.getSoilTemperatureData(testQuery)
    
    console.log('🌡️ GEE service result:', JSON.stringify(result, null, 2))

    return NextResponse.json({
      success: true,
      testQuery,
      geeResult: result,
      debug: {
        hasData: !!result.data,
        dataLength: result.data?.length || 0,
        firstRecord: result.data?.[0] || null,
        allKeys: result.data?.[0] ? Object.keys(result.data[0]) : []
      }
    })

  } catch (error) {
    console.error('💥 Error testing GEE service:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}