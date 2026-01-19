"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Loader2, BookMarked, Edit, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserProfile } from "@/components/user/user-profile"
import Link from "next/link"

interface UserProfileData {
  id: string
  name: string
  email: string
  profileImage?: string | null
  bio?: string | null
  location?: string | null
  socialMedia?: string | null
  createdAt: string
}

interface UserBook {
  id: string
  isAvailable: boolean
  book: {
    id: string
    title: string
    author: string
    coverImage?: string | null
  }
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null)
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    borrowedBooks: 0,
    totalBorrows: 0,
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      if (!storedUserId) {
        router.push("/landing")
        return
      }
      setUserId(storedUserId)
      fetchProfileData(storedUserId)
    }
  }, [router])

  const fetchProfileData = async (id: string) => {
    try {
      setLoading(true)
      
      // Fetch user profile
      const profileResponse = await fetch(`/api/users/${id}`)
      if (!profileResponse.ok) throw new Error("Gagal mengambil profil")
      const profileData = await profileResponse.json()
      setUserProfile(profileData)

      // Fetch user books
      const booksResponse = await fetch(`/api/users/${id}/books?available=all`)
      if (booksResponse.ok) {
        const booksData = await booksResponse.json()
        setUserBooks(booksData)
        
        const totalBooks = booksData.length
        const availableBooks = booksData.filter((ub: UserBook) => ub.isAvailable).length
        const borrowedBooks = totalBooks - availableBooks
        
        setStats({
          totalBooks,
          availableBooks,
          borrowedBooks,
          totalBorrows: 0, // Will be fetched separately if needed
        })
      }

      // Fetch borrow statistics (books borrowed by this user)
      const borrowsResponse = await fetch(`/api/borrows?userId=${id}`)
      if (borrowsResponse.ok) {
        const borrowsData = await borrowsResponse.json()
        const totalBorrows = borrowsData.filter((b: any) => 
          b.status === "APPROVED" || b.status === "RETURNED"
        ).length || 0
        setStats(prev => ({ ...prev, totalBorrows }))
      }
    } catch (error) {
      console.error("Error fetching profile data:", error)
      alert("Gagal mengambil data profil")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!userProfile || !userId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Profil tidak ditemukan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const recentBooks = userBooks.slice(0, 6)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <UserProfile
        userId={userProfile.id}
        name={userProfile.name}
        email={userProfile.email}
        profileImage={userProfile.profileImage}
        bio={userProfile.bio}
        location={userProfile.location}
        socialMedia={userProfile.socialMedia}
        isOwnProfile={true}
        totalBooks={stats.totalBooks}
        availableBooks={stats.availableBooks}
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Buku</p>
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tersedia</p>
                <p className="text-2xl font-bold text-green-600">{stats.availableBooks}</p>
              </div>
              <BookMarked className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Sedang Dipinjam</p>
                <p className="text-2xl font-bold text-orange-600">{stats.borrowedBooks}</p>
              </div>
              <BookOpen className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Dipinjam</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalBorrows}</p>
              </div>
              <BookMarked className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Books */}
      {recentBooks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Buku Terbaru</CardTitle>
                <CardDescription>
                  Buku-buku terbaru dalam koleksi Anda
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/my-books">
                  Lihat Semua
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recentBooks.map((userBook) => {
                const coverImage = userBook.book.coverImage
                return (
                  <Link
                    key={userBook.id}
                    href="/my-books"
                    className="group relative aspect-[2/3] bg-muted rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={userBook.book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {!userBook.isAvailable && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-xs text-white font-medium">Dipinjam</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Koleksi Buku</CardTitle>
            <CardDescription>
              Kelola koleksi buku Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/my-books">
                <BookMarked className="h-4 w-4 mr-2" />
                Lihat Koleksi Saya
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profil</CardTitle>
            <CardDescription>
              Perbarui informasi profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/profile/edit">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
