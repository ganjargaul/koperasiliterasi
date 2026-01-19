import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Detail buku
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: params.id },
    })

    if (!book) {
      return NextResponse.json(
        { error: "Buku tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error("Error fetching book:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data buku" },
      { status: 500 }
    )
  }
}

// PUT - Update buku (admin bisa edit buku dari semua user)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, author, isbn, description, coverImage } = body

    // Validasi
    if (!title || !author) {
      return NextResponse.json(
        { error: "Judul dan penulis wajib diisi" },
        { status: 400 }
      )
    }

    // Cek apakah buku ada
    const currentBook = await prisma.book.findUnique({
      where: { id: params.id },
    })

    if (!currentBook) {
      return NextResponse.json(
        { error: "Buku tidak ditemukan" },
        { status: 404 }
      )
    }

    // Update buku (stock dan available dihitung dari UserBook, tidak disimpan di Book)
    const book = await prisma.book.update({
      where: { id: params.id },
      data: {
        title,
        author,
        isbn: isbn || null,
        description: description || null,
        coverImage: coverImage || null,
      },
    })

    return NextResponse.json(book)
  } catch (error: any) {
    console.error("Error updating book:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Buku tidak ditemukan" },
        { status: 404 }
      )
    }

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "ISBN sudah terdaftar" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal mengupdate buku" },
      { status: 500 }
    )
  }
}

// DELETE - Hapus buku
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Cek apakah ada peminjaman aktif
    const activeBorrows = await prisma.borrow.count({
      where: {
        bookId: params.id,
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

    await prisma.book.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Buku berhasil dihapus" })
  } catch (error: any) {
    console.error("Error deleting book:", error)
    
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Buku tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Gagal menghapus buku" },
      { status: 500 }
    )
  }
}
