import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true
      },
      take: 1
    })
    
    return NextResponse.json({ 
      success: true, 
      users,
      message: users.length > 0 ? "Found users" : "No users found"
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}