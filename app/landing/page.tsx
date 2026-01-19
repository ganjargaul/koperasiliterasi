"use client"

import { useState, useEffect } from "react"
import { BookOpen, Search, ArrowRight, Users, Library, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"

interface Book {
  id: string
  title: string
  author: string
  isbn?: string | null
  coverImage?: string | null
  stock: number
  available: number
}

interface UserBook {
  id: string
  bookId: string
  isAvailable: boolean
  book: {
    id: string
    title: string
    author: string
    coverImage: string | null
  }
  user: {
    id: string
    name: string
  }
}

export default function LandingPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)

  useEffect(() => {
    fetchBooks()
    fetchUserBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch("/api/books")
      if (response.ok) {
        const data = await response.json()
        setBooks(data.filter((b: Book) => b.available > 0).slice(0, 6))
      }
    } catch (error) {
      console.error("Error fetching books:", error)
    }
  }

  const fetchUserBooks = async () => {
    try {
      const response = await fetch("/api/user-books?available=true")
      if (response.ok) {
        const data = await response.json()
        setUserBooks(data.slice(0, 6))
      }
    } catch (error) {
      console.error("Error fetching user books:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      (book.isbn && book.isbn.toLowerCase().includes(query))
    )
  })

  const filteredUserBooks = userBooks.filter((userBook) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      userBook.book.title.toLowerCase().includes(query) ||
      userBook.book.author.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-foreground" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
              Perpustakaan Komunitas
              <br />
              <span className="text-foreground">Terdesentralisasi</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Pinjam dan pinjamkan buku dengan komunitas. Bangun perpustakaan
              bersama yang lebih besar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger asChild>
                  <Button size="lg">
                    Daftar Sekarang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <RegisterForm onSuccess={() => setRegisterOpen(false)} />
                </DialogContent>
              </Dialog>
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" variant="outline">
                    Masuk
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <LoginForm onSuccess={() => setLoginOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Library className="h-10 w-10 text-foreground mb-4" />
                <CardTitle>Koleksi Lengkap</CardTitle>
                <CardDescription>
                  Akses ribuan buku dari koleksi admin dan komunitas
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-foreground mb-4" />
                <CardTitle>Pinjam Antar User</CardTitle>
                <CardDescription>
                  Pinjam buku langsung dari koleksi user lain di komunitas
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-foreground mb-4" />
                <CardTitle>Tracking Real-time</CardTitle>
                <CardDescription>
                  Pantau status peminjaman, due dates, dan denda secara real-time
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Books Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">Jelajahi Koleksi</h2>
            <p className="text-muted-foreground mb-6">
              Temukan buku yang Anda cari dari koleksi perpustakaan
            </p>
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari buku, penulis, atau ISBN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Admin Books */}
          {filteredBooks.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Library className="h-5 w-5" />
                Dari Stok Perpustakaan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooks.map((book) => (
                  <Card key={book.id} className="flex flex-col">
                    <div className="relative w-full h-48 bg-muted">
                      {book.coverImage ? (
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-2">{book.title}</CardTitle>
                      <CardDescription>{book.author}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between">
                      <Badge variant="outline">
                        {book.available} tersedia
                      </Badge>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/">Lihat Detail</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* User Books */}
          {filteredUserBooks.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Dari Komunitas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUserBooks.map((userBook) => (
                  <Card key={userBook.id} className="flex flex-col">
                    <div className="relative w-full h-48 bg-muted">
                      {userBook.book.coverImage ? (
                        <img
                          src={userBook.book.coverImage}
                          alt={userBook.book.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-1">
                      <CardTitle className="line-clamp-2">
                        {userBook.book.title}
                      </CardTitle>
                      <CardDescription>{userBook.book.author}</CardDescription>
                    </CardHeader>
                    <CardFooter className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Dari: {userBook.user.name}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/users/${userBook.user.id}/books`}>
                          Lihat Detail
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {!loading && filteredBooks.length === 0 && filteredUserBooks.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? "Tidak ada buku ditemukan" : "Belum ada koleksi"}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Coba kata kunci lain"
                      : "Daftar sekarang untuk mulai menambahkan koleksi"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 text-center">
            <Button asChild size="lg" variant="outline">
              <Link href="/catalog">
                Lihat Semua Koleksi
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Bergabung dengan Komunitas
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Daftar sekarang untuk mulai meminjam dan meminjamkan buku dengan
            komunitas. Gratis dan mudah!
          </p>
          <div className="flex gap-4 justify-center">
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
              <DialogTrigger asChild>
                <Button size="lg">
                  Daftar Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <RegisterForm onSuccess={() => setRegisterOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button size="lg" variant="outline" asChild>
              <Link href="/catalog">Jelajahi Koleksi</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
