"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, BookOpen, FileText, TrendingUp, AlertCircle, Users, Shield, User } from "lucide-react"
import { AddBookForm } from "@/components/user/add-book-form"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BookForm } from "@/components/admin/book-form"
import Link from "next/link"

interface BookOwner {
  userId: string
  userName: string
  userEmail: string
  userBookId: string
  isAvailable: boolean
  location: string | null
}

interface Book {
  id: string
  title: string
  author: string
  isbn?: string | null
  description?: string | null
  coverImage?: string | null
  stock: number
  available: number
  createdAt: string
  updatedAt: string
  owners?: BookOwner[]
}

interface User {
  id: string
  name: string
  email: string
  role: "ADMIN" | "USER"
  createdAt: string
  _count: {
    userBooks: number
    borrows: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [addBookOpen, setAddBookOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeTab, setActiveTab] = useState("books")
  const [userId, setUserId] = useState<string | null>(null)

  const fetchBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/books/admin")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setBooks(data)
    } catch (error) {
      console.error("Error fetching books:", error)
      alert("Gagal mengambil data buku")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setUsersLoading(true)
      const response = await fetch("/api/users")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error("Error fetching users:", error)
      alert("Gagal mengambil data user")
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    // Check if user is admin
    if (typeof window !== "undefined") {
      const userRole = localStorage.getItem("userRole")
      const userId = localStorage.getItem("userId")
      
      if (!userId) {
        // User not logged in, redirect to admin login
        router.push("/admin/login")
        return
      }
      
      setUserId(userId)
      
      if (userRole !== "ADMIN") {
        // User is not admin, redirect to catalog
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }
      
      // User is admin, allow access
      setIsAuthorized(true)
      setCheckingAuth(false)
      fetchBooks()
      fetchUsers()
    }
  }, [router])

  const handleCreate = () => {
    setAddBookOpen(true)
  }

  const handleEdit = (book: Book) => {
    setSelectedBook(book)
    setFormOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus buku ini?")) {
      return
    }

    try {
      const response = await fetch(`/api/books/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal menghapus buku")
        return
      }

      fetchBooks()
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Gagal menghapus buku")
    }
  }

  const handleRoleChange = async (userId: string, newRole: "ADMIN" | "USER") => {
    const roleText = newRole === "ADMIN" ? "administrator" : "user biasa"
    if (!confirm(`Apakah Anda yakin ingin mengubah role user ini menjadi ${roleText}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal mengubah role user")
        return
      }

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error("Error updating user role:", error)
      alert("Gagal mengubah role user")
    }
  }

  // Show loading while checking authorization
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    )
  }

  // Show unauthorized message if user is not admin
  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Akses Ditolak
            </CardTitle>
            <CardDescription>
              Halaman ini hanya dapat diakses oleh administrator.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={() => router.push("/admin/login")} className="w-full">
              Login sebagai Admin
            </Button>
            <Button 
              onClick={() => router.push("/catalog")} 
              variant="outline" 
              className="w-full"
            >
              Kembali ke Katalog
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">
            Kelola buku dan manajemen user
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/borrows">
              <FileText className="mr-2 h-4 w-4" />
              Manajemen Peminjaman
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/tracking">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tracking
            </Link>
          </Button>
          {activeTab === "books" && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Buku
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href="/admin/borrows">
              <FileText className="mr-2 h-4 w-4" />
              Peminjaman
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/tracking">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tracking
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="books">
            <BookOpen className="mr-2 h-4 w-4" />
            Daftar Buku
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Manajemen User
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Buku</CardTitle>
              <CardDescription>
                Total {books.length} buku terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Belum ada buku terdaftar
                  </p>
                  <Button onClick={handleCreate} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Buku Pertama
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Judul</TableHead>
                        <TableHead>Penulis</TableHead>
                        <TableHead>ISBN</TableHead>
                        <TableHead>Pemilik</TableHead>
                        <TableHead>Kota</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead>Tersedia</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">
                            {book.title}
                          </TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>{book.isbn || "-"}</TableCell>
                          <TableCell>
                            {book.owners && book.owners.length > 0 ? (
                              <div className="space-y-1">
                                {book.owners.map((owner, idx) => (
                                  <div key={owner.userBookId} className="text-sm">
                                    <span className="font-medium">{owner.userName}</span>
                                    {!owner.isAvailable && (
                                      <Badge variant="secondary" className="ml-2 text-xs">
                                        Dipinjam
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {book.owners && book.owners.length > 0 ? (
                              <div className="space-y-1">
                                {book.owners.map((owner) => (
                                  <div key={owner.userBookId} className="text-sm">
                                    {owner.location || (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{book.stock}</TableCell>
                          <TableCell>
                            <span
                              className={
                                book.available === 0
                                  ? "text-destructive font-medium"
                                  : ""
                              }
                            >
                              {book.available}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(book)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(book.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen User</CardTitle>
              <CardDescription>
                Kelola role user dan assign administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Belum ada user terdaftar</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Koleksi Buku</TableHead>
                        <TableHead>Total Peminjaman</TableHead>
                        <TableHead>Tanggal Daftar</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={user.role === "ADMIN" ? "default" : "secondary"}
                              className="flex items-center gap-1 w-fit"
                            >
                              {user.role === "ADMIN" ? (
                                <Shield className="h-3 w-3" />
                              ) : (
                                <User className="h-3 w-3" />
                              )}
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user._count.userBooks}</TableCell>
                          <TableCell>{user._count.borrows}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {user.role === "ADMIN" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, "USER")}
                                >
                                  <User className="mr-2 h-4 w-4" />
                                  Set User
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleRoleChange(user.id, "ADMIN")}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Set Admin
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddBookForm
        open={addBookOpen}
        onOpenChange={setAddBookOpen}
        userId={userId}
        onSuccess={() => {
          setAddBookOpen(false)
          fetchBooks()
        }}
      />

      <BookForm
        open={formOpen}
        onOpenChange={setFormOpen}
        book={selectedBook}
        onSuccess={fetchBooks}
      />
    </div>
  )
}
