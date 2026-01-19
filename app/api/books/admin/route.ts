import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - List semua buku untuk admin dashboard (dari seluruh user)
export async function GET(request: NextRequest) {
  try {
    const books = await prisma.book.findMany({
      include: {
        userBooks: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform data untuk admin dashboard
    const booksForAdmin = books.map((book) => {
      const totalStock = book.userBooks.length
      const availableStock = book.userBooks.filter((ub) => ub.isAvailable).length
      const unavailableStock = totalStock - availableStock

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description,
        coverImage: book.coverImage,
        stock: totalStock,
        available: availableStock,
        unavailable: unavailableStock,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        // Info tambahan untuk admin
        owners: book.userBooks.map((ub) => ({
          userId: ub.userId,
          userName: ub.user.name,
          userEmail: ub.user.email,
          userBookId: ub.id,
          isAvailable: ub.isAvailable,
          location: ub.location,
        })),
      }
    })

    return NextResponse.json(booksForAdmin)
  } catch (error) {
    console.error("Error fetching books for admin:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data buku" },
      { status: 500 }
    )
  }
}
