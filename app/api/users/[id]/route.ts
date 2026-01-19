import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

// GET - Get user profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        location: true,
        socialMedia: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Gagal mengambil profil user" },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { email, profileImage, bio, location, socialMedia } = body

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    const updateData: any = {}

    // Handle email update
    if (email !== undefined) {
      const trimmedEmail = email.trim()
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        return NextResponse.json(
          { error: "Format email tidak valid" },
          { status: 400 }
        )
      }

      // Check if email is already taken by another user
      if (trimmedEmail !== user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: trimmedEmail },
        })

        if (existingUser) {
          return NextResponse.json(
            { error: "Email sudah digunakan oleh user lain" },
            { status: 400 }
          )
        }
      }

      updateData.email = trimmedEmail
    }

    if (profileImage !== undefined) {
      updateData.profileImage = profileImage && profileImage.trim() !== "" ? profileImage.trim() : null
    }

    if (bio !== undefined) {
      updateData.bio = bio && bio.trim() !== "" ? bio.trim() : null
    }

    if (location !== undefined) {
      updateData.location = location && location.trim() !== "" ? location.trim() : null
    }

    if (socialMedia !== undefined) {
      // Accept both object and string
      if (socialMedia) {
        if (typeof socialMedia === "object") {
          // If it's an object, stringify it
          updateData.socialMedia = JSON.stringify(socialMedia)
        } else if (typeof socialMedia === "string" && socialMedia.trim() !== "") {
          // If it's a string, validate it's valid JSON
          try {
            JSON.parse(socialMedia) // Validate it's valid JSON
            updateData.socialMedia = socialMedia.trim()
          } catch (e) {
            return NextResponse.json(
              { error: "Format social media tidak valid (harus JSON)" },
              { status: 400 }
            )
          }
        } else {
          updateData.socialMedia = null
        }
      } else {
        updateData.socialMedia = null
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        location: true,
        socialMedia: true,
        createdAt: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error("Error updating user profile:", error)

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      )
    }

    // Handle unique constraint violation (duplicate email)
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return NextResponse.json(
        { error: "Email sudah digunakan oleh user lain" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Gagal mengupdate profil user" },
      { status: 500 }
    )
  }
}
