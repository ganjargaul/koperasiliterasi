import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Get borrow requests for user's books (as lender)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lenderId = searchParams.get("lenderId")
    const countOnly = searchParams.get("countOnly") === "true"

    if (!lenderId) {
      return NextResponse.json(
        { error: "Lender ID is required" },
        { status: 400 }
      )
    }

    // If countOnly, just return the count of pending requests
    if (countOnly) {
      const pendingCount = await prisma.borrow.count({
        where: {
          lenderId,
          status: "PENDING",
        },
      })

      return NextResponse.json({ count: pendingCount })
    }

    // Get all borrows where user is the lender (buku mereka yang diminta)
    const borrows = await prisma.borrow.findMany({
      where: {
        lenderId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
      include: {
        user: {
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
    console.error("Error fetching lender requests:", error)
    return NextResponse.json(
      { error: "Gagal mengambil data request" },
      { status: 500 }
    )
  }
}
