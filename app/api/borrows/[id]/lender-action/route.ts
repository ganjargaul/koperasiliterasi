import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// PUT - Lender approve/reject/return their book
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { action, lenderId } = body

    if (!lenderId) {
      return NextResponse.json(
        { error: "Lender ID is required" },
        { status: 400 }
      )
    }

    const borrow = await prisma.borrow.findUnique({
      where: { id: params.id },
      include: {
        book: true,
        userBook: true,
      },
    })

    if (!borrow) {
      return NextResponse.json(
        { error: "Data peminjaman tidak ditemukan" },
        { status: 404 }
      )
    }

    // Verify that the lender is the owner
    if (borrow.lenderId !== lenderId) {
      return NextResponse.json(
        { error: "Anda tidak memiliki izin untuk aksi ini" },
        { status: 403 }
      )
    }

    let updateData: any = {}

    if (action === "approve") {
      if (borrow.status !== "PENDING") {
        return NextResponse.json(
          { error: "Hanya request pending yang bisa di-approve" },
          { status: 400 }
        )
      }

      // Check if book is still available
      if (!borrow.userBookId) {
        return NextResponse.json(
          { error: "UserBook ID tidak ditemukan" },
          { status: 400 }
        )
      }

      const userBook = await prisma.userBook.findUnique({
        where: { id: borrow.userBookId },
      })

      if (!userBook || !userBook.isAvailable) {
        return NextResponse.json(
          { error: "Buku tidak tersedia" },
          { status: 400 }
        )
      }

      // Mark as unavailable
      await prisma.userBook.update({
        where: { id: borrow.userBookId },
        data: { isAvailable: false },
      })

      const borrowDate = new Date()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // 7 hari

      updateData = {
        status: "APPROVED",
        borrowDate,
        dueDate,
      }
    } else if (action === "reject") {
      if (borrow.status !== "PENDING") {
        return NextResponse.json(
          { error: "Hanya request pending yang bisa di-reject" },
          { status: 400 }
        )
      }

      updateData = {
        status: "REJECTED",
      }
    } else if (action === "return") {
      if (borrow.status !== "APPROVED") {
        return NextResponse.json(
          { error: "Hanya peminjaman yang approved yang bisa dikembalikan" },
          { status: 400 }
        )
      }

      if (!borrow.userBookId) {
        return NextResponse.json(
          { error: "UserBook ID tidak ditemukan" },
          { status: 400 }
        )
      }

      updateData = {
        status: "RETURNED",
        returnDate: new Date(),
      }

      // Mark book as available again
      await prisma.userBook.update({
        where: { id: borrow.userBookId },
        data: { isAvailable: true },
      })

      // Auto-approve waiting list pertama untuk userBook ini
      const firstWaitingList = await prisma.borrow.findFirst({
        where: {
          userBookId: borrow.userBookId,
          status: "PENDING",
        },
        orderBy: {
          createdAt: "asc", // First come first served
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      if (firstWaitingList) {
        // Auto-approve waiting list
        const borrowDate = new Date()
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 7) // 7 hari

        await prisma.borrow.update({
          where: { id: firstWaitingList.id },
          data: {
            status: "APPROVED",
            borrowDate,
            dueDate,
          },
        })

        // Mark book as unavailable again (karena langsung dipinjam oleh waiting list)
        await prisma.userBook.update({
          where: { id: borrow.userBookId },
          data: { isAvailable: false },
        })
      }
    } else {
      return NextResponse.json(
        { error: "Action tidak valid" },
        { status: 400 }
      )
    }

    const updatedBorrow = await prisma.borrow.update({
      where: { id: params.id },
      data: updateData,
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
    })

    return NextResponse.json(updatedBorrow)
  } catch (error: any) {
    console.error("Error processing lender action:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Data peminjaman tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Gagal memproses aksi" },
      { status: 500 }
    )
  }
}
