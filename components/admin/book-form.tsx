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

interface Book {
  id?: string
  title: string
  author: string
  isbn?: string | null
  description?: string | null
  coverImage?: string | null
  stock?: number
  available?: number
  createdAt?: string
  updatedAt?: string
  owners?: any[]
}

interface BookFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  book?: Book | null
  onSuccess: () => void
}

export function BookForm({ open, onOpenChange, book, onSuccess }: BookFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    description: "",
    coverImage: "",
  })

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title || "",
        author: book.author || "",
        isbn: book.isbn || "",
        description: book.description || "",
        coverImage: book.coverImage || "",
      })
    } else {
      setFormData({
        title: "",
        author: "",
        isbn: "",
        description: "",
        coverImage: "",
      })
    }
  }, [book, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = book?.id ? `/api/books/${book.id}` : "/api/books"
      const method = book?.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Terjadi kesalahan")
        return
      }

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving book:", error)
      alert("Terjadi kesalahan saat menyimpan buku")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {book?.id ? "Edit Buku" : "Tambah Buku Baru"}
          </DialogTitle>
          <DialogDescription>
            {book?.id
              ? "Ubah informasi buku di bawah ini."
              : "Isi form di bawah ini untuk menambahkan buku baru."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Judul Buku <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                placeholder="Masukkan judul buku"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author">
                Penulis <span className="text-destructive">*</span>
              </Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
                required
                placeholder="Masukkan nama penulis"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={formData.isbn}
                onChange={(e) =>
                  setFormData({ ...formData, isbn: e.target.value })
                }
                placeholder="Masukkan ISBN (opsional)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Masukkan deskripsi buku (opsional)"
                rows={4}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coverImage">URL Cover Buku</Label>
              <Input
                id="coverImage"
                type="url"
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="https://example.com/cover.jpg (opsional)"
              />
            </div>
            {book?.id && (
              <div className="grid gap-2">
                <Label>Informasi Stok</Label>
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded border">
                  <div className="space-y-1">
                    <p><strong>Total Stok:</strong> {book.stock || 0} buku</p>
                    <p><strong>Tersedia:</strong> {book.available || 0} buku</p>
                    <p><strong>Dipinjam:</strong> {(book.stock || 0) - (book.available || 0)} buku</p>
                  </div>
                  <p className="text-xs mt-2 pt-2 border-t">
                    Stok dihitung dari jumlah koleksi buku yang dimiliki user. 
                    Untuk mengubah stok, user perlu menambah atau mengurangi koleksi bukunya.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : book?.id ? "Update" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
