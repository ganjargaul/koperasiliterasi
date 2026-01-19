"use client"

import { User, MapPin, Instagram, Twitter, Facebook, Link as LinkIcon, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface SocialMedia {
  instagram?: string
  twitter?: string
  facebook?: string
  website?: string
  [key: string]: string | undefined
}

interface UserProfileProps {
  userId: string
  name: string
  email?: string
  profileImage?: string | null
  bio?: string | null
  location?: string | null
  socialMedia?: string | null
  isOwnProfile?: boolean
  totalBooks?: number
  availableBooks?: number
}

export function UserProfile({
  userId,
  name,
  email,
  profileImage,
  bio,
  location,
  socialMedia,
  isOwnProfile = false,
  totalBooks = 0,
  availableBooks = 0,
}: UserProfileProps) {
  let socialLinks: SocialMedia = {}
  
  if (socialMedia) {
    try {
      socialLinks = JSON.parse(socialMedia)
    } catch (e) {
      console.error("Error parsing social media:", e)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Profile Image */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage src={profileImage || undefined} alt={name} />
              <AvatarFallback className="text-2xl md:text-3xl">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{name}</h2>
                {email && (
                  <p className="text-sm text-muted-foreground">{email}</p>
                )}
              </div>
              {isOwnProfile && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile/edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profil
                  </Link>
                </Button>
              )}
            </div>

            {/* Bio */}
            {bio && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bio}
              </p>
            )}

            {/* Location */}
            {location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{location}</span>
              </div>
            )}

            {/* Stats */}
            <div className="flex gap-4 pt-2">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{totalBooks}</span>
                <span className="text-xs text-muted-foreground">Total Buku</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-green-600">{availableBooks}</span>
                <span className="text-xs text-muted-foreground">Tersedia</span>
              </div>
            </div>

            {/* Social Media Links */}
            {(socialLinks.instagram || socialLinks.twitter || socialLinks.facebook || socialLinks.website) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {socialLinks.instagram && (
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-pink-600 hover:text-pink-700 hover:underline"
                  >
                    <Instagram className="h-4 w-4" />
                    <span>Instagram</span>
                  </a>
                )}
                {socialLinks.twitter && (
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-500 hover:underline"
                  >
                    <Twitter className="h-4 w-4" />
                    <span>Twitter</span>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>Facebook</span>
                  </a>
                )}
                {socialLinks.website && (
                  <a
                    href={socialLinks.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span>Website</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
