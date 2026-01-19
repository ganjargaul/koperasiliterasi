import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Get user book details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userBook = await prisma.userBook.findUnique({
      where: { id: params.id },
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

    if (!userBook) {
      return NextResponse.json(
        { error: "Koleksi buku tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(userBook)
  } catch (error: any) {
    console.error("Error fetching user book:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data koleksi buku" },
      { status: 500 }
    )
  }
}

// PUT - Update user book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log("Update request body:", { ...body, coverImage: body.coverImage ? `${body.coverImage.substring(0, 50)}...` : null })
    
    const { 
      isAvailable, 
      condition, 
      location,
      coverImage, // Foto untuk UserBook ini
      // Book information
      title,
      author,
      isbn,
      description
    } = body

    // Get current userBook to check ownership
    const currentUserBook = await prisma.userBook.findUnique({
      where: { id: params.id },
      include: { book: true },
    })

    if (!currentUserBook) {
      return NextResponse.json(
        { error: "Koleksi buku tidak ditemukan" },
        { status: 404 }
      )
    }

    // Update book information if provided
    const bookUpdateData: any = {}
    
    if (title !== undefined) {
      if (!title || title.trim() === "") {
        return NextResponse.json(
          { error: "Judul buku tidak boleh kosong" },
          { status: 400 }
        )
      }
      bookUpdateData.title = title.trim()
    }
    
    if (author !== undefined) {
      if (!author || author.trim() === "") {
        return NextResponse.json(
          { error: "Penulis tidak boleh kosong" },
          { status: 400 }
        )
      }
      bookUpdateData.author = author.trim()
    }
    
    if (isbn !== undefined) {
      bookUpdateData.isbn = isbn && isbn.trim() !== "" ? isbn.trim() : null
    }
    
    if (description !== undefined) {
      bookUpdateData.description = description && description.trim() !== "" ? description.trim() : null
    }
    
    if (Object.keys(bookUpdateData).length > 0) {
      await prisma.book.update({
        where: { id: currentUserBook.bookId },
        data: bookUpdateData,
      })
    }

    // Update userBook information
    const userBookUpdateData: any = {}
    
    if (isAvailable !== undefined) {
      userBookUpdateData.isAvailable = isAvailable
    }
    
    if (condition !== undefined) {
      userBookUpdateData.condition = condition && condition.trim() !== "" ? condition.trim() : null
    }
    
    if (location !== undefined) {
      if (!location || location.trim() === "") {
        return NextResponse.json(
          { error: "Lokasi/Kota wajib diisi" },
          { status: 400 }
        )
      }
      userBookUpdateData.location = location.trim()
    }
    
    // Always handle coverImage if provided
    if (coverImage !== undefined) {
      if (coverImage === null || coverImage === "") {
        userBookUpdateData.coverImage = null
      } else if (typeof coverImage === "string") {
        // Trim and use the value (could be base64 data URL or regular URL)
        const trimmed = coverImage.trim()
        userBookUpdateData.coverImage = trimmed !== "" ? trimmed : null
      } else {
        // Invalid type, set to null
        userBookUpdateData.coverImage = null
      }
    }
    
    // Only update userBook if there's data to update
    let userBook
    if (Object.keys(userBookUpdateData).length > 0) {
      userBook = await prisma.userBook.update({
        where: { id: params.id },
        data: userBookUpdateData,
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
    } else {
      // If no userBook fields to update, just fetch the current data
      userBook = await prisma.userBook.findUnique({
        where: { id: params.id },
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
    }

    if (!userBook) {
      return NextResponse.json(
        { error: "Koleksi buku tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(userBook)
  } catch (error: any) {
    console.error("Error updating user book:", error)
    console.error("Error details:", JSON.stringify(error, null, 2))

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Koleksi buku tidak ditemukan" },
        { status: 404 }
      )
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "ISBN sudah digunakan oleh buku lain" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        error: "Gagal mengupdate koleksi buku",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}

// DELETE - Remove book from user collection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if book is currently borrowed
    const activeBorrows = await prisma.borrow.count({
      where: {
        userBookId: params.id,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    })

    if (activeBorrows > 0) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus buku yang sedang dipinjam" },
        { status: 400 }
      )
    }

    await prisma.userBook.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Buku berhasil dihapus dari koleksi" })
  } catch (error: any) {
    console.error("Error deleting user book:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Koleksi buku tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Gagal menghapus buku dari koleksi" },
      { status: 500 }
    )
  }
}
