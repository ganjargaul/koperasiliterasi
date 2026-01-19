import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Get tracking statistics
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    const where: any = {}
    if (userId) {
      where.userId = userId
    }

    // Get all borrows
    const allBorrows = await prisma.borrow.findMany({
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
    })

    // Calculate statistics
    const now = new Date()
    
    // Calculate late penalty: Rp 5,000 per hari keterlambatan
    const PENALTY_PER_DAY = 5000
    
    // Calculate total late penalty from overdue borrows
    const totalLatePenalty = allBorrows.reduce((sum, b) => {
      if (b.status === "APPROVED" && b.dueDate) {
        const due = new Date(b.dueDate)
        if (due < now) {
          const daysOverdue = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
          return sum + (daysOverdue * PENALTY_PER_DAY)
        }
      }
      return sum
    }, 0)
    
    const stats = {
      total: allBorrows.length,
      pending: allBorrows.filter((b) => b.status === "PENDING").length,
      approved: allBorrows.filter((b) => b.status === "APPROVED").length,
      returned: allBorrows.filter((b) => b.status === "RETURNED").length,
      rejected: allBorrows.filter((b) => b.status === "REJECTED").length,
      overdue: allBorrows.filter((b) => {
        // Overdue = APPROVED dan sudah melewati dueDate
        return b.status === "APPROVED" && b.dueDate && new Date(b.dueDate) < now
      }).length,
      dueSoon: allBorrows.filter((b) => {
        if (b.status !== "APPROVED" || !b.dueDate) return false
        const due = new Date(b.dueDate)
        const daysUntilDue = Math.ceil(
          (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilDue <= 3 && daysUntilDue > 0
      }).length,
      totalLatePenalty,
    }

    // Get overdue and due soon books with late penalty calculated
    const overdueBooks = allBorrows
      .filter((b) => {
        return b.status === "APPROVED" && b.dueDate && new Date(b.dueDate) < now
      })
      .map((b) => {
        const due = new Date(b.dueDate!)
        const daysOverdue = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
        return {
          ...b,
          latePenalty: daysOverdue * PENALTY_PER_DAY,
        }
      })
    
    const dueSoonBooks = allBorrows
      .filter((b) => {
        if (b.status !== "APPROVED" || !b.dueDate) return false
        const due = new Date(b.dueDate)
        const daysUntilDue = Math.ceil(
          (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        )
        return daysUntilDue <= 3 && daysUntilDue > 0
      })
      .map((b) => ({
        ...b,
        latePenalty: 0, // No penalty yet for due soon books
      }))

    return NextResponse.json({
      stats,
      overdueBooks,
      dueSoonBooks,
    })
  } catch (error) {
    console.error("Error getting tracking data:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data tracking" },
      { status: 500 }
    )
  }
}

