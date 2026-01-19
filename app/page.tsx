"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
    
    if (userId) {
      // User is logged in, redirect to catalog
      router.push("/catalog")
    } else {
      // User not logged in, redirect to landing
      router.push("/landing")
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Memuat...</p>
    </div>
  )
}
