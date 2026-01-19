"use client"

import { useState, useEffect } from "react"
import { Check, X, RotateCcw, Clock, AlertCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Borrow {
  id: string
  userId: string
  bookId: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED"
  borrowDate: string | null
  dueDate: string | null
  returnDate: string | null
  latePenalty: number
  requestDate: string
  user: {
    id: string
    name: string
    email: string
  }
  book: {
    id: string
    title: string
    author: string
  }
  userBook: {
    id: string
    condition: string | null
  } | null
}

export default function MyRequestsPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    borrow: Borrow | null
    action: "approve" | "reject" | "return" | null
  }>({
    open: false,
    borrow: null,
    action: null,
  })

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

  const fetchRequests = async () => {
    if (!userId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/borrows/my-requests?lenderId=${userId}`)
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setBorrows(data)
    } catch (error) {
      console.error("Error fetching requests:", error)
      alert("Gagal mengambil data request")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchRequests()
    }
  }, [userId])

  const handleAction = async () => {
    if (!actionDialog.borrow || !actionDialog.action || !userId) return

    try {
      const response = await fetch(
        `/api/borrows/${actionDialog.borrow.id}/lender-action`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: actionDialog.action,
            lenderId: userId,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal memproses aksi")
        return
      }

      setActionDialog({ open: false, borrow: null, action: null })
      fetchRequests()
    } catch (error) {
      console.error("Error processing action:", error)
      alert("Terjadi kesalahan")
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "outline",
      APPROVED: "default",
      REJECTED: "destructive",
      RETURNED: "secondary",
    }

    const labels: Record<string, { text: string; icon: any }> = {
      PENDING: { text: "Menunggu", icon: Clock },
      APPROVED: { text: "Dipinjam", icon: Check },
      REJECTED: { text: "Ditolak", icon: X },
      RETURNED: { text: "Dikembalikan", icon: RotateCcw },
    }

    const label = labels[status] || { text: status }
    const Icon = label.icon

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1 w-fit">
        {Icon && <Icon className="h-3 w-3" />}
        {label.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const pendingRequests = borrows.filter((b) => b.status === "PENDING")
  const activeBorrows = borrows.filter((b) => b.status === "APPROVED")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Request Peminjaman Buku Saya</h1>
          <p className="text-sm">
            Kelola request peminjaman untuk buku koleksi Anda
          </p>
        </div>
        {pendingRequests.length > 0 && (
          <Badge variant="default" className="text-lg px-4 py-2">
            {pendingRequests.length} Request Pending
          </Badge>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl font-serif">{pendingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sedang Dipinjam</CardDescription>
            <CardTitle className="text-2xl font-serif">{activeBorrows.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Request</CardDescription>
            <CardTitle className="text-2xl font-serif">{borrows.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Request</CardTitle>
          <CardDescription>
            Request untuk buku koleksi Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : borrows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Belum ada request untuk buku koleksi Anda
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table - Hidden on mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peminjam</TableHead>
                      <TableHead>Buku</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Request</TableHead>
                      <TableHead>Tanggal Pinjam</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {borrows.map((borrow) => (
                      <TableRow key={borrow.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Link 
                                href={`/users/${borrow.user.id}/books`}
                                className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {borrow.user.name}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {borrow.user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium font-serif">{borrow.book.title}</p>
                            <p className="text-xs">
                              {borrow.book.author}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(borrow.status)}</TableCell>
                        <TableCell>{formatDate(borrow.requestDate)}</TableCell>
                        <TableCell>{formatDate(borrow.borrowDate)}</TableCell>
                        <TableCell>
                          {borrow.dueDate ? (
                            <span className="font-medium">
                              {formatDate(borrow.dueDate)}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {borrow.status === "PENDING" && (
                              <>
                                <Button
                                  variant="default"
                                  size="icon"
                                  onClick={() =>
                                    setActionDialog({
                                      open: true,
                                      borrow,
                                      action: "approve",
                                    })
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  onClick={() =>
                                    setActionDialog({
                                      open: true,
                                      borrow,
                                      action: "reject",
                                    })
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {borrow.status === "APPROVED" && (
                              <Button
                                variant="secondary"
                                size="icon"
                                onClick={() =>
                                  setActionDialog({
                                    open: true,
                                    borrow,
                                    action: "return",
                                  })
                                }
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards - Visible only on mobile */}
              <div className="md:hidden space-y-4">
                {borrows.map((borrow) => (
                  <Card key={borrow.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">
                            {borrow.book.title}
                          </CardTitle>
                          <CardDescription>{borrow.book.author}</CardDescription>
                        </div>
                        {getStatusBadge(borrow.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground mb-1">
                          Peminjam
                        </p>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <Link 
                              href={`/users/${borrow.user.id}/books`}
                              className="font-medium hover:underline"
                            >
                              {borrow.user.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {borrow.user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">Request</p>
                          <p className="font-medium">{formatDate(borrow.requestDate)}</p>
                        </div>
                        {borrow.borrowDate && (
                          <div>
                            <p className="text-muted-foreground mb-1">Pinjam</p>
                            <p className="font-medium">{formatDate(borrow.borrowDate)}</p>
                          </div>
                        )}
                        {borrow.dueDate && (
                          <div>
                            <p className="text-muted-foreground mb-1">Jatuh Tempo</p>
                            <p
                              className={
                                borrow.status === "APPROVED" &&
                                borrow.dueDate &&
                                new Date(borrow.dueDate) < new Date()
                                  ? "text-destructive font-medium"
                                  : "font-medium"
                              }
                            >
                              {formatDate(borrow.dueDate)}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        {borrow.status === "PENDING" && (
                          <>
                            <Button
                              variant="default"
                              className="flex-1"
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  borrow,
                                  action: "approve",
                                })
                              }
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Setujui
                            </Button>
                            <Button
                              variant="destructive"
                              className="flex-1"
                              onClick={() =>
                                setActionDialog({
                                  open: true,
                                  borrow,
                                  action: "reject",
                                })
                              }
                            >
                              <X className="h-4 w-4 mr-2" />
                              Tolak
                            </Button>
                          </>
                        )}
                        {borrow.status === "APPROVED" && (
                          <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() =>
                              setActionDialog({
                                open: true,
                                borrow,
                                action: "return",
                              })
                            }
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Konfirmasi Kembali
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) =>
          setActionDialog({ open, borrow: null, action: null })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === "approve" && "Setujui Peminjaman"}
              {actionDialog.action === "reject" && "Tolak Peminjaman"}
              {actionDialog.action === "return" && "Konfirmasi Pengembalian"}
            </DialogTitle>
            <DialogDescription className="space-y-2">
              {actionDialog.borrow && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Peminjam: 
                        <Link 
                          href={`/users/${actionDialog.borrow.user.id}/books`}
                          className="text-blue-600 hover:text-blue-800 hover:underline ml-1"
                        >
                          {actionDialog.borrow.user.name}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {actionDialog.borrow.user.email}
                      </p>
                    </div>
                  </div>
                  <p className="pt-2">
                    Buku: <span className="font-medium">"{actionDialog.borrow.book.title}"</span> oleh {actionDialog.borrow.book.author}
                  </p>
                </div>
              )}
              <p className="pt-2">
                {actionDialog.action === "approve" &&
                  "Apakah Anda yakin ingin menyetujui peminjaman ini?"}
                {actionDialog.action === "reject" &&
                  "Apakah Anda yakin ingin menolak peminjaman ini?"}
                {actionDialog.action === "return" &&
                  "Apakah Anda yakin ingin mengkonfirmasi pengembalian buku ini?"}
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setActionDialog({ open: false, borrow: null, action: null })
              }
            >
              Batal
            </Button>
            <Button
              variant={
                actionDialog.action === "reject" ? "destructive" : "default"
              }
              onClick={handleAction}
            >
              {actionDialog.action === "approve" && "Setujui"}
              {actionDialog.action === "reject" && "Tolak"}
              {actionDialog.action === "return" && "Konfirmasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
