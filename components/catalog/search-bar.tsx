"use client"

import { Search, X, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  filterAvailable: string
  onFilterAvailableChange: (filter: string) => void
  filterLocation?: string
  onFilterLocationChange?: (location: string) => void
  availableLocations?: string[]
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  filterAvailable,
  onFilterAvailableChange,
  filterLocation,
  onFilterLocationChange,
  availableLocations = [],
}: SearchBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Cari buku berdasarkan judul, penulis, atau ISBN..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex gap-4 flex-wrap">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Terbaru</SelectItem>
            <SelectItem value="oldest">Terlama</SelectItem>
            <SelectItem value="title-asc">Judul A-Z</SelectItem>
            <SelectItem value="title-desc">Judul Z-A</SelectItem>
            <SelectItem value="author-asc">Penulis A-Z</SelectItem>
            <SelectItem value="author-desc">Penulis Z-A</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAvailable} onValueChange={onFilterAvailableChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Ketersediaan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="available">Tersedia</SelectItem>
            <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
          </SelectContent>
        </Select>
        {onFilterLocationChange && (
          <Select value={filterLocation || "all"} onValueChange={onFilterLocationChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              {availableLocations.map((location) => (
                <SelectItem key={location} value={location}>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{location}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
