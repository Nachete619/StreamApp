'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, User } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface StreamCardProps {
  stream: {
    id: string
    title: string
    playback_id: string
    is_live: boolean
    created_at: string
    profiles: {
      username: string
      avatar_url: string | null
    }
  }
}

export function StreamCard({ stream }: StreamCardProps) {
  const thumbnailUrl = `https://livepeer.studio/api/stream/${stream.playback_id}/thumbnail`
  const timeAgo = formatDistanceToNow(new Date(stream.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <Link href={`/stream/${stream.profiles.username}`} className="group">
      <div className="card-hover overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-dark-800 overflow-hidden">
          {stream.is_live && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-accent-600 text-white px-2 py-1 rounded text-xs font-semibold shadow-lg shadow-accent-600/50">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              EN VIVO
            </div>
          )}
          <Image
            src={thumbnailUrl}
            alt={stream.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
          {!stream.is_live && (
            <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center">
              <span className="text-dark-400 text-sm">Offline</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden">
              {stream.profiles.avatar_url ? (
                <Image
                  src={stream.profiles.avatar_url}
                  alt={stream.profiles.username}
                  width={40}
                  height={40}
                  className="object-cover"
                />
              ) : (
                <User className="w-5 h-5 text-white" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-dark-50 truncate group-hover:text-accent-500 transition-colors">
                {stream.title}
              </h3>
              <p className="text-sm text-dark-400 truncate">
                {stream.profiles.username}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-dark-500">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  0
                </span>
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
