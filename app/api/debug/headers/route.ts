import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const authorization = request.headers.get('authorization')
    
    const allHeaders: Record<string, string> = {}
    request.headers.forEach((value, key) => {
      allHeaders[key] = value
    })
    
    return NextResponse.json({ 
      success: true, 
      headers: {
        'x-user-id': userId,
        'authorization': authorization,
        allHeaders
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}