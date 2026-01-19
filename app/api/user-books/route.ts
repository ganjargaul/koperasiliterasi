import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - List user books (if userId provided) or all available books (if no userId)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const available = searchParams.get("available")

    const where: any = {}
    
    if (userId) {
      where.userId = userId
    }
    
    if (available === "true") {
      where.isAvailable = true
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
      { error: "Gagal mengambil data koleksi buku" },
      { status: 500 }
    )
  }
}

// POST - Add book to user collection
export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json(
        { 
          error: "Format data tidak valid",
          code: "PARSE_ERROR",
          details: parseError.message || "Invalid JSON"
        },
        { status: 400 }
      )
    }

    const { userId, bookId, condition, notes, location } = body

    console.log("Received data:", { userId, bookId, condition, notes, location })

    if (!userId || !bookId) {
      return NextResponse.json(
        { error: "User ID dan Book ID wajib diisi" },
        { status: 400 }
      )
    }

    // Validate location is required
    if (!location || typeof location !== "string" || location.trim() === "") {
      return NextResponse.json(
        { error: "Lokasi/Kota wajib diisi" },
        { status: 400 }
      )
    }

    // Validate userId and bookId are strings
    if (typeof userId !== "string" || typeof bookId !== "string") {
      return NextResponse.json(
        { error: "User ID dan Book ID harus berupa string" },
        { status: 400 }
      )
    }

    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      return NextResponse.json(
        { error: "Buku tidak ditemukan" },
        { status: 404 }
      )
    }

    // Check if user already has this book
    const existing = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Buku ini sudah ada di koleksi Anda" },
        { status: 400 }
      )
    }

    // Prepare data for creation
    const userBookData: any = {
      userId: userId.trim(),
      bookId: bookId.trim(),
      isAvailable: true,
    }

    // Add optional fields only if they have values
    if (condition && typeof condition === "string" && condition.trim()) {
      userBookData.condition = condition.trim()
    }
    // Location is required, already validated above
    userBookData.location = location.trim()

    console.log("Creating userBook with data:", userBookData)

    // Create or find book if not exists, then add to user collection
    const userBook = await prisma.userBook.create({
      data: userBookData,
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(userBook, { status: 201 })
  } catch (error: any) {
    // Log error dengan lebih detail
    console.error("=== ERROR ADDING USER BOOK ===")
    console.error("Error:", error)
    console.error("Error name:", error?.name)
    console.error("Error message:", error?.message)
    console.error("Error code:", error?.code)
    console.error("Error meta:", error?.meta)
    
    // Try to stringify error safely
    try {
      console.error("Error stringified:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    } catch (e) {
      console.error("Could not stringify error:", e)
    }

    // Handle Prisma specific errors
    if (error?.code) {
      if (error.code === "P2002") {
        const target = error.meta?.target || []
        const field = target.join(", ")
        return NextResponse.json(
          { 
            error: "Buku ini sudah ada di koleksi Anda",
            code: error.code,
            field: field || "userId_bookId"
          },
          { status: 400 }
        )
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          { 
            error: "User atau buku tidak ditemukan",
            code: error.code,
            details: error.meta?.field_name || "Foreign key constraint failed"
          },
          { status: 404 }
        )
      }

      if (error.code === "P2012") {
        return NextResponse.json(
          { 
            error: "Data tidak valid. Pastikan semua field yang wajib diisi sudah terisi.",
            code: error.code,
            details: error.meta?.reason || "Missing required field"
          },
          { status: 400 }
        )
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          { 
            error: "Data tidak ditemukan",
            code: error.code,
            details: error.meta?.cause || "Record not found"
          },
          { status: 404 }
        )
      }
    }

    // Handle validation errors
    if (error?.name === "ValidationError" || error?.name === "ZodError") {
      return NextResponse.json(
        { 
          error: "Data tidak valid",
          code: "VALIDATION_ERROR",
          details: error.message || "Validation failed"
        },
        { status: 400 }
      )
    }

    // Generic error response with more details
    const errorMessage = error?.message || "Unknown error occurred"
    const errorCode = error?.code || error?.name || "UNKNOWN"
    
    return NextResponse.json(
      { 
        error: "Gagal menambahkan buku ke koleksi",
        details: errorMessage,
        code: errorCode,
        hint: "Silakan cek console server untuk detail lebih lanjut"
      },
      { status: 500 }
    )
  }
}
