import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true
      },
      take: 5
    })
    
    return NextResponse.json({ success: true, locations })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, latitude, longitude } = await request.json()
    
    const newLocation = await prisma.location.create({
      data: {
        name: name,
        latitude: latitude,
        longitude: longitude,
        userId: "e6ed021d-6d0e-4919-ba18-9388344f8cb7", // Real user ID
        clientName: "Test Client",
        description: "Location created for testing temperature pipeline"
      }
    })
    
    return NextResponse.json({
      success: true,
      message: "Location created",
      location: newLocation
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}