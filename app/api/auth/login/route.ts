import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// POST - Login user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      )
    }

    // Simple password check (in production, use bcrypt)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Email atau password salah" },
        { status: 401 }
      )
    }

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Gagal melakukan login" },
      { status: 500 }
    )
  }
}
