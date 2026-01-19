"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { BookOpen, Library, User, MapPin, X } from "lucide-react"
import { SearchBar } from "@/components/catalog/search-bar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BorrowButton } from "@/components/catalog/borrow-button"

interface CatalogItem {
  id: string
  title: string
  author: string
  isbn?: string
  description?: string
  coverImage?: string
  available: number
  unavailable: number
  total: number
  source?: string
  userBookId?: string
  lenderId?: string
  lenderName?: string
  createdAt: string
  locations?: Array<{
    location: string
    count: number
    unavailableCount: number
    owners: Array<{
      id: string
      name: string
      userBookId: string
      isAvailable: boolean
    }>
  }>
}

interface UserBook {
  id: string
  isAvailable: boolean
  book: {
    id: string
    title: string
    author: string
    isbn?: string | null
    description?: string | null
    coverImage?: string | null
  }
  user: {
    id: string
    name: string
  }
  userId: string
  location: string | null
  coverImage: string | null
  createdAt: string
}

export default function CatalogPage() {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [filterAvailable, setFilterAvailable] = useState("all")
  const [filterLocation, setFilterLocation] = useState("all")
  const [availableLocations, setAvailableLocations] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<CatalogItem | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  useEffect(() => {
    // Get user ID
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId"))
    }
    fetchAllBooks()
  }, [])

  const fetchAllBooks = async () => {
    try {
      setLoading(true)
      
      // Fetch books from user collections (semua buku, termasuk yang tidak tersedia)
      const userBooksResponse = await fetch("/api/user-books")
      const userBooksData = await userBooksResponse.ok ? await userBooksResponse.json() : []
      
      // Group books by title (and ISBN if available)
      const bookMap = new Map<string, CatalogItem>()
      
      // Process user books - group by title/ISBN
      userBooksData.forEach((userBook: UserBook) => {
        // Gunakan ISBN jika ada, jika tidak gunakan title saja (normalized)
        const key = userBook.book.isbn || userBook.book.title.toLowerCase().trim()
        
        if (!bookMap.has(key)) {
          // Initialize locations array
          const locations: Array<{
            location: string
            count: number
            unavailableCount: number
            owners: Array<{
              id: string
              name: string
              userBookId: string
              isAvailable: boolean
            }>
          }> = []
          
          if (userBook.location) {
            locations.push({
              location: userBook.location,
              count: 1,
              unavailableCount: userBook.isAvailable ? 0 : 1,
              owners: [{
                id: userBook.user.id,
                name: userBook.user.name,
                userBookId: userBook.id,
                isAvailable: userBook.isAvailable,
              }],
            })
          }
          
          // Use coverImage from UserBook first, fallback to Book coverImage
          const coverImage = userBook.coverImage || userBook.book.coverImage || undefined
          
          bookMap.set(key, {
            id: userBook.book.id,
            title: userBook.book.title,
            author: userBook.book.author,
            isbn: userBook.book.isbn || undefined,
            description: userBook.book.description || undefined,
            coverImage: coverImage,
            available: userBook.isAvailable ? 1 : 0,
            unavailable: userBook.isAvailable ? 0 : 1,
            total: 1,
            source: "user",
            createdAt: userBook.createdAt,
            locations: locations,
          })
        } else {
          // If book already exists, add to count and locations
          const existing = bookMap.get(key)!
          existing.total += 1
          if (userBook.isAvailable) {
            existing.available += 1
          } else {
            existing.unavailable += 1
          }
          
          // Add location and owner info
          if (userBook.location) {
            const locationIndex = existing.locations?.findIndex(
              (loc) => loc.location === userBook.location
            ) ?? -1
            
            if (locationIndex >= 0 && existing.locations) {
              // Location already exists, increment count and add owner
              existing.locations[locationIndex].count++
              if (!userBook.isAvailable) {
                existing.locations[locationIndex].unavailableCount++
              }
              existing.locations[locationIndex].owners.push({
                id: userBook.user.id,
                name: userBook.user.name,
                userBookId: userBook.id,
                isAvailable: userBook.isAvailable,
              })
            } else {
              // New location
              if (!existing.locations) {
                existing.locations = []
              }
              existing.locations.push({
                location: userBook.location,
                count: 1,
                unavailableCount: userBook.isAvailable ? 0 : 1,
                owners: [{
                  id: userBook.user.id,
                  name: userBook.user.name,
                  userBookId: userBook.id,
                  isAvailable: userBook.isAvailable,
                }],
              })
            }
          }
          
          // Keep the earliest createdAt date
          if (new Date(userBook.createdAt) < new Date(existing.createdAt)) {
            existing.createdAt = userBook.createdAt
          }
        }
      })
      
      // Convert map to array
      const items = Array.from(bookMap.values())
      
      // Extract all unique locations from items
      const locationsSet = new Set<string>()
      items.forEach(item => {
        if (item.locations) {
          item.locations.forEach(loc => {
            if (loc.location) {
              locationsSet.add(loc.location)
            }
          })
        }
      })
      const uniqueLocations = Array.from(locationsSet).sort()
      setAvailableLocations(uniqueLocations)
      
      setCatalogItems(items)
    } catch (error) {
      console.error("Error fetching books:", error)
      alert("Gagal mengambil data buku")
    } finally {
      setLoading(false)
    }
  }

  // Filter dan sort buku
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...catalogItems]

    // Filter berdasarkan pencarian
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.author.toLowerCase().includes(query) ||
          (item.isbn && item.isbn.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.lenderName && item.lenderName.toLowerCase().includes(query))
      )
    }

    // Filter berdasarkan ketersediaan
    if (filterAvailable === "available") {
      filtered = filtered.filter((item) => item.available > 0)
    } else if (filterAvailable === "unavailable") {
      filtered = filtered.filter((item) => item.available === 0)
    }

    // Filter berdasarkan lokasi
    if (filterLocation && filterLocation !== "all") {
      filtered = filtered.filter((item) => {
        if (!item.locations || item.locations.length === 0) {
          return false
        }
        return item.locations.some(loc => loc.location === filterLocation)
      })
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        break
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        break
      case "title-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "title-desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title))
        break
      case "author-asc":
        filtered.sort((a, b) => a.author.localeCompare(b.author))
        break
      case "author-desc":
        filtered.sort((a, b) => b.author.localeCompare(a.author))
        break
      default:
        break
    }

    return filtered
  }, [catalogItems, searchQuery, sortBy, filterAvailable, filterLocation])

  return (
    <div className="space-y-6">
      <div className="pb-4 mb-6">
        <h1 className="text-3xl font-serif font-bold mb-2">Katalog Buku</h1>
        <p className="text-sm">
          Jelajahi koleksi buku dari sesamamu
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            filterAvailable={filterAvailable}
            onFilterAvailableChange={setFilterAvailable}
            filterLocation={filterLocation}
            onFilterLocationChange={setFilterLocation}
            availableLocations={availableLocations}
          />
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Library className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Memuat katalog buku...</p>
          </div>
        </div>
      ) : filteredAndSortedItems.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterAvailable !== "all"
                  ? "Tidak ada buku yang ditemukan"
                  : "Belum ada buku"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || filterAvailable !== "all"
                  ? "Coba ubah kata kunci pencarian atau filter"
                  : "Buku akan muncul di sini setelah ditambahkan"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {filteredAndSortedItems.length} judul buku
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAndSortedItems.map((item, index) => (
              <Card 
                key={`${item.isbn || item.id}-${index}`} 
                className="flex flex-col h-full cursor-pointer overflow-hidden"
                onClick={() => {
                  setSelectedBook(item)
                  setDetailDialogOpen(true)
                }}
              >
                {/* Bagian Gambar */}
                <div className="relative aspect-[3/4] bg-muted border-b border-border overflow-hidden">
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt={item.title}
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
                  {item.available === 0 && item.unavailable > 0 && (
                    <div className="absolute inset-0 bg-foreground/20 flex items-center justify-center">
                      <span className="text-sm font-serif text-white uppercase tracking-widest">Sedang Dipinjam</span>
                    </div>
                  )}
                </div>

                {/* Bagian Info - Tanpa kotak di tiap baris teks */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold uppercase tracking-tight line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm italic text-gray-700 font-serif">{item.author}</p>
                  </div>

                  {/* Garis pemisah tipis horizontal */}
                  <div className="border-t border-border/50 pt-3 flex justify-between text-[10px] uppercase tracking-widest font-serif">
                    {item.isbn && <span>ISBN: {item.isbn}</span>}
                    <span className={item.available > 0 ? "font-bold" : "text-muted-foreground"}>
                      {item.available > 0 ? "Tersedia" : item.unavailable > 0 ? "Dipinjam" : "Tidak Tersedia"}
                    </span>
                  </div>

                  <div onClick={(e) => e.stopPropagation()} className="pt-2">
                    <BorrowButton
                      bookId={item.id}
                      bookTitle={item.title}
                      available={item.available}
                      unavailable={item.unavailable}
                      locations={item.locations}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Book Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 p-0">
          {selectedBook && (
            <>
              {/* Mobile Layout - Full Width Card Style */}
              <div className="md:hidden">
                {/* Cover Image Section */}
                <div className="relative w-full aspect-[3/4] bg-muted overflow-hidden">
                  {selectedBook.coverImage ? (
                    <img
                      src={selectedBook.coverImage}
                      alt={selectedBook.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="h-24 w-24 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Book Details Section - Greyscale Background */}
                <div className="bg-background p-4 sm:p-6 space-y-4 border-t border-border">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-serif font-bold uppercase tracking-tight mb-1">
                      {selectedBook.title}
                    </h2>
                    <p className="text-sm sm:text-base italic text-muted-foreground font-serif">
                      {selectedBook.author}
                    </p>
                  </div>

                  {selectedBook.isbn && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <span className="font-serif font-semibold">ISBN:</span>
                      <span className="font-serif">{selectedBook.isbn}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-serif font-semibold">Tersedia:</span>
                      <span className="text-xs sm:text-sm font-serif font-bold">{selectedBook.available}</span>
                    </div>
                    {selectedBook.unavailable > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-serif font-semibold">Dipinjam:</span>
                        <span className="text-xs sm:text-sm font-serif font-bold">{selectedBook.unavailable}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-serif font-semibold">Total:</span>
                      <span className="text-xs sm:text-sm font-serif font-bold">{selectedBook.total}</span>
                    </div>
                  </div>

                  {/* Borrow Button */}
                  <div className="pt-2">
                    <BorrowButton
                      bookId={selectedBook.id}
                      bookTitle={selectedBook.title}
                      available={selectedBook.available}
                      unavailable={selectedBook.unavailable}
                      locations={selectedBook.locations}
                    />
                  </div>

                  {/* Description */}
                  {selectedBook.description && (
                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-serif font-semibold mb-2">Deskripsi</h3>
                      <p className="text-xs sm:text-sm leading-relaxed font-serif text-muted-foreground">
                        {selectedBook.description}
                      </p>
                    </div>
                  )}

                  {/* Locations */}
                  {selectedBook.locations && selectedBook.locations.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h3 className="text-sm font-serif font-semibold mb-3">Lokasi & Ketersediaan</h3>
                      <div className="space-y-4">
                        {selectedBook.locations.map((loc, locIdx) => (
                          <div key={locIdx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs sm:text-sm font-serif font-semibold">{loc.location}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="font-serif">
                                  <span className="font-bold">{loc.count}</span> copy
                                </span>
                                {loc.unavailableCount > 0 && (
                                  <span className="font-serif text-muted-foreground">
                                    <span className="font-bold">{loc.unavailableCount}</span> dipinjam
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-serif font-semibold">Pemilik Buku:</p>
                              <div className="space-y-1">
                                {loc.owners.map((owner, ownerIdx) => (
                                  <div 
                                    key={ownerIdx} 
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <Link 
                                        href={`/users/${owner.id}/books`}
                                        className="font-serif hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {owner.name}
                                      </Link>
                                    </div>
                                    <span className={`text-xs font-serif ${owner.isAvailable ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                      {owner.isAvailable ? 'Tersedia' : 'Dipinjam'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">
                <DialogHeader className="pb-4 border-b border-border">
                  <DialogTitle className="text-2xl font-serif">{selectedBook.title}</DialogTitle>
                  <DialogDescription className="text-base font-serif">
                    {selectedBook.author}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-4 pt-4">
                  {/* Cover Image */}
                  <div className="md:col-span-1">
                    <div className="relative w-full max-w-[200px] mx-auto md:max-w-none aspect-[2/3] bg-background overflow-hidden">
                      {selectedBook.coverImage ? (
                        <img
                          src={selectedBook.coverImage}
                          alt={selectedBook.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <BookOpen className="h-24 w-24 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Book Details */}
                  <div className="md:col-span-2 space-y-0">
                    {/* Header Section */}
                    <div className="space-y-3 pb-4 border-b border-border">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-serif font-semibold">Penulis:</span>
                      <span className="font-serif">{selectedBook.author}</span>
                    </div>
                    {selectedBook.isbn && (
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-semibold">ISBN:</span>
                        <span className="font-serif">{selectedBook.isbn}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-6 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-semibold">Tersedia:</span>
                        <span className="font-serif font-bold">{selectedBook.available}</span>
                      </div>
                      {selectedBook.unavailable > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-semibold">Dipinjam:</span>
                          <span className="font-serif font-bold">{selectedBook.unavailable}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-semibold">Total:</span>
                        <span className="font-serif font-bold">{selectedBook.total}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description Section */}
                  {selectedBook.description && (
                    <div className="pt-4 pb-4 border-b border-border">
                      <h3 className="text-sm font-serif font-semibold mb-3">Deskripsi</h3>
                      <p className="text-sm leading-relaxed font-serif">
                        {selectedBook.description}
                      </p>
                    </div>
                  )}

                  {/* Locations Section */}
                  {selectedBook.locations && selectedBook.locations.length > 0 && (
                    <div className="pt-4">
                      <h3 className="text-sm font-serif font-semibold mb-4">Lokasi & Ketersediaan</h3>
                      <div className="space-y-6">
                        {selectedBook.locations.map((loc, locIdx) => (
                          <div key={locIdx} className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span className="font-serif font-semibold text-base">{loc.location}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="font-serif">
                                  <span className="font-bold">{loc.count}</span> copy
                                </span>
                                {loc.unavailableCount > 0 && (
                                  <span className="font-serif text-muted-foreground">
                                    <span className="font-bold">{loc.unavailableCount}</span> dipinjam
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm font-serif font-bold flex-shrink-0">
                                Pemilik Buku:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {loc.owners.map((owner, ownerIdx) => (
                                  <div 
                                    key={ownerIdx} 
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex items-center gap-2">
                                      <User className="h-3 w-3 text-muted-foreground" />
                                      <Link 
                                        href={`/users/${owner.id}/books`}
                                        className="text-sm hover:underline font-serif font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {owner.name}
                                      </Link>
                                    </div>
                                    <span className={`text-xs font-serif ${owner.isAvailable ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                                      {owner.isAvailable ? 'Tersedia' : 'Dipinjam'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Borrow Button */}
                  <div className="pt-4">
                    <BorrowButton
                      bookId={selectedBook.id}
                      bookTitle={selectedBook.title}
                      available={selectedBook.available}
                      unavailable={selectedBook.unavailable}
                      locations={selectedBook.locations}
                    />
                  </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
