"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Keyboard, Search, Camera } from "lucide-react"
import { ISBNScanner } from "@/components/user/isbn-scanner"

interface BookData {
  title: string
  author: string
  isbn: string
  description?: string
  coverImage?: string
  publisher?: string
  publishDate?: string
}

interface AddBookFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onSuccess: () => void
}

export function AddBookForm({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: AddBookFormProps) {
  const [loading, setLoading] = useState(false)
  const [methodDialogOpen, setMethodDialogOpen] = useState(false)
  const [manualInputMode, setManualInputMode] = useState(false)
  const [isbnSearchMode, setIsbnSearchMode] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [isbnInput, setIsbnInput] = useState("")
  const [bookData, setBookData] = useState<BookData | null>(null)
  const [editableBookData, setEditableBookData] = useState<BookData | null>(null)
  const [condition, setCondition] = useState("baik")
  const [notes, setNotes] = useState("")
  const [location, setLocation] = useState("")
  const [manualFormData, setManualFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverImage: "",
  })

  useEffect(() => {
    if (open && !methodDialogOpen && !manualInputMode && !isbnSearchMode && !bookData) {
      setMethodDialogOpen(true)
    }
    if (!open) {
      // Reset all states when dialog closes
      setMethodDialogOpen(false)
      setManualInputMode(false)
      setIsbnSearchMode(false)
      setScannerOpen(false)
      setIsbnInput("")
      setBookData(null)
      setEditableBookData(null)
      setCondition("baik")
      setNotes("")
      setLocation("")
      setManualFormData({
        title: "",
        author: "",
        isbn: "",
        description: "",
        coverImage: "",
      })
    }
  }, [open])

  const handleIsbnSearch = async (isbn: string) => {
    if (!isbn || !isbn.trim()) {
      alert("ISBN tidak boleh kosong")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/books/search?isbn=${encodeURIComponent(isbn.trim())}`)
      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Buku tidak ditemukan")
        setLoading(false)
        return
      }

      const data = await response.json()
      setBookData(data)
      setEditableBookData(data)
      setIsbnSearchMode(false)
      setLoading(false)
    } catch (error) {
      console.error("Error searching book:", error)
      alert("Gagal mencari buku")
      setLoading(false)
    }
  }

  const handleManualInput = () => {
    setMethodDialogOpen(false)
    setManualInputMode(true)
  }

  const handleIsbnSearchMode = () => {
    setMethodDialogOpen(false)
    setIsbnSearchMode(true)
  }

  const handleCameraScanMode = () => {
    setMethodDialogOpen(false)
    setScannerOpen(true)
  }

  const handleScannerScan = async (scannedIsbn: string) => {
    setScannerOpen(false)
    setIsbnInput(scannedIsbn)
    setIsbnSearchMode(true)
    // Automatically search after scan
    await handleIsbnSearch(scannedIsbn)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use manual form data if in manual input mode, otherwise use editableBookData from search
    const dataToUse = manualInputMode ? {
      title: manualFormData.title,
      author: manualFormData.author,
      isbn: manualFormData.isbn,
      description: manualFormData.description,
      coverImage: manualFormData.coverImage,
    } : editableBookData

    if (!dataToUse || !dataToUse.title?.trim() || !dataToUse.author?.trim()) {
      alert("Judul dan penulis wajib diisi")
      return
    }

    // Validate location
    if (!location || location.trim() === "") {
      alert("Lokasi/Kota wajib diisi")
      return
    }

    // Get userId from localStorage if not provided
    const effectiveUserId = userId || (typeof window !== "undefined" ? localStorage.getItem("userId") : null)
    
    if (!effectiveUserId) {
      alert("Anda harus login untuk menambahkan buku. Silakan login terlebih dahulu.")
      return
    }

    setLoading(true)

    try {
      // First, create or find book
      let bookId: string
      
      try {
        const existingBookResponse = await fetch(`/api/books`)
        if (!existingBookResponse.ok) {
          throw new Error("Gagal mengambil data buku")
        }
        const existingBooks = await existingBookResponse.json()
        // Check by ISBN if available, otherwise check by title and author
        let existingBook = null
        if (dataToUse.isbn) {
          existingBook = existingBooks.find(
            (b: any) => b.isbn && b.isbn === dataToUse.isbn
          )
        }
        
        // If not found by ISBN, check by title and author
        if (!existingBook) {
          existingBook = existingBooks.find(
            (b: any) => 
              b.title?.toLowerCase() === dataToUse.title?.toLowerCase() &&
              b.author?.toLowerCase() === dataToUse.author?.toLowerCase()
          )
        }

        if (existingBook) {
          bookId = existingBook.id
        } else {
          // Create new book
          const createBookResponse = await fetch("/api/books", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: dataToUse.title,
              author: dataToUse.author,
              isbn: dataToUse.isbn || null,
              description: dataToUse.description || "",
              coverImage: dataToUse.coverImage || "",
            }),
          })

          if (!createBookResponse.ok) {
            const error = await createBookResponse.json()
            // If ISBN already exists, try to find it again
            if (error.error && error.error.includes("ISBN")) {
              const retryResponse = await fetch(`/api/books`)
              if (retryResponse.ok) {
                const retryBooks = await retryResponse.json()
                let retryBook = null
                if (dataToUse.isbn) {
                  retryBook = retryBooks.find(
                    (b: any) => b.isbn && b.isbn === dataToUse.isbn
                  )
                }
                if (!retryBook) {
                  retryBook = retryBooks.find(
                    (b: any) => 
                      b.title?.toLowerCase() === dataToUse.title?.toLowerCase() &&
                      b.author?.toLowerCase() === dataToUse.author?.toLowerCase()
                  )
                }
                if (retryBook) {
                  bookId = retryBook.id
                } else {
                  alert(error.error || "Gagal membuat buku")
                  setLoading(false)
                  return
                }
              } else {
                alert(error.error || "Gagal membuat buku")
                setLoading(false)
                return
              }
            } else {
              alert(error.error || "Gagal membuat buku")
              setLoading(false)
              return
            }
          } else {
            const newBook = await createBookResponse.json()
            bookId = newBook.id
          }
        }
      } catch (error: any) {
        console.error("Error finding/creating book:", error)
        alert(`Gagal memproses buku: ${error.message || "Unknown error"}`)
        setLoading(false)
        return
      }

      // Validate bookId was successfully obtained
      if (!bookId) {
        alert("Gagal mendapatkan ID buku. Silakan coba lagi.")
        setLoading(false)
        return
      }

      console.log("Adding book to collection:", { userId: effectiveUserId, bookId, condition, notes, location })

      // Add to user collection
      const response = await fetch("/api/user-books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          bookId,
          condition,
          notes,
          location: location && location.trim() ? location.trim() : null,
        }),
      })

      if (!response.ok) {
        let error
        try {
          error = await response.json()
        } catch (e) {
          error = { error: "Gagal memproses response dari server" }
        }
        
        console.error("Error response:", error)
        console.error("Response status:", response.status)
        console.error("Full error object:", JSON.stringify(error, null, 2))
        
        // Build error message
        let errorMessage = error.error || "Gagal menambahkan buku ke koleksi"
        if (error.details) {
          errorMessage += `\n\nDetail: ${error.details}`
        }
        if (error.code && error.code !== "UNKNOWN") {
          errorMessage += `\n\nKode Error: ${error.code}`
        }
        if (error.hint) {
          errorMessage += `\n\n${error.hint}`
        }
        
        alert(errorMessage)
        setLoading(false)
        return
      }

      onSuccess()
      onOpenChange(false)
      setBookData(null)
      setEditableBookData(null)
      setManualInputMode(false)
      setIsbnSearchMode(false)
      setIsbnInput("")
      setCondition("baik")
      setNotes("")
      setLocation("")
      setManualFormData({
        title: "",
        author: "",
        isbn: "",
        description: "",
        coverImage: "",
      })
    } catch (error: any) {
      console.error("Error adding book:", error)
      console.error("Error details:", error)
      alert(`Terjadi kesalahan: ${error.message || "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Dialog Pilihan Metode */}
      <Dialog open={methodDialogOpen && open} onOpenChange={(open) => {
        if (!open) {
          setMethodDialogOpen(false)
          onOpenChange(false)
        }
      }}>
        <DialogContent className="w-[95vw] max-w-[500px] mx-auto p-4 sm:p-6">
          <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold leading-tight">
              Tambah Buku ke Koleksi
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              Pilih metode untuk menambahkan buku
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 py-2 sm:py-4">
            <Button
              onClick={handleCameraScanMode}
              className="h-auto p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 sm:p-2.5 bg-primary/10 rounded-lg shrink-0 shadow-sm">
                  <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base mb-1">Scan dengan Kamera</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">
                    Scan barcode ISBN menggunakan kamera perangkat
                  </div>
                </div>
              </div>
            </Button>
            <Button
              onClick={handleIsbnSearchMode}
              className="h-auto p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 sm:p-2.5 bg-primary/10 rounded-lg shrink-0 shadow-sm">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base mb-1">Cari dengan ISBN</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">
                    Masukkan ISBN untuk mencari informasi buku secara otomatis
                  </div>
                </div>
              </div>
            </Button>
            <Button
              onClick={handleManualInput}
              className="h-auto p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full hover:shadow-md transition-shadow duration-200 border-2 hover:border-primary/20"
              variant="outline"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 sm:p-2.5 bg-primary/10 rounded-lg shrink-0 shadow-sm">
                  <Keyboard className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-semibold text-sm sm:text-base mb-1">Input Manual</div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed">
                    Masukkan informasi buku secara manual
                  </div>
                </div>
              </div>
            </Button>
          </div>
          <div className="flex justify-end pt-2 sm:pt-4 border-t border-border/50">
            <Button
              variant="ghost"
              onClick={() => {
                setMethodDialogOpen(false)
                onOpenChange(false)
              }}
              className="text-sm sm:text-base px-4 sm:px-6"
            >
              Batal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open && !methodDialogOpen} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-[600px] mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 sm:space-y-3 pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl font-semibold leading-tight">
              Tambah Buku ke Koleksi
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {manualInputMode 
                ? "Masukkan informasi buku secara manual"
                : isbnSearchMode
                ? "Masukkan ISBN untuk mencari informasi buku secara otomatis"
                : bookData
                ? "Lengkapi informasi dan tambahkan ke koleksi"
                : "Masukkan informasi buku"}
            </DialogDescription>
          </DialogHeader>

          {isbnSearchMode && !bookData ? (
            <form onSubmit={(e) => {
              e.preventDefault()
              handleIsbnSearch(isbnInput)
            }} className="space-y-4 sm:space-y-5 pt-2">
              <div className="space-y-2">
                <Label htmlFor="isbn-search" className="text-sm sm:text-base font-medium">
                  ISBN
                </Label>
                <Input
                  id="isbn-search"
                  type="text"
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  placeholder="Masukkan ISBN (10 atau 13 digit)"
                  disabled={loading}
                  required
                  autoFocus
                  className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                />
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  Sistem akan mencari informasi buku dari Open Library dan Google Books
                </p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-4 sm:pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsbnSearchMode(false)
                    setMethodDialogOpen(true)
                    setIsbnInput("")
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
                >
                  Kembali
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !isbnInput.trim()}
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Cari Buku
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : manualInputMode ? (
            <form onSubmit={handleSubmit} className="pt-2">
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="manual-title" className="text-sm sm:text-base font-medium">
                    Judul Buku <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual-title"
                    value={manualFormData.title}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, title: e.target.value })
                    }
                    placeholder="Masukkan judul buku"
                    required
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-author" className="text-sm sm:text-base font-medium">
                    Penulis <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="manual-author"
                    value={manualFormData.author}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, author: e.target.value })
                    }
                    placeholder="Masukkan nama penulis"
                    required
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-isbn" className="text-sm sm:text-base font-medium">ISBN</Label>
                  <Input
                    id="manual-isbn"
                    value={manualFormData.isbn}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, isbn: e.target.value })
                    }
                    placeholder="Masukkan ISBN (opsional)"
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-description" className="text-sm sm:text-base font-medium">Deskripsi</Label>
                  <Textarea
                    id="manual-description"
                    value={manualFormData.description}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, description: e.target.value })
                    }
                    placeholder="Masukkan deskripsi buku (opsional)"
                    rows={3}
                    className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-coverImage" className="text-sm sm:text-base font-medium">URL Cover Buku</Label>
                  <Input
                    id="manual-coverImage"
                    type="url"
                    value={manualFormData.coverImage}
                    onChange={(e) =>
                      setManualFormData({ ...manualFormData, coverImage: e.target.value })
                    }
                    placeholder="https://example.com/cover.jpg (opsional)"
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                {manualFormData.coverImage && (
                  <div className="flex justify-center py-2">
                    <img
                      src={manualFormData.coverImage}
                      alt="Preview"
                      className="h-32 sm:h-40 w-auto max-w-full object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-sm sm:text-base font-medium">Kondisi Buku</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baik">Baik</SelectItem>
                      <SelectItem value="sedang">Sedang</SelectItem>
                      <SelectItem value="rusak">Rusak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm sm:text-base font-medium">
                    Lokasi/Kota <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Jakarta, Bandung, Surabaya..."
                    required
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Lokasi membantu peminjam menemukan buku terdekat
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm sm:text-base font-medium">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tentang buku ini..."
                    rows={3}
                    className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setManualInputMode(false)
                    setMethodDialogOpen(true)
                    setManualFormData({
                      title: "",
                      author: "",
                      isbn: "",
                      description: "",
                      coverImage: "",
                    })
                    setCondition("baik")
                    setNotes("")
                    setLocation("")
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
                >
                  Kembali
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Tambahkan ke Koleksi"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : editableBookData ? (
            <form onSubmit={handleSubmit} className="pt-2">
              <div className="space-y-4 sm:space-y-5">
                {editableBookData.coverImage && (
                  <div className="flex justify-center py-2">
                    <img
                      src={editableBookData.coverImage}
                      alt={editableBookData.title}
                      className="h-32 sm:h-40 w-auto max-w-full object-cover rounded-lg shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-title" className="text-sm sm:text-base font-medium">
                    Judul Buku <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-title"
                    value={editableBookData.title}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, title: e.target.value })
                    }
                    placeholder="Masukkan judul buku"
                    required
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-author" className="text-sm sm:text-base font-medium">
                    Penulis <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-author"
                    value={editableBookData.author}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, author: e.target.value })
                    }
                    placeholder="Masukkan nama penulis"
                    required
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-isbn" className="text-sm sm:text-base font-medium">ISBN</Label>
                  <Input
                    id="edit-isbn"
                    value={editableBookData.isbn}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, isbn: e.target.value })
                    }
                    placeholder="Masukkan ISBN (opsional)"
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description" className="text-sm sm:text-base font-medium">Deskripsi</Label>
                  <Textarea
                    id="edit-description"
                    value={editableBookData.description || ""}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, description: e.target.value })
                    }
                    placeholder="Masukkan deskripsi buku (opsional)"
                    rows={3}
                    className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-coverImage" className="text-sm sm:text-base font-medium">URL Cover Buku</Label>
                  <Input
                    id="edit-coverImage"
                    type="url"
                    value={editableBookData.coverImage || ""}
                    onChange={(e) =>
                      setEditableBookData({ ...editableBookData, coverImage: e.target.value })
                    }
                    placeholder="https://example.com/cover.jpg (opsional)"
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                  {editableBookData.coverImage && (
                    <div className="mt-2 flex justify-center">
                      <img
                        src={editableBookData.coverImage}
                        alt="Preview"
                        className="h-24 sm:h-32 w-auto max-w-full object-cover rounded-lg border shadow-sm"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition" className="text-sm sm:text-base font-medium">Kondisi Buku</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger className="h-10 sm:h-11 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baik">Baik</SelectItem>
                      <SelectItem value="sedang">Sedang</SelectItem>
                      <SelectItem value="rusak">Rusak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm sm:text-base font-medium">
                    Lokasi/Kota <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Jakarta, Bandung, Surabaya..."
                    required
                    className="text-sm sm:text-base h-10 sm:h-11 px-3 sm:px-4"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Lokasi membantu peminjam menemukan buku terdekat
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm sm:text-base font-medium">Catatan (Opsional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan tentang buku ini..."
                    rows={3}
                    className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-3 resize-none"
                  />
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBookData(null)
                    setEditableBookData(null)
                    setIsbnInput("")
                    setIsbnSearchMode(true)
                    setCondition("baik")
                    setNotes("")
                    setLocation("")
                  }}
                  disabled={loading}
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6"
                >
                  Cari Lagi
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Tambahkan ke Koleksi"
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ISBN Scanner Dialog */}
      <ISBNScanner
        open={scannerOpen}
        onScan={handleScannerScan}
        onClose={() => {
          setScannerOpen(false)
          setMethodDialogOpen(true)
        }}
      />
    </>
  )
}
