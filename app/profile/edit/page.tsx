"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function EditProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [email, setEmail] = useState<string>("")
  const [profileImage, setProfileImage] = useState<string>("")
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [bio, setBio] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [instagram, setInstagram] = useState<string>("")
  const [twitter, setTwitter] = useState<string>("")
  const [facebook, setFacebook] = useState<string>("")
  const [website, setWebsite] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId")
      if (!storedUserId) {
        router.push("/landing")
        return
      }
      setUserId(storedUserId)
      fetchProfile(storedUserId)
    }
  }, [router])

  const fetchProfile = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error("Gagal mengambil profil")
      
      const data = await response.json()
      setEmail(data.email || "")
      setProfileImage(data.profileImage || "")
      setProfileImagePreview(data.profileImage || null)
      setBio(data.bio || "")
      setLocation(data.location || "")
      
      // Parse social media JSON
      if (data.socialMedia) {
        try {
          const social = JSON.parse(data.socialMedia)
          setInstagram(social.instagram || "")
          setTwitter(social.twitter || "")
          setFacebook(social.facebook || "")
          setWebsite(social.website || "")
        } catch (e) {
          console.error("Error parsing social media:", e)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      alert("Gagal mengambil profil")
    } finally {
      setLoading(false)
    }
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setProfileImageFile(null)
    setProfileImagePreview(null)
    setProfileImage("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setSaving(true)
    try {
      // Prepare social media object
      const socialMediaData: any = {}
      if (instagram.trim()) socialMediaData.instagram = instagram.trim()
      if (twitter.trim()) socialMediaData.twitter = twitter.trim()
      if (facebook.trim()) socialMediaData.facebook = facebook.trim()
      if (website.trim()) socialMediaData.website = website.trim()

      const socialMedia = Object.keys(socialMediaData).length > 0 
        ? socialMediaData 
        : null

      // Handle profile image
      let finalProfileImage: string | null = profileImage || null
      if (profileImageFile) {
        finalProfileImage = await convertImageToBase64(profileImageFile)
      } else if (!profileImagePreview && !profileImage) {
        finalProfileImage = null
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (email && !emailRegex.test(email.trim())) {
        alert("Format email tidak valid")
        return
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim() || undefined,
          profileImage: finalProfileImage || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          socialMedia: socialMedia,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Gagal mengupdate profil")
        return
      }

      alert("Profil berhasil diupdate!")
      router.push(`/users/${userId}/books`)
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Terjadi kesalahan saat mengupdate profil")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Kembali
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit Profil</CardTitle>
          <CardDescription>
            Perbarui informasi profil Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Email digunakan untuk login dan notifikasi
              </p>
            </div>

            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Foto Profil</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImagePreview || profileImage || undefined} />
                  <AvatarFallback className="text-2xl">
                    {typeof window !== "undefined" 
                      ? (localStorage.getItem("userName") || "U")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                  <Input
                    type="url"
                    value={profileImage}
                    onChange={(e) => {
                      setProfileImage(e.target.value)
                      setProfileImagePreview(e.target.value || null)
                    }}
                    placeholder="Atau masukkan URL foto profil"
                  />
                  {(profileImagePreview || profileImage) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hapus Foto
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio Singkat</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan sedikit tentang diri Anda..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {bio.length}/500 karakter
              </p>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Jakarta, Bandung, Surabaya..."
              />
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <Label>Media Sosial</Label>
              
              <div className="space-y-2">
                <Label htmlFor="instagram" className="text-sm text-muted-foreground">
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter" className="text-sm text-muted-foreground">
                  Twitter/X
                </Label>
                <Input
                  id="twitter"
                  type="url"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder="https://twitter.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook" className="text-sm text-muted-foreground">
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-sm text-muted-foreground">
                  Website/Blog
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
