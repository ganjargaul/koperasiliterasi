"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { BookOpen, User, MapPin } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BorrowButton } from "@/components/catalog/borrow-button"
import { UserProfile } from "@/components/user/user-profile"

interface UserBook {
  id: string
  userId: string
  bookId: string
  isAvailable: boolean
  condition: string | null
  location: string | null
  coverImage: string | null
  createdAt: string
  book: {
    id: string
    title: string
    author: string
    isbn: string | null
    coverImage: string | null
    description: string | null
  }
  user: {
    id: string
    name: string
    email: string
    profileImage?: string | null
    bio?: string | null
    location?: string | null
    socialMedia?: string | null
  }
}

export default function UserBooksPage() {
  const params = useParams()
  const userId = params.id as string
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [filterAvailable, setFilterAvailable] = useState("all")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const fetchUserBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/users/${userId}/books?available=${filterAvailable}`
      )
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setUserBooks(data)
      
      // Get user profile from first book or fetch separately
      if (data.length > 0 && data[0].user) {
        setUserProfile(data[0].user)
      } else {
        // Fetch user profile separately
        const profileResponse = await fetch(`/api/users/${userId}`)
        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserProfile(profileData)
        }
      }
    } catch (error) {
      console.error("Error fetching user books:", error)
      alert("Gagal mengambil koleksi buku")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUserId(localStorage.getItem("userId"))
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchUserBooks()
    }
  }, [userId, filterAvailable])

  if (!userId) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">User ID tidak valid</p>
      </div>
    )
  }

  const ownerName = userProfile?.name || userBooks[0]?.user?.name || "User"
  const totalBooks = userBooks.length
  const availableBooks = userBooks.filter(ub => ub.isAvailable).length

  return (
    <div className="space-y-6">
      {/* User Profile */}
      {userProfile && (
        <UserProfile
          userId={userProfile.id}
          name={userProfile.name}
          email={userProfile.email}
          profileImage={userProfile.profileImage}
          bio={userProfile.bio}
          location={userProfile.location}
          socialMedia={userProfile.socialMedia}
          isOwnProfile={currentUserId === userId}
          totalBooks={totalBooks}
          availableBooks={availableBooks}
        />
      )}
      
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Koleksi Buku {ownerName}
        </h1>
        <p className="text-muted-foreground">
          Jelajahi koleksi buku yang tersedia untuk dipinjam
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <Select value={filterAvailable} onValueChange={setFilterAvailable}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Buku</SelectItem>
                <SelectItem value="true">Tersedia</SelectItem>
                <SelectItem value="false">Sedang Dipinjam</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              Total: {userBooks.length} buku
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : userBooks.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Tidak ada koleksi buku
              </h3>
              <p className="text-muted-foreground">
                {filterAvailable === "true"
                  ? "Tidak ada buku yang tersedia untuk dipinjam"
                  : "User ini belum memiliki koleksi buku"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userBooks.map((userBook) => {
            const coverImage = userBook.coverImage || userBook.book.coverImage
            const isOwnCollection = currentUserId === userId
            
            return (
              <Card key={userBook.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                <div className="relative w-full h-64 bg-muted rounded-t-lg overflow-hidden">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={userBook.book.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  {!userBook.isAvailable && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-t-lg">
                      <Badge variant="secondary">Sedang Dipinjam</Badge>
                    </div>
                  )}
                </div>
                <CardHeader className="flex-1">
                  <CardTitle className="line-clamp-2 text-lg">
                    {userBook.book.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {userBook.book.author}
                  </CardDescription>
                </CardHeader>
                {userBook.book.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {userBook.book.description}
                    </p>
                  </CardContent>
                )}
                <CardFooter className="flex flex-col gap-3 pt-4 border-t">
                  <div className="flex flex-col gap-2 text-sm w-full">
                    {userBook.book.isbn && (
                      <p className="text-xs text-muted-foreground">
                        ISBN: {userBook.book.isbn}
                      </p>
                    )}
                    {userBook.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-500" />
                        <span className="text-muted-foreground">Lokasi:</span>
                        <Badge variant="secondary">{userBook.location}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Kondisi:</span>
                      <Badge variant="outline">
                        {userBook.condition || "Baik"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={userBook.isAvailable ? "default" : "secondary"}>
                        {userBook.isAvailable ? "Tersedia" : "Sedang Dipinjam"}
                      </Badge>
                    </div>
                  </div>
                  {!isOwnCollection && (
                    <div className="w-full">
                      {userBook.isAvailable ? (
                        <BorrowButton
                          bookId={userBook.bookId}
                          bookTitle={userBook.book.title}
                          available={1}
                          unavailable={0}
                          locations={[{
                            location: userBook.location || "Lokasi tidak diketahui",
                            count: 1,
                            unavailableCount: 0,
                            owners: [{
                              id: userBook.userId,
                              name: userBook.user.name,
                              userBookId: userBook.id,
                              isAvailable: true,
                            }]
                          }]}
                        />
                      ) : (
                        <BorrowButton
                          bookId={userBook.bookId}
                          bookTitle={userBook.book.title}
                          available={0}
                          unavailable={1}
                          locations={[{
                            location: userBook.location || "Lokasi tidak diketahui",
                            count: 1,
                            unavailableCount: 1,
                            owners: [{
                              id: userBook.userId,
                              name: userBook.user.name,
                              userBookId: userBook.id,
                              isAvailable: false,
                            }]
                          }]}
                        />
                      )}
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
