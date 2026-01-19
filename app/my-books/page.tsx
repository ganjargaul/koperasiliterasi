"use client"

import { useState, useEffect } from "react"
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AddBookForm } from "@/components/user/add-book-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

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
}

export default function MyBooksPage() {
  const [userBooks, setUserBooks] = useState<UserBook[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editAuthor, setEditAuthor] = useState("")
  const [editIsbn, setEditIsbn] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCoverImage, setEditCoverImage] = useState("")
  const [editCondition, setEditCondition] = useState("baik")
  const [editLocation, setEditLocation] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  // Get userId from localStorage (from login)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      if (storedUserId) {
        setUserId(storedUserId)
      } else {
        // If no userId, redirect to landing page
        window.location.href = "/landing"
      }
    }
  }, [])

  const fetchUserBooks = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/user-books?userId=${userId}`)
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setUserBooks(data)
    } catch (error) {
      console.error("Error fetching user books:", error)
      alert("Gagal mengambil koleksi buku")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchUserBooks()
    }
  }, [userId])

  const handleEdit = async (book: UserBook) => {
    setSelectedBook(book)
    setEditTitle(book.book.title)
    setEditAuthor(book.book.author)
    setEditIsbn(book.book.isbn || "")
    setEditCoverImage(book.coverImage || book.book.coverImage || "")
    setEditCondition(book.condition || "baik")
    setImageFile(null)
    setImagePreview(book.coverImage || book.book.coverImage || null)
    
    // Fetch full book data to get description and location
    try {
      const response = await fetch(`/api/user-books/${book.id}`)
      if (response.ok) {
        const fullData = await response.json()
        setEditDescription(fullData.book?.description || "")
        setEditLocation(fullData.location || "")
      } else {
        // Fallback to empty if fetch fails
        setEditDescription("")
        setEditLocation("")
      }
    } catch (error) {
      console.error("Error fetching book details:", error)
      setEditDescription("")
      setEditLocation("")
    }
    
    setEditDialogOpen(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('File harus berupa gambar')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }
      setImageFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleUpdate = async () => {
    if (!selectedBook) return

    // Validate required fields
    if (!editTitle || editTitle.trim() === "") {
      alert("Judul buku tidak boleh kosong")
      return
    }

    if (!editAuthor || editAuthor.trim() === "") {
      alert("Penulis tidak boleh kosong")
      return
    }

    if (!editLocation || editLocation.trim() === "") {
      alert("Lokasi/Kota wajib diisi")
      return
    }

    try {
      // Prepare request body
      const requestBody: any = {
        // Book information - always send these fields
        title: editTitle.trim(),
        author: editAuthor.trim(),
        isbn: editIsbn.trim() || null,
        description: editDescription.trim() || null,
        // UserBook information
        condition: editCondition,
        location: editLocation.trim() || null,
      }

      // Handle coverImage - always include it
      if (imageFile) {
        // Convert image to base64 if new image is selected
        const coverImageBase64 = await convertImageToBase64(imageFile)
        requestBody.coverImage = coverImageBase64
      } else {
        // Send current coverImage value (could be URL or existing base64)
        // If editCoverImage is set, use it; otherwise keep the current value
        const currentCoverImage = selectedBook.coverImage || selectedBook.book.coverImage || null
        if (editCoverImage && editCoverImage.trim() !== "") {
          requestBody.coverImage = editCoverImage.trim()
        } else if (currentCoverImage) {
          requestBody.coverImage = currentCoverImage
        } else {
          requestBody.coverImage = null
        }
      }

      const response = await fetch(`/api/user-books/${selectedBook.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const error = await response.json()
        const errorMessage = error.details 
          ? `${error.error}\n\nDetail: ${error.details}`
          : error.error || "Gagal mengupdate buku"
        alert(errorMessage)
        return
      }

      setEditDialogOpen(false)
      setSelectedBook(null)
      setImageFile(null)
      setImagePreview(null)
      fetchUserBooks()
    } catch (error: any) {
      console.error("Error updating book:", error)
      alert(`Terjadi kesalahan: ${error.message || "Unknown error"}`)
    }
  }

  const handleToggleAvailability = async (book: UserBook) => {
    try {
      const response = await fetch(`/api/user-books/${book.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isAvailable: !book.isAvailable,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal mengupdate status")
        return
      }

      fetchUserBooks()
    } catch (error) {
      console.error("Error updating availability:", error)
      alert("Terjadi kesalahan")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus buku ini dari koleksi?")) {
      return
    }

    try {
      const response = await fetch(`/api/user-books/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal menghapus buku")
        return
      }

      fetchUserBooks()
    } catch (error) {
      console.error("Error deleting book:", error)
      alert("Terjadi kesalahan")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Koleksi Buku Saya</h1>
          <p className="text-muted-foreground">
            Kelola koleksi buku pribadi Anda
          </p>
        </div>
        <Button 
          onClick={() => {
            if (!userId) {
              alert("Anda harus login untuk menambahkan buku. Silakan login terlebih dahulu.")
              return
            }
            setFormOpen(true)
          }}
          disabled={!userId}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Buku
        </Button>
      </div>

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
                Belum ada koleksi buku
              </h3>
              <p className="text-muted-foreground mb-4">
                Mulai dengan menambahkan buku pertama Anda
              </p>
              <Button 
                onClick={() => {
                  if (!userId) {
                    alert("Anda harus login untuk menambahkan buku. Silakan login terlebih dahulu.")
                    return
                  }
                  setFormOpen(true)
                }}
                disabled={!userId}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Buku Pertama
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userBooks.map((userBook) => (
            <Card key={userBook.id} className="flex flex-col">
              <div className="relative w-full h-48 bg-muted">
                {userBook.coverImage || userBook.book.coverImage ? (
                  <img
                    src={userBook.coverImage || userBook.book.coverImage || ''}
                    alt={userBook.book.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {!userBook.isAvailable && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                    <Badge variant="secondary">Tidak Tersedia</Badge>
                  </div>
                )}
              </div>
              <CardHeader className="flex-1">
                <CardTitle className="line-clamp-2">{userBook.book.title}</CardTitle>
                <CardDescription>{userBook.book.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {userBook.book.isbn && (
                    <p className="text-muted-foreground">
                      ISBN: {userBook.book.isbn}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Kondisi:</span>
                    <Badge variant="outline">{userBook.condition || "Baik"}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={userBook.isAvailable ? "default" : "secondary"}>
                      {userBook.isAvailable ? "Tersedia" : "Tidak Tersedia"}
                    </Badge>
                  </div>
                  {userBook.location && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Lokasi:</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        📍 {userBook.location}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleAvailability(userBook)}
                  className="flex-1"
                >
                  {userBook.isAvailable ? (
                    <>
                      <EyeOff className="mr-2 h-4 w-4" />
                      tidak tersedia
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-4 w-4" />
                      Tampilkan
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(userBook)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(userBook.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {userId && (
        <AddBookForm
          open={formOpen}
          onOpenChange={setFormOpen}
          userId={userId}
          onSuccess={fetchUserBooks}
        />
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Buku</DialogTitle>
            <DialogDescription>
              Ubah informasi tentang buku ini
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Foto Cover */}
            <div>
              <Label htmlFor="edit-cover-image">Foto Cover Buku</Label>
              {imagePreview && (
                <div className="mb-2">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded border"
                  />
                </div>
              )}
              <Input
                id="edit-cover-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Pilih gambar baru atau biarkan kosong untuk menggunakan foto yang ada
              </p>
            </div>

            {/* Judul */}
            <div>
              <Label htmlFor="edit-title">Judul Buku <span className="text-destructive">*</span></Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Masukkan judul buku"
                required
              />
            </div>

            {/* Penulis */}
            <div>
              <Label htmlFor="edit-author">Penulis <span className="text-destructive">*</span></Label>
              <Input
                id="edit-author"
                value={editAuthor}
                onChange={(e) => setEditAuthor(e.target.value)}
                placeholder="Masukkan nama penulis"
                required
              />
            </div>

            {/* ISBN */}
            <div>
              <Label htmlFor="edit-isbn">ISBN</Label>
              <Input
                id="edit-isbn"
                value={editIsbn}
                onChange={(e) => setEditIsbn(e.target.value)}
                placeholder="Masukkan ISBN (opsional)"
              />
            </div>

            {/* Deskripsi */}
            <div>
              <Label htmlFor="edit-description">Deskripsi</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Masukkan deskripsi buku (opsional)"
                rows={4}
              />
            </div>

            {/* Kondisi */}
            <div>
              <Label htmlFor="edit-condition">Kondisi Buku</Label>
              <Select value={editCondition} onValueChange={setEditCondition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baik">Baik</SelectItem>
                  <SelectItem value="sedang">Sedang</SelectItem>
                  <SelectItem value="rusak">Rusak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lokasi */}
            <div>
              <Label htmlFor="edit-location">Lokasi/Kota <span className="text-destructive">*</span></Label>
              <Input
                id="edit-location"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Contoh: Jakarta, Bandung, Surabaya..."
                required
              />
            </div>

          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false)
                setImageFile(null)
                setImagePreview(null)
              }}
            >
              Batal
            </Button>
            <Button onClick={handleUpdate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
