"use client"

import { useState, useRef, useEffect } from "react"
import { Camera, X, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ISBNScannerProps {
  onScan: (isbn: string) => void
  onClose: () => void
  open: boolean
}

export function ISBNScanner({ onScan, onClose, open }: ISBNScannerProps) {
  const [isbn, setIsbn] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)

  useEffect(() => {
    if (open && !cameraActive) {
      startCamera()
    } else if (!open && cameraActive) {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [open, cameraActive])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
      setError("Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.")
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const handleManualInput = async () => {
    if (!isbn.trim()) {
      setError("Masukkan ISBN")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Validate and clean ISBN
      const cleanIsbn = isbn.replace(/[-\s]/g, "")
      if (cleanIsbn.length < 10 || cleanIsbn.length > 13) {
        setError("ISBN harus 10 atau 13 digit")
        setLoading(false)
        return
      }

      onScan(cleanIsbn)
      setIsbn("")
      setLoading(false)
    } catch (err) {
      setError("Terjadi kesalahan")
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Scan atau Masukkan ISBN</DialogTitle>
          <DialogDescription>
            Gunakan kamera untuk scan barcode ISBN atau masukkan secara manual
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera Preview */}
          {cameraActive && (
            <div className="relative w-full bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="border-2 border-white rounded-lg w-64 h-32" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
              {error}
            </div>
          )}

          {/* Manual Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Atau masukkan ISBN manual:</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Masukkan ISBN (10 atau 13 digit)"
                value={isbn}
                onChange={(e) => {
                  setIsbn(e.target.value)
                  setError("")
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleManualInput()
                  }
                }}
              />
              <Button
                onClick={handleManualInput}
                disabled={loading || !isbn.trim()}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!cameraActive ? (
              <Button
                onClick={startCamera}
                variant="outline"
                className="flex-1"
              >
                <Camera className="mr-2 h-4 w-4" />
                Aktifkan Kamera
              </Button>
            ) : (
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Matikan Kamera
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              Batal
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 Tip: Pastikan barcode ISBN jelas dan terang saat scan. Jika tidak
            berhasil, gunakan input manual.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
