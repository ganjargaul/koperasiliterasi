"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock, CheckCircle, XCircle, RotateCcw, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface TrackingStats {
  total: number
  pending: number
  approved: number
  overdue: number
  returned: number
  rejected: number
  totalLatePenalty: number
  dueSoon: number
}

interface Borrow {
  id: string
  userId: string
  bookId: string
  status: string
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
}

export default function TrackingPage() {
  const router = useRouter()
  const [stats, setStats] = useState<TrackingStats | null>(null)
  const [overdueBooks, setOverdueBooks] = useState<Borrow[]>([])
  const [dueSoonBooks, setDueSoonBooks] = useState<Borrow[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  const fetchTrackingData = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/borrows/tracking")
      if (!response.ok) throw new Error("Gagal mengambil data")
      const data = await response.json()
      setStats(data.stats)
      setOverdueBooks(data.overdueBooks)
      setDueSoonBooks(data.dueSoonBooks)
    } catch (error) {
      console.error("Error fetching tracking data:", error)
      alert("Gagal mengambil data tracking")
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
      fetchTrackingData()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchTrackingData, 30000)
      return () => clearInterval(interval)
    }
  }, [router])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getDaysOverdue = (dueDate: string | null) => {
    if (!dueDate) return 0
    const due = new Date(dueDate)
    const now = new Date()
    return Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const due = new Date(dueDate)
    const now = new Date()
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Memuat data tracking...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Tidak ada data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tracking & Monitoring</h1>
          <p className="text-muted-foreground">
            Pantau status peminjaman, due dates, dan denda
          </p>
        </div>
        <Button onClick={fetchTrackingData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Peminjaman</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending
            </CardDescription>
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved
            </CardDescription>
            <CardTitle className="text-2xl">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Overdue
            </CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {stats.overdue}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Returned
            </CardDescription>
            <CardTitle className="text-2xl">{stats.returned}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
            </CardDescription>
            <CardTitle className="text-2xl">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Due Soon (≤3 hari)
            </CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              {stats.dueSoon}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Total Denda
            </CardDescription>
            <CardTitle className="text-2xl">
              Rp {stats.totalLatePenalty.toLocaleString("id-ID")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Overdue Books Alert */}
      {overdueBooks.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Buku Terlambat ({overdueBooks.length})
            </CardTitle>
            <CardDescription>
              Buku yang sudah melewati tanggal jatuh tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Buku</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Terlambat</TableHead>
                    <TableHead>Estimasi Denda</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueBooks.map((borrow) => {
                    const daysOverdue = getDaysOverdue(borrow.dueDate)
                    const estimatedPenalty = daysOverdue * 5000

                    return (
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
                          </div>
                        </TableCell>
                        <TableCell className="text-destructive font-medium">
                          {formatDate(borrow.dueDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {daysOverdue} hari
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-destructive">
                          Rp {estimatedPenalty.toLocaleString("id-ID")}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Due Soon Books Alert */}
      {dueSoonBooks.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Clock className="h-5 w-5" />
              Akan Jatuh Tempo ({dueSoonBooks.length})
            </CardTitle>
            <CardDescription>
              Buku yang akan jatuh tempo dalam 3 hari ke depan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Buku</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Sisa Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dueSoonBooks.map((borrow) => {
                    const daysUntilDue = getDaysUntilDue(borrow.dueDate)

                    return (
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
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatDate(borrow.dueDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            {daysUntilDue} hari lagi
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Alerts */}
      {overdueBooks.length === 0 && dueSoonBooks.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Semua Peminjaman Tepat Waktu
              </h3>
              <p className="text-muted-foreground">
                Tidak ada buku yang terlambat atau akan jatuh tempo
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
