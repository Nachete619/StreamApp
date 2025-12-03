'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Stream {
  id: string
  title: string
  playback_id: string
  is_live: boolean
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
    bio?: string | null
  }
}

interface HeroCarouselProps {
  streams: Stream[]
}

export function HeroCarousel({ streams }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (streams.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % streams.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [streams.length])

  if (!streams || streams.length === 0) return null

  const currentStream = streams[currentIndex]
  const thumbnailUrl = `https://livepeer.studio/api/stream/${currentStream.playback_id}/thumbnail`
  const timeAgo = formatDistanceToNow(new Date(currentStream.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <div className="relative h-[500px] rounded-xl overflow-hidden card-premium border-2 border-dark-800/50">
      {/* Background Image */}
      <Link href={`/stream/${currentStream.profiles.username}`}>
        <div className="absolute inset-0">
          <Image
            src={thumbnailUrl}
            alt={currentStream.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
        </div>
      </Link>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-8">
        <div className="flex items-end gap-4">
          {/* Avatar */}
          <Link
            href={`/stream/${currentStream.profiles.username}`}
            className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden border-2 border-dark-800"
          >
            {currentStream.profiles.avatar_url ? (
              <Image
                src={currentStream.profiles.avatar_url}
                alt={currentStream.profiles.username}
                width={64}
                height={64}
                className="object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/stream/${currentStream.profiles.username}`}>
              <h2 className="text-2xl font-bold text-dark-50 mb-1 truncate hover:text-accent-500 transition-colors">
                {currentStream.title}
              </h2>
            </Link>
            <p className="text-dark-300 mb-2">{currentStream.profiles.username}</p>
            <div className="flex items-center gap-4 text-sm text-dark-400">
              {currentStream.is_live && (
                <span className="flex items-center gap-2 bg-accent-600 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg shadow-accent-600/50">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  EN VIVO
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                0 espectadores
              </span>
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indicators */}
      {streams.length > 1 && (
        <div className="absolute bottom-4 right-8 flex gap-2">
          {streams.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-accent-500 w-8'
                  : 'bg-dark-600 hover:bg-dark-500'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
