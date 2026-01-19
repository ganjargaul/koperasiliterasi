import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Get all books from a specific user's collection (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const available = searchParams.get("available")

    const where: any = { userId: params.id }
    if (available === "true") {
      where.isAvailable = true
    } else if (available === "false") {
      where.isAvailable = false
    }

    const userBooks = await prisma.userBook.findMany({
      where,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
            location: true,
            socialMedia: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(userBooks)
  } catch (error) {
    console.error("Error fetching user books:", error)
    return NextResponse.json(
      { error: "Gagal mengambil koleksi buku user" },
      { status: 500 }
    )
  }
}
