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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BookOpen, Loader2, MapPin, Clock } from "lucide-react"

interface Location {
  location: string
  count: number
  unavailableCount: number
  owners: Array<{
    id: string
    name: string
    userBookId: string
    isAvailable: boolean
  }>
}

interface BorrowButtonProps {
  bookId: string
  bookTitle: string
  available: number
  unavailable?: number
  locations?: Location[]
  userId?: string
  lenderId?: string // ID user yang meminjamkan (untuk pinjam dari user lain)
  userBookId?: string // ID user book (untuk pinjam dari user lain)
}

export function BorrowButton({
  bookId,
  bookTitle,
  available,
  unavailable = 0,
  locations,
  userId,
  lenderId,
  userBookId,
}: BorrowButtonProps) {
  // Get userId from localStorage if not provided
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [selectedOwner, setSelectedOwner] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      setCurrentUserId(storedUserId)
    }
  }, [])

  const effectiveUserId = userId || currentUserId

  const handleBorrow = async () => {
    if (!effectiveUserId) {
      alert("Anda harus login untuk meminjam buku")
      return
    }

    // Jika ada multiple locations, pastikan user sudah memilih lokasi
    if (locations && locations.length > 1 && !selectedLocation) {
      alert("Silakan pilih lokasi/kota terlebih dahulu")
      return
    }

    // Set selectedLocation jika hanya ada 1 lokasi
    let finalLocation = selectedLocation
    if (locations && locations.length === 1 && !selectedLocation) {
      finalLocation = locations[0].location
    }

    // Jika ada multiple owners di lokasi yang sama, pastikan user sudah memilih owner
    if (finalLocation && locations) {
      const selectedLoc = locations.find(loc => loc.location === finalLocation)
      if (selectedLoc && selectedLoc.owners.length > 1 && !selectedOwner) {
        alert("Silakan pilih pemilik buku terlebih dahulu")
        return
      }
    }

    setLoading(true)
    try {
      // Set finalLocation jika hanya ada 1 lokasi
      const finalLocation = selectedLocation || (locations && locations.length === 1 ? locations[0].location : null)

      // Tentukan userBookId berdasarkan pilihan
      let targetUserBookId = userBookId || null
      let targetLenderId = lenderId || null

      if (finalLocation && locations) {
        const selectedLoc = locations.find(loc => loc.location === finalLocation)
        if (selectedLoc) {
          // Filter owners berdasarkan isAvailable untuk waiting list
          const availableOwners = isWaitingList
            ? selectedLoc.owners.filter(o => !o.isAvailable)
            : selectedLoc.owners.filter(o => o.isAvailable)
          
          if (selectedOwner) {
            // User memilih owner spesifik
            const owner = availableOwners.find(o => o.id === selectedOwner)
            if (owner) {
              targetUserBookId = owner.userBookId
              targetLenderId = owner.id
            }
          } else if (availableOwners.length === 1) {
            // Hanya ada satu owner di lokasi ini
            targetUserBookId = availableOwners[0].userBookId
            targetLenderId = availableOwners[0].id
          }
        }
      }

      const response = await fetch("/api/borrows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: effectiveUserId,
          bookId,
          lenderId: targetLenderId,
          userBookId: targetUserBookId,
          location: finalLocation || null,
          isWaitingList: isWaitingList,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal meminjam buku")
        return
      }

      const successMessage = isWaitingList
        ? "Anda telah ditambahkan ke waiting list! Anda akan diberitahu ketika buku tersedia."
        : "Request peminjaman berhasil dikirim! Menunggu persetujuan pemilik buku."
      alert(successMessage)
      setOpen(false)
      setSelectedLocation("")
      setSelectedOwner("")
      // Refresh page or update state
      window.location.reload()
    } catch (error) {
      console.error("Error borrowing book:", error)
      alert("Terjadi kesalahan saat meminjam buku")
    } finally {
      setLoading(false)
    }
  }

  // Determine if this is a waiting list request
  const isWaitingList = available === 0 && unavailable > 0

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        className="w-full border-0 !border-0"
        variant={isWaitingList ? "secondary" : "default"}
      >
        {isWaitingList ? (
          <>
            <Clock className="mr-2 h-4 w-4" />
            Waiting List
          </>
        ) : (
          <>
            <BookOpen className="mr-2 h-4 w-4" />
            Pinjam Buku
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={(open) => {
        setOpen(open)
        if (!open) {
          setSelectedLocation("")
          setSelectedOwner("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isWaitingList ? "Waiting List" : "Pinjam Buku"}</DialogTitle>
            <DialogDescription>
              {isWaitingList 
                ? `Tambahkan diri Anda ke waiting list untuk buku "${bookTitle}". Anda akan diberitahu ketika buku tersedia.`
                : `Pilih lokasi/kota untuk meminjam buku "${bookTitle}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {locations && locations.length > 1 ? (
              <>
                <div>
                  <Label htmlFor="location-select">Pilih Lokasi/Kota <span className="text-destructive">*</span></Label>
                  <Select value={selectedLocation} onValueChange={(value) => {
                    setSelectedLocation(value)
                    setSelectedOwner("") // Reset owner selection when location changes
                  }}>
                    <SelectTrigger id="location-select">
                      <SelectValue placeholder="Pilih lokasi/kota" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations
                        .filter(loc => {
                          // Untuk waiting list, hanya tampilkan lokasi yang punya buku tidak tersedia
                          if (isWaitingList) {
                            return loc.unavailableCount > 0
                          }
                          // Untuk pinjam normal, hanya tampilkan lokasi yang punya buku tersedia
                          return (loc.count - loc.unavailableCount) > 0
                        })
                        .map((loc, idx) => (
                          <SelectItem key={idx} value={loc.location}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{loc.location}</span>
                              {isWaitingList ? (
                                <span className="text-xs text-muted-foreground">({loc.unavailableCount} dipinjam)</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">({loc.count - loc.unavailableCount} tersedia)</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLocation && (() => {
                  const selectedLoc = locations.find(loc => loc.location === selectedLocation)
                  if (selectedLoc) {
                    // Filter owners berdasarkan isAvailable untuk waiting list
                    const availableOwners = isWaitingList
                      ? selectedLoc.owners.filter(o => !o.isAvailable)
                      : selectedLoc.owners.filter(o => o.isAvailable)
                    
                    if (availableOwners.length > 1) {
                      return (
                        <div>
                          <Label htmlFor="owner-select">Pilih Pemilik Buku <span className="text-destructive">*</span></Label>
                          <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                            <SelectTrigger id="owner-select">
                              <SelectValue placeholder="Pilih pemilik buku" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableOwners.map((owner) => (
                                <SelectItem key={owner.id} value={owner.id}>
                                  {owner.name}
                                  {isWaitingList && <span className="text-xs text-muted-foreground ml-2">(Dipinjam)</span>}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    }
                  }
                  return null
                })()}

                {selectedLocation && (() => {
                  const selectedLoc = locations.find(loc => loc.location === selectedLocation)
                  if (selectedLoc) {
                    return (
                      <div className="text-sm text-muted-foreground">
                        <p>Lokasi: <span className="font-medium">{selectedLocation}</span></p>
                        {selectedLoc.owners.length === 1 && (
                          <p>Pemilik: <span className="font-medium">{selectedLoc.owners[0].name}</span></p>
                        )}
                        {selectedOwner && (() => {
                          const owner = selectedLoc.owners.find(o => o.id === selectedOwner)
                          return owner && <p>Pemilik: <span className="font-medium">{owner.name}</span></p>
                        })()}
                      </div>
                    )
                  }
                  return null
                })()}
              </>
            ) : locations && locations.length === 1 ? (
              <div className="text-sm text-muted-foreground">
                <p>Lokasi: <span className="font-medium">{locations[0].location}</span></p>
                {locations[0].owners.length === 1 && (
                  <p>Pemilik: <span className="font-medium">{locations[0].owners[0].name}</span></p>
                )}
                {locations[0].owners.length > 1 && (
                  <div>
                    <Label htmlFor="owner-select">Pilih Pemilik Buku <span className="text-destructive">*</span></Label>
                    <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                      <SelectTrigger id="owner-select">
                        <SelectValue placeholder="Pilih pemilik buku" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations[0].owners.map((owner) => (
                          <SelectItem key={owner.id} value={owner.id}>
                            {owner.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Request peminjaman akan dikirim ke pemilik buku untuk persetujuan.
                Anda akan diberitahu setelah request disetujui atau ditolak.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setSelectedLocation("")
                setSelectedOwner("")
              }}
              disabled={loading}
            >
              Batal
            </Button>
            <Button onClick={handleBorrow} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Konfirmasi Pinjam"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
