import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { locationId, latitude, longitude } = await request.json()
    
    const updated = await prisma.location.update({
      where: { id: locationId },
      data: {
        latitude: latitude.toString(),
        longitude: longitude.toString()
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Location coordinates updated",
      location: updated
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}