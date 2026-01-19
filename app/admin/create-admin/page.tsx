"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, UserPlus, CheckCircle, AlertCircle } from "lucide-react"

export default function CreateAdminPage() {
  const router = useRouter()
  const [name, setName] = useState("Administrator")
  const [email, setEmail] = useState("admin@bukabuku.com")
  const [password, setPassword] = useState("admin123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [createdUser, setCreatedUser] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      const response = await fetch("/api/users/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Gagal membuat user admin")
        setLoading(false)
        return
      }

      setSuccess(true)
      setCreatedUser(data)
      setLoading(false)
    } catch (error) {
      console.error("Error creating admin:", error)
      setError("Terjadi kesalahan saat membuat user admin")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Buat User Admin</CardTitle>
          <CardDescription>
            Buat akun administrator untuk mengakses dashboard admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && createdUser ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <p className="font-semibold">User Admin Berhasil Dibuat!</p>
                </div>
                <div className="text-sm text-green-600 space-y-1">
                  <p><strong>Nama:</strong> {createdUser.user.name}</p>
                  <p><strong>Email:</strong> {createdUser.user.email}</p>
                  <p><strong>Role:</strong> {createdUser.user.role}</p>
                </div>
                {createdUser.credentials && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs font-semibold text-green-700 mb-2">Kredensial Login:</p>
                    <div className="bg-white rounded p-2 space-y-1 text-xs">
                      <p><strong>Email:</strong> {createdUser.credentials.email}</p>
                      <p><strong>Password:</strong> {createdUser.credentials.password}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={() => router.push("/admin/login")} 
                  className="w-full"
                >
                  Login sebagai Admin
                </Button>
                <Button 
                  onClick={() => {
                    setSuccess(false)
                    setCreatedUser(null)
                  }} 
                  variant="outline" 
                  className="w-full"
                >
                  Buat Admin Lain
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Administrator"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@bukabuku.com"
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
                <p className="text-xs text-muted-foreground mt-1">
                  Password minimal 6 karakter
                </p>
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
                    Membuat Admin...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Buat User Admin
                  </>
                )}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => router.push("/admin/login")}
                  className="text-xs"
                >
                  Sudah punya akun admin? Login di sini
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
