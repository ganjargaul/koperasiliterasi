"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect if already logged in as admin
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("userId")
      const userRole = localStorage.getItem("userRole")
      
      if (userId && userRole === "ADMIN") {
        router.push("/admin")
      }
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Login gagal")
        setLoading(false)
        return
      }

      // Check if user is admin
      if (data.user.role !== "ADMIN") {
        setError("Akses ditolak. Hanya administrator yang dapat login di sini.")
        setLoading(false)
        return
      }

      // Store user data
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", data.user.id)
        localStorage.setItem("userName", data.user.name)
        localStorage.setItem("userEmail", data.user.email)
        localStorage.setItem("userRole", data.user.role)
        
        // Redirect to admin dashboard
        window.location.href = "/admin"
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Login Administrator</CardTitle>
          <CardDescription>
            Masuk sebagai administrator untuk mengakses dashboard admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Masukkan password"
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Masuk...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Masuk sebagai Admin
                </>
              )}
            </Button>
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">
                <Link 
                  href="/admin/create-admin" 
                  className="hover:underline text-primary"
                >
                  Buat akun admin baru
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                <Link 
                  href="/landing" 
                  className="hover:underline"
                >
                  Kembali ke halaman utama
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
