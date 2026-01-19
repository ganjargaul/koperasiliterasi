"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, LayoutDashboard, Library, History, BookMarked, Users, Bell, LogOut, User, Edit, ChevronDown, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"

const navigation = [
  {
    name: "Katalog Buku",
    href: "/catalog",
    icon: Library,
  },
  {
    name: "Koleksi Saya",
    href: "/my-books",
    icon: BookMarked,
  },
  {
    name: "Request Saya",
    href: "/my-requests",
    icon: Bell,
  },
  {
    name: "Riwayat Pinjam",
    href: "/borrows",
    icon: History,
  },
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    adminOnly: true,
  },
]

export function Navbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [loginOpen, setLoginOpen] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const fetchPendingRequestsCount = async (userId: string) => {
    try {
      const response = await fetch(`/api/borrows/my-requests?lenderId=${userId}&countOnly=true`)
      if (response.ok) {
        const data = await response.json()
        setPendingRequestsCount(data.count || 0)
      }
    } catch (error) {
      console.error("Error fetching pending requests count:", error)
    }
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("userId")
      const name = localStorage.getItem("userName")
      setIsLoggedIn(!!userId)
      setUserName(name || "")
      
      // Fetch pending requests count if logged in
      if (userId) {
        fetchPendingRequestsCount(userId)
        // Set up polling to check for new requests every 30 seconds
        const interval = setInterval(() => {
          fetchPendingRequestsCount(userId)
        }, 30000) // Check every 30 seconds

        return () => clearInterval(interval)
      }
    }
  }, [])

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userId")
      localStorage.removeItem("userName")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("userRole")
      setIsLoggedIn(false)
      window.location.href = "/landing"
    }
  }

  // Don't show navbar on landing page, admin login, and create admin page
  if (pathname === "/landing" || pathname === "/admin/login" || pathname === "/admin/create-admin") {
    return null
  }

  return (
    <nav className="border-b border-border bg-background shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between border-b border-border">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <Link href={isLoggedIn ? "/catalog" : "/landing"} className="text-lg sm:text-xl font-bold">
              <span className="hidden sm:inline">Koperasi Literasi</span>
              <span className="sm:hidden">KL</span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            {isLoggedIn ? (
              <>
                {/* Desktop Navigation - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-1">
                  {navigation
                    .filter((item) => {
                      // Filter admin only items
                      if (item.adminOnly) {
                        const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null
                        return role === "ADMIN"
                      }
                      return true
                    })
                    .map((item) => {
                      const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                      const isRequestItem = item.href === "/my-requests"
                      const showBadge = isRequestItem && pendingRequestsCount > 0
                      
                      return (
                        <Button
                          key={item.name}
                          asChild
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className="relative"
                        >
                          <Link href={item.href} className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {item.name}
                            {showBadge && (
                              <Badge 
                                variant="destructive" 
                                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                              >
                                {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                              </Badge>
                            )}
                          </Link>
                        </Button>
                      )
                    })}
                </div>

                {/* Desktop User Menu - Hidden on mobile */}
                <div className="hidden md:flex items-center gap-2 ml-4 pl-4 border-l">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">{userName}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Akun Saya</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Profil Saya</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile/edit" className="flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                          <span>Edit Profil</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>Keluar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile Menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Menu</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {navigation
                        .filter((item) => {
                          if (item.adminOnly) {
                            const role = typeof window !== "undefined" ? localStorage.getItem("userRole") : null
                            return role === "ADMIN"
                          }
                          return true
                        })
                        .map((item) => {
                          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                          const isRequestItem = item.href === "/my-requests"
                          const showBadge = isRequestItem && pendingRequestsCount > 0
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                            >
                              <item.icon className="h-5 w-5" />
                              <span className="font-medium">{item.name}</span>
                              {showBadge && (
                                <Badge 
                                  variant="destructive" 
                                  className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                                >
                                  {pendingRequestsCount > 9 ? "9+" : pendingRequestsCount}
                                </Badge>
                              )}
                            </Link>
                          )
                        })}
                      
                      <div className="pt-4 border-t space-y-2">
                        <div className="px-4 py-2">
                          <p className="text-sm font-semibold text-muted-foreground mb-2">Akun</p>
                          <div className="flex items-center gap-2 mb-4">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{userName}</span>
                          </div>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <User className="h-5 w-5" />
                          <span>Profil Saya</span>
                        </Link>
                        <Link
                          href="/profile/edit"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <Edit className="h-5 w-5" />
                          <span>Edit Profil</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-destructive w-full text-left"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Masuk
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Masuk</DialogTitle>
                      <DialogDescription>
                        Masuk ke akun Anda untuk mengakses semua fitur
                      </DialogDescription>
                    </DialogHeader>
                    <LoginForm onSuccess={() => {
                      setLoginOpen(false)
                      setIsLoggedIn(true)
                      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
                      const name = typeof window !== "undefined" ? localStorage.getItem("userName") || "" : ""
                      setUserName(name)
                      if (userId) {
                        fetchPendingRequestsCount(userId)
                      }
                    }} />
                  </DialogContent>
                </Dialog>
                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">Daftar</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Daftar</DialogTitle>
                      <DialogDescription>
                        Buat akun baru untuk mulai meminjam dan meminjamkan buku
                      </DialogDescription>
                    </DialogHeader>
                    <RegisterForm onSuccess={() => {
                      setRegisterOpen(false)
                      setIsLoggedIn(true)
                      const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null
                      const name = typeof window !== "undefined" ? localStorage.getItem("userName") || "" : ""
                      setUserName(name)
                      if (userId) {
                        fetchPendingRequestsCount(userId)
                      }
                    }} />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
