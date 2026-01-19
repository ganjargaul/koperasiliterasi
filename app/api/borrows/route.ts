import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - List semua borrow requests (untuk admin) atau borrows user tertentu
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const lenderId = searchParams.get("lenderId")
    const status = searchParams.get("status")

    const where: any = {}
    if (userId) {
      where.userId = userId
    }
    if (lenderId) {
      where.lenderId = lenderId
    }
    if (status) {
      where.status = status
    }

    const borrows = await prisma.borrow.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        book: true,
        userBook: {
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

    return NextResponse.json(borrows)
  } catch (error) {
    console.error("Error fetching borrows:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data peminjaman" },
      { status: 500 }
    )
  }
}

// POST - Request pinjam buku
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, bookId, lenderId, userBookId, location, isWaitingList } = body

    // Validasi - userId dan bookId wajib diisi
    if (!userId || !bookId) {
      return NextResponse.json(
        { error: "User ID dan Book ID wajib diisi" },
        { status: 400 }
      )
    }

    let targetUserBook

    // Jika userBookId diberikan, gunakan yang spesifik
    if (userBookId && lenderId) {
      targetUserBook = await prisma.userBook.findUnique({
        where: { id: userBookId },
        include: { book: true, user: true },
      })

      if (!targetUserBook) {
        return NextResponse.json(
          { error: "Buku tidak ditemukan" },
          { status: 404 }
        )
      }

      if (!targetUserBook.isAvailable) {
        return NextResponse.json(
          { error: "Buku tidak tersedia untuk dipinjam" },
          { status: 400 }
        )
      }

      if (targetUserBook.userId !== lenderId) {
        return NextResponse.json(
          { error: "User tidak memiliki buku ini" },
          { status: 400 }
        )
      }

      // Validasi lokasi jika diberikan
      if (location && targetUserBook.location !== location) {
        return NextResponse.json(
          { error: "Buku tidak tersedia di lokasi yang dipilih" },
          { status: 400 }
        )
      }
    } else {
      // Jika userBookId tidak diberikan, cari copy yang sesuai (tersedia atau tidak tersedia untuk waiting list)
      const whereClause: any = {
        bookId,
        userId: {
          not: userId, // Tidak bisa meminjam dari diri sendiri
        },
      }

      // Untuk waiting list, cari yang tidak tersedia, untuk pinjam normal cari yang tersedia
      if (isWaitingList) {
        whereClause.isAvailable = false
      } else {
        whereClause.isAvailable = true
      }

      // Filter berdasarkan lokasi jika diberikan
      if (location) {
        whereClause.location = location
      }

      const userBooks = await prisma.userBook.findMany({
        where: whereClause,
        include: {
          book: true,
          user: true,
        },
      })

      if (userBooks.length === 0) {
        if (isWaitingList) {
          return NextResponse.json(
            { error: location 
              ? `Tidak ada copy buku yang sedang dipinjam di ${location} untuk waiting list`
              : "Tidak ada copy buku yang sedang dipinjam untuk waiting list" },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: location 
              ? `Tidak ada copy buku yang tersedia di ${location} untuk dipinjam`
              : "Tidak ada copy buku yang tersedia untuk dipinjam" },
            { status: 400 }
          )
        }
      }

      // Jika ada lenderId yang dipilih, cari yang sesuai
      if (lenderId) {
        const selectedBook = userBooks.find(ub => ub.userId === lenderId)
        if (selectedBook) {
          targetUserBook = selectedBook
        } else {
          return NextResponse.json(
            { error: isWaitingList 
              ? "Buku dari pemilik yang dipilih tidak sedang dipinjam"
              : "Buku dari pemilik yang dipilih tidak tersedia" },
            { status: 400 }
          )
        }
      } else {
        // Ambil yang pertama jika tidak ada pilihan spesifik
        targetUserBook = userBooks[0]
      }
    }

    // Validasi final
    if (targetUserBook.userId === userId) {
      return NextResponse.json(
        { error: "Anda tidak bisa meminjam buku sendiri" },
        { status: 400 }
      )
    }

    // Untuk waiting list, tidak perlu cek existing borrow (bisa ada multiple waiting list)
    // Untuk pinjam normal, cek apakah sudah ada request aktif
    if (!isWaitingList) {
      // Cek apakah sudah ada request aktif untuk userBook ini
      const existingBorrow = await prisma.borrow.findFirst({
        where: {
          userId,
          userBookId: targetUserBook.id,
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      })

      if (existingBorrow) {
        return NextResponse.json(
          { error: "Anda sudah meminjam buku ini atau request masih pending" },
          { status: 400 }
        )
      }

      // Cek apakah user sudah meminjam buku dengan judul yang sama (dari copy lain)
      const existingBorrowSameBook = await prisma.borrow.findFirst({
        where: {
          userId,
          bookId,
          status: {
            in: ["PENDING", "APPROVED"],
          },
        },
      })

      if (existingBorrowSameBook) {
        return NextResponse.json(
          { error: "Anda sudah meminjam buku dengan judul yang sama" },
          { status: 400 }
        )
      }
    } else {
      // Untuk waiting list, cek apakah sudah ada waiting list untuk userBook ini
      const existingWaitingList = await prisma.borrow.findFirst({
        where: {
          userId,
          userBookId: targetUserBook.id,
          status: "PENDING",
        },
      })

      if (existingWaitingList) {
        return NextResponse.json(
          { error: "Anda sudah ada di waiting list untuk buku ini" },
          { status: 400 }
        )
      }
    }

    // Buat request peminjaman
    const borrow = await prisma.borrow.create({
      data: {
        userId,
        bookId,
        userBookId: targetUserBook.id,
        lenderId: targetUserBook.userId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        book: true,
        userBook: {
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
    })

    return NextResponse.json(borrow, { status: 201 })
  } catch (error: any) {
    console.error("Error creating borrow:", error)
    return NextResponse.json(
      { error: "Gagal membuat request peminjaman" },
      { status: 500 }
    )
  }
}
