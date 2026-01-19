import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nama, email, dan password wajib diisi" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      )
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      )
    }

    // Create user (in production, hash password with bcrypt)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password, // In production: await bcrypt.hash(password, 10)
        role: "USER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error: any) {
    console.error("Register error:", error)

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal melakukan registrasi" },
      { status: 500 }
    )
  }
}
