import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - List semua buku dengan info ketersediaan per lokasi
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get("location") // Optional filter by location

    const books = await prisma.book.findMany({
      include: {
        userBooks: {
          where: {
            isAvailable: true,
            ...(location && { location }),
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Transform data untuk menampilkan ketersediaan per lokasi
    const booksWithAvailability = books.map((book) => {
      const locations = book.userBooks.reduce((acc: any, ub: any) => {
        const loc = ub.location || "Lokasi tidak diketahui"
        if (!acc[loc]) {
          acc[loc] = {
            location: loc,
            count: 0,
            owners: [],
          }
        }
        acc[loc].count++
        acc[loc].owners.push({
          id: ub.user.id,
          name: ub.user.name,
          userBookId: ub.id,
        })
        return acc
      }, {})

      return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        description: book.description,
        coverImage: book.coverImage,
        totalAvailable: book.userBooks.length,
        locations: Object.values(locations),
      }
    })

    return NextResponse.json(booksWithAvailability)
  } catch (error) {
    console.error("Error fetching books:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data buku" },
      { status: 500 }
    )
  }
}

// POST - Create buku baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, isbn, description, coverImage, stock } = body

    // Validasi
    if (!title || !author) {
      return NextResponse.json(
        { error: "Judul dan penulis wajib diisi" },
        { status: 400 }
      )
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        isbn: isbn || null,
        description: description || null,
        coverImage: coverImage || null,
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error: any) {
    console.error("Error creating book:", error)
    
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "ISBN sudah terdaftar" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal membuat buku" },
      { status: 500 }
    )
  }
}
