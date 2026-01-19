import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST - Create admin user (for development/testing only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // Default values if not provided
    const adminName = name || "Administrator"
    const adminEmail = email || "admin@bukabuku.com"
    const adminPassword = password || "admin123"

    // Validate password length
    if (adminPassword.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (existing) {
      // If user exists, update role to ADMIN if not already
      if (existing.role !== "ADMIN") {
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: { role: "ADMIN" },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        })
        return NextResponse.json({
          message: "User sudah ada, role telah diubah menjadi ADMIN",
          user: updated,
        })
      }
      return NextResponse.json({
        message: "User admin dengan email ini sudah ada",
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
      })
    }

    // Create admin user (password should be hashed in production)
    const user = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: adminPassword, // In production, hash this!
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({
      message: "User admin berhasil dibuat",
      user,
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
    }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating admin user:", error)

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal membuat user admin" },
      { status: 500 }
    )
  }
}
