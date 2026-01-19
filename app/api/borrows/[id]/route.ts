import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Detail borrow
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const borrow = await prisma.borrow.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        book: true,
      },
    })

    if (!borrow) {
      return NextResponse.json(
        { error: "Data peminjaman tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(borrow)
  } catch (error) {
    console.error("Error fetching borrow:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data peminjaman" },
      { status: 500 }
    )
  }
}

// PUT - Update status borrow (approve/reject/return)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, action } = body

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

    let updateData: any = {}
    let bookUpdateData: any = {}

    if (action === "approve") {
      // Approve: set status APPROVED, set borrowDate dan dueDate
      if (borrow.status !== "PENDING") {
        return NextResponse.json(
          { error: "Hanya request pending yang bisa di-approve" },
          { status: 400 }
        )
      }

      // Cek userBook masih available
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

      const borrowDate = new Date()
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7) // 7 hari dari sekarang

      updateData = {
        status: "APPROVED",
        borrowDate,
        dueDate,
      }

      // Mark userBook as unavailable
      await prisma.userBook.update({
        where: { id: borrow.userBookId },
        data: { isAvailable: false },
      })
    } else if (action === "reject") {
      // Reject: set status REJECTED
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
      // Return: set status RETURNED, set returnDate
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

      // Mark userBook as available again
      await prisma.userBook.update({
        where: { id: borrow.userBookId },
        data: { isAvailable: true },
      })
    } else if (status) {
      // Direct status update
      updateData = { status }
    } else {
      return NextResponse.json(
        { error: "Action atau status harus diisi" },
        { status: 400 }
      )
    }

    // Update borrow
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
              },
            },
          },
        },
      },
    })

    return NextResponse.json(updatedBorrow)
  } catch (error: any) {
    console.error("Error updating borrow:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Data peminjaman tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: "Gagal mengupdate peminjaman" },
      { status: 500 }
    )
  }
}
