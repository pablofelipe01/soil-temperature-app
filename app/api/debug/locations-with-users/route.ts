import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        userId: true,
        latitude: true,
        longitude: true
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      locations,
      userIds: [...new Set(locations.map(l => l.userId))]
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}