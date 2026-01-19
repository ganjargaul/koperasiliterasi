import { Card } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { BorrowButton } from "./borrow-button"

interface BookCardProps {
  id: string
  title: string
  author: string
  isbn?: string | null
  description?: string | null
  coverImage?: string | null
  stock: number
  available: number
}

export function BookCard({
  id,
  title,
  author,
  isbn,
  description,
  coverImage,
  stock,
  available,
}: BookCardProps) {
  const isAvailable = available > 0

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      {/* Bagian Gambar */}
      <div className="relative aspect-[3/4] bg-muted border-b border-black overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-sm font-serif text-white uppercase tracking-widest">Tidak Tersedia</span>
          </div>
        )}
      </div>

      {/* Bagian Info - Tanpa kotak di tiap baris teks */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-serif text-xl font-bold uppercase tracking-tight line-clamp-2">
            {title}
          </h3>
          <p className="text-sm italic text-muted-foreground font-serif">{author}</p>
        </div>

        {/* Garis pemisah tipis horizontal */}
        <div className="border-t border-black/20 pt-3 flex justify-between text-[10px] uppercase tracking-widest font-serif">
          {isbn && <span>ISBN: {isbn}</span>}
          <span className={isAvailable ? "font-bold" : "text-muted-foreground"}>
            {isAvailable ? "Tersedia" : "Tidak Tersedia"}
          </span>
        </div>

        <div className="pt-2">
          <BorrowButton
            bookId={id}
            bookTitle={title}
            available={available}
          />
        </div>
      </div>
    </Card>
  )
}
