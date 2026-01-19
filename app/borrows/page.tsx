"use client"

import { useState, useEffect } from "react"
import { Clock, CheckCircle, XCircle, RotateCcw, AlertCircle, User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import Link from "next/link"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface Borrow {
  id: string
  userId: string
  bookId: string
  lenderId: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "RETURNED"
  borrowDate: string | null
  dueDate: string | null
  returnDate: string | null
  latePenalty: number
  requestDate: string
  book: {
    id: string
    title: string
    author: string
    coverImage: string | null
  }
  user: {
    id: string
    name: string
    email: string
  }
  lender: {
    id: string
    name: string
    email: string
  }
}

export default function BorrowsPage() {
  const [borrows, setBorrows] = useState<Borrow[]>([])
  const [lenderBorrows, setLenderBorrows] = useState<Borrow[]>([])
  const [loading, setLoading] = useState(true)
  const [lenderLoading, setLenderLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("borrowed")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      if (storedUserId) {
        setUserId(storedUserId)
      } else {
        window.location.href = "/landing"
      }
    }
  }, [])

  const fetchBorrows = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/borrows?userId=${userId}`)
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

  const fetchLenderBorrows = async () => {
    try {
      setLenderLoading(true)
      const response = await fetch(`/api/borrows?lenderId=${userId}`)
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setLenderBorrows(data)
    } catch (error) {
      console.error("Error fetching lender borrows:", error)
      alert("Gagal mengambil data peminjaman")
    } finally {
      setLenderLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchBorrows()
      fetchLenderBorrows()
    }
  }, [userId])

  const getStatusBadge = (status: string, dueDate: string | null) => {
    // Check if overdue
    const isOverdue =
      status === "APPROVED" &&
      dueDate &&
      new Date(dueDate) < new Date()

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Terlambat
        </Badge>
      )
    }

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "outline",
      APPROVED: "default",
      REJECTED: "destructive",
      RETURNED: "secondary",
    }

    const labels: Record<string, { text: string; icon: any }> = {
      PENDING: { text: "Menunggu Persetujuan", icon: Clock },
      APPROVED: { text: "Dipinjam", icon: CheckCircle },
      REJECTED: { text: "Ditolak", icon: XCircle },
      RETURNED: { text: "Dikembalikan", icon: RotateCcw },
    }

    const label = labels[status] || { text: status, icon: null }
    const Icon = label.icon

    return (
      <Badge variant={variants[status] || "outline"} className="flex items-center gap-1">
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

  const getDaysRemaining = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const pendingBorrows = borrows.filter((b) => b.status === "PENDING")
  const approvedBorrows = borrows.filter((b) => b.status === "APPROVED")
  const returnedBorrows = borrows.filter((b) => b.status === "RETURNED")

  const pendingLenderBorrows = lenderBorrows.filter((b) => b.status === "PENDING")
  const approvedLenderBorrows = lenderBorrows.filter((b) => b.status === "APPROVED")
  const returnedLenderBorrows = lenderBorrows.filter((b) => b.status === "RETURNED")

  const renderBorrowCard = (borrow: Borrow, showLender: boolean = false) => {
    const daysRemaining = getDaysRemaining(borrow.dueDate)
    const isOverdue =
      borrow.status === "APPROVED" &&
      borrow.dueDate &&
      new Date(borrow.dueDate) < new Date()
    const isDueSoon =
      borrow.status === "APPROVED" &&
      borrow.dueDate &&
      daysRemaining !== null &&
      daysRemaining <= 3 &&
      daysRemaining > 0

    return (
      <Card
        key={borrow.id}
        className={`transition-colors hover:bg-muted/50 ${
          isOverdue || isDueSoon
            ? "bg-muted/30"
            : ""
        }`}
      >
        {isDueSoon && (
          <div className="px-6 py-2 bg-muted/30">
            <p className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Peringatan:</strong> Buku ini akan jatuh tempo
              dalam {daysRemaining} hari!
            </p>
          </div>
        )}
        {isOverdue && (
          <div className="px-6 py-2 bg-muted/50">
            <p className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <strong>Terlambat!</strong> Buku ini sudah melewati
              tanggal jatuh tempo. Segera kembalikan untuk menghindari
              denda yang lebih besar.
            </p>
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2 font-serif">
                {borrow.book.title}
              </CardTitle>
              <CardDescription className="text-base">
                {borrow.book.author}
              </CardDescription>
              {showLender && borrow.user && (
                <div className="mt-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Dipinjam oleh:</span>
                  <Link 
                    href={`/users/${borrow.user.id}/books`}
                    className="text-sm hover:underline font-medium"
                  >
                    {borrow.user.name}
                  </Link>
                </div>
              )}
              {!showLender && borrow.lender && (
                <div className="mt-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Dipinjamkan oleh:</span>
                  <Link 
                    href={`/users/${borrow.lender.id}/books`}
                    className="text-sm hover:underline font-medium"
                  >
                    {borrow.lender.name}
                  </Link>
                </div>
              )}
            </div>
            {getStatusBadge(borrow.status, borrow.dueDate)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-4">
            <div>
              <p className="mb-1">
                Tanggal Request
              </p>
              <p className="font-medium">
                {formatDate(borrow.requestDate)}
              </p>
            </div>
            {borrow.borrowDate && (
              <div>
                <p className="text-muted-foreground mb-1">
                  Tanggal Pinjam
                </p>
                <p className="font-medium">
                  {formatDate(borrow.borrowDate)}
                </p>
              </div>
            )}
            {borrow.dueDate && (
              <div>
                <p className="text-muted-foreground mb-1">
                  Jatuh Tempo
                </p>
                <p
                  className={`font-medium ${
                    isOverdue ? "text-destructive" : isDueSoon ? "text-orange-600" : ""
                  }`}
                >
                  {formatDate(borrow.dueDate)}
                  {daysRemaining !== null && daysRemaining > 0 && !isOverdue && (
                    <span className={`ml-2 ${isDueSoon ? "text-orange-600 font-semibold" : "text-muted-foreground"}`}>
                      ({daysRemaining} hari lagi)
                    </span>
                  )}
                  {isOverdue && (
                    <span className="text-destructive ml-2 font-semibold">
                      ({Math.abs(daysRemaining || 0)} hari terlambat)
                    </span>
                  )}
                </p>
              </div>
            )}
            {borrow.returnDate && (
              <div>
                <p className="text-muted-foreground mb-1">
                  Tanggal Kembali
                </p>
                <p className="font-medium">
                  {formatDate(borrow.returnDate)}
                </p>
              </div>
            )}
            {borrow.latePenalty > 0 && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-1">Denda</p>
                <p className="font-medium text-destructive">
                  Rp {borrow.latePenalty.toLocaleString("id-ID")}
                </p>
              </div>
            )}
            {isOverdue && borrow.latePenalty === 0 && (
              <div className="md:col-span-2">
                <p className="text-muted-foreground mb-1">
                  Estimasi Denda
                </p>
                <p className="font-medium text-orange-600">
                  Rp{" "}
                  {(
                    Math.abs(daysRemaining || 0) * 5000
                  ).toLocaleString("id-ID")}{" "}
                  ({Math.abs(daysRemaining || 0)} hari × Rp 5.000)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="pb-4 mb-6">
        <h1 className="text-3xl font-serif font-bold mb-2">Riwayat Peminjaman</h1>
        <p className="text-sm">
          Lihat status dan riwayat peminjaman buku Anda
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="borrowed" className="text-xs sm:text-sm">Buku yang Saya Pinjam</TabsTrigger>
          <TabsTrigger value="lent" className="text-xs sm:text-sm">Buku Saya yang Dipinjam</TabsTrigger>
        </TabsList>

        {/* Tab: Buku yang Saya Pinjam */}
        <TabsContent value="borrowed" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-2xl font-serif">{pendingBorrows.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Sedang Dipinjam</CardDescription>
                <CardTitle className="text-2xl font-serif">{approvedBorrows.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Dikembalikan</CardDescription>
                <CardTitle className="text-2xl font-serif">{returnedBorrows.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Borrows List */}
          {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          </CardContent>
        </Card>
      ) : borrows.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Belum ada riwayat peminjaman
              </h3>
              <p className="text-muted-foreground">
                Mulai pinjam buku dari katalog untuk melihat riwayat di sini
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {borrows.map((borrow) => renderBorrowCard(borrow, false))}
        </div>
      )}
        </TabsContent>

        {/* Tab: Buku Saya yang Dipinjam */}
        <TabsContent value="lent" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Pending</CardDescription>
                <CardTitle className="text-2xl font-serif">{pendingLenderBorrows.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Sedang Dipinjam</CardDescription>
                <CardTitle className="text-2xl font-serif">{approvedLenderBorrows.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Dikembalikan</CardDescription>
                <CardTitle className="text-2xl font-serif">{returnedLenderBorrows.length}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Lender Borrows List */}
          {lenderLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
                  <p className="text-muted-foreground">Memuat data...</p>
                </div>
              </CardContent>
            </Card>
          ) : lenderBorrows.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Belum ada yang meminjam buku Anda
                  </h3>
                  <p className="text-muted-foreground">
                    Buku koleksi Anda yang dipinjam akan muncul di sini
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {lenderBorrows.map((borrow) => renderBorrowCard(borrow, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
