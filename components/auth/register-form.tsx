"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Password tidak cocok")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registrasi gagal")
        setLoading(false)
        return
      }

      // Auto login after register
      if (typeof window !== "undefined") {
        localStorage.setItem("userId", data.user.id)
        localStorage.setItem("userName", data.user.name)
        localStorage.setItem("userEmail", data.user.email)
        localStorage.setItem("userRole", data.user.role)
        
        // Call onSuccess callback first
        onSuccess?.()
        
        // Use window.location.href for full page reload to ensure localStorage is properly set
        // This ensures the navbar and other components can read the localStorage immediately
        window.location.href = "/catalog"
      } else {
        onSuccess?.()
        router.push("/catalog")
      }
    } catch (error) {
      console.error("Register error:", error)
      setError("Terjadi kesalahan saat registrasi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Nama lengkap"
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
          placeholder="nama@example.com"
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
          placeholder="Minimal 6 karakter"
          minLength={6}
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          placeholder="Ulangi password"
          minLength={6}
        />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mendaftar...
          </>
        ) : (
          "Daftar"
        )}
      </Button>
    </form>
  )
}
