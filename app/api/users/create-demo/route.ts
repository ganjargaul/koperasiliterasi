import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST - Create demo user (for development only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name dan email wajib diisi" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { 
          message: "User dengan email ini sudah ada", 
          userId: existing.id,
          user: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            role: existing.role,
          }
        },
        { status: 200 }
      )
    }

    // Create user (password should be hashed in production)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: password || "demo123", // In production, hash this!
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error("Error creating user:", error)

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal membuat user" },
      { status: 500 }
    )
  }
}
