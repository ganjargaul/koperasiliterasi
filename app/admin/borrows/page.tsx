"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Check, X, RotateCcw, Clock, AlertCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  lender?: {
    id: string
    name: string
    email: string
  } | null
  book: {
    id: string
    title: string
    author: string
  }
  lenderId?: string | null
  userBookId?: string | null
}

export default function AdminBorrowsPage() {
  const router = useRouter()
  const [borrows, setBorrows] = useState<Borrow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    borrow: Borrow | null
    action: "approve" | "reject" | "return" | null
  }>({
    open: false,
    borrow: null,
    action: null,
  })

  const fetchBorrows = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/borrows")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setBorrows(data)
    } catch (error) {
      console.error("Error fetching borrows:", error)
      alert("Gagal mengambil data peminjaman")
    } finally {
      setLoading(false)
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
      
      if (userRole !== "ADMIN") {
        // User is not admin, redirect to catalog
        setIsAuthorized(false)
        setCheckingAuth(false)
        return
      }
      
      // User is admin, allow access
      setIsAuthorized(true)
      setCheckingAuth(false)
      fetchBorrows()
    }
  }, [router])

  const handleAction = async () => {
    if (!actionDialog.borrow || !actionDialog.action) return

    try {
      const response = await fetch(`/api/borrows/${actionDialog.borrow.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: actionDialog.action,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal memproses aksi")
        return
      }

      setActionDialog({ open: false, borrow: null, action: null })
      fetchBorrows()
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

    const labels: Record<string, { text: string; icon?: any }> = {
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

  const filteredBorrows = filterStatus === "all"
    ? borrows
    : borrows.filter((b) => b.status === filterStatus)

  const pendingBorrows = borrows.filter((b) => b.status === "PENDING")

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
          <h1 className="text-3xl font-bold">Manajemen Peminjaman</h1>
          <p className="text-muted-foreground">
            Kelola request peminjaman buku
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/tracking">
              <TrendingUp className="mr-2 h-4 w-4" />
              Tracking
            </Link>
          </Button>
          {pendingBorrows.length > 0 && (
            <Badge variant="default" className="text-lg px-4 py-2">
              {pendingBorrows.length} Request Pending
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Peminjaman</CardTitle>
          <CardDescription>
            Total {filteredBorrows.length} peminjaman
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("all")}
            >
              Semua
            </Button>
            <Button
              variant={filterStatus === "PENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("PENDING")}
            >
              Pending ({pendingBorrows.length})
            </Button>
            <Button
              variant={filterStatus === "APPROVED" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("APPROVED")}
            >
              Approved
            </Button>
            <Button
              variant={filterStatus === "OVERDUE" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("OVERDUE")}
            >
              Overdue
            </Button>
            <Button
              variant={filterStatus === "RETURNED" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("RETURNED")}
            >
              Returned
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : filteredBorrows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada data peminjaman</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Buku</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Pinjam</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Denda</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBorrows.map((borrow) => (
                    <TableRow key={borrow.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{borrow.user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {borrow.user.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{borrow.book.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {borrow.book.author}
                          </p>
                          {borrow.lender && (
                            <p className="text-xs text-blue-600 mt-1">
                              Dari: {borrow.lender.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(borrow.status)}</TableCell>
                      <TableCell>{formatDate(borrow.borrowDate)}</TableCell>
                      <TableCell>
                        {borrow.dueDate ? (
                          <span
                            className={
                              borrow.status === "APPROVED" &&
                              borrow.dueDate &&
                              new Date(borrow.dueDate) < new Date()
                                ? "text-destructive font-medium"
                                : ""
                            }
                          >
                            {formatDate(borrow.dueDate)}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {borrow.latePenalty > 0 ? (
                          <span className="text-destructive font-medium">
                            Rp {borrow.latePenalty.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Admin hanya manage pinjam dari stok admin (tidak ada lenderId) */}
                          {!borrow.lenderId && borrow.status === "PENDING" && (
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
                          {!borrow.lenderId &&
                            borrow.status === "APPROVED" && (
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
                          {borrow.lenderId && (
                            <Badge variant="outline" className="text-xs">
                              Dikelola pemilik
                            </Badge>
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
            <DialogDescription>
              {actionDialog.action === "approve" &&
                `Apakah Anda yakin ingin menyetujui peminjaman buku "${actionDialog.borrow?.book.title}" oleh ${actionDialog.borrow?.user.name}?`}
              {actionDialog.action === "reject" &&
                `Apakah Anda yakin ingin menolak peminjaman buku "${actionDialog.borrow?.book.title}" oleh ${actionDialog.borrow?.user.name}?`}
              {actionDialog.action === "return" &&
                `Apakah Anda yakin ingin mengkonfirmasi pengembalian buku "${actionDialog.borrow?.book.title}" oleh ${actionDialog.borrow?.user.name}?`}
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
