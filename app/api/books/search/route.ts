import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

// GET - Search book by ISBN using Open Library API
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const isbn = searchParams.get("isbn")

    if (!isbn) {
      return NextResponse.json(
        { error: "ISBN is required" },
        { status: 400 }
      )
    }

    // Clean ISBN (remove dashes and spaces)
    const cleanIsbn = isbn.replace(/[-\s]/g, "")

    // Try Open Library API first
    try {
      const openLibraryResponse = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`
      )

      if (openLibraryResponse.ok) {
        const data = await openLibraryResponse.json()
        const bookKey = `ISBN:${cleanIsbn}`
        const bookData = data[bookKey]

        if (bookData) {
          return NextResponse.json({
            title: bookData.title || "",
            author:
              bookData.authors?.[0]?.name || bookData.authors?.[0] || "Unknown",
            isbn: cleanIsbn,
            description: bookData.subtitle || "",
            coverImage:
              bookData.cover?.large ||
              bookData.cover?.medium ||
              bookData.cover?.small ||
              null,
            publisher: bookData.publishers?.[0]?.name || null,
            publishDate: bookData.publish_date || null,
          })
        }
      }
    } catch (error) {
      console.error("Open Library API error:", error)
    }

    // Fallback: Try Google Books API
    try {
      const googleResponse = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}`
      )

      if (googleResponse.ok) {
        const data = await googleResponse.json()

        if (data.items && data.items.length > 0) {
          const volume = data.items[0].volumeInfo

          return NextResponse.json({
            title: volume.title || "",
            author: volume.authors?.[0] || "Unknown",
            isbn: cleanIsbn,
            description: volume.description || "",
            coverImage:
              volume.imageLinks?.thumbnail ||
              volume.imageLinks?.smallThumbnail ||
              null,
            publisher: volume.publisher || null,
            publishDate: volume.publishedDate || null,
          })
        }
      }
    } catch (error) {
      console.error("Google Books API error:", error)
    }

    // If both APIs fail, return error
    return NextResponse.json(
      { error: "Buku tidak ditemukan. Pastikan ISBN valid." },
      { status: 404 }
    )
  } catch (error) {
    console.error("Error searching book:", error)
    return NextResponse.json(
      { error: "Gagal mencari buku" },
      { status: 500 }
    )
  }
}
