"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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

      // Store user data (in production, use proper session management)
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
      console.error("Login error:", error)
      setError("Terjadi kesalahan saat login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Masukkan password"
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
            Masuk...
          </>
        ) : (
          "Masuk"
        )}
      </Button>
    </form>
  )
}
