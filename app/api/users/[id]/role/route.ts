import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// PUT - Update user role (hanya untuk admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { role } = body

    // Validasi role
    if (!role || !["ADMIN", "USER"].includes(role)) {
      return NextResponse.json(
        { error: "Role harus ADMIN atau USER" },
        { status: 400 }
      )
    }

    // Cek apakah user ada
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Update role
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      message: "Role user berhasil diubah",
      user: updatedUser,
    })
  } catch (error: any) {
    console.error("Error updating user role:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Gagal mengupdate role user" },
      { status: 500 }
    )
  }
}
