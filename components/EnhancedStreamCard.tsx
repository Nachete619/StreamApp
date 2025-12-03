'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Eye, User, Radio } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface EnhancedStreamCardProps {
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
  category?: string
  viewers?: number
}

export function EnhancedStreamCard({ stream, category, viewers = 0 }: EnhancedStreamCardProps) {
  const thumbnailUrl = `https://livepeer.studio/api/stream/${stream.playback_id}/thumbnail`
  const timeAgo = formatDistanceToNow(new Date(stream.created_at), {
    addSuffix: true,
    locale: es,
  })

  return (
    <Link href={`/stream/${stream.profiles.username}`} className="group">
      <div className="card-premium overflow-hidden border-2 border-transparent hover:border-accent-600/30 transition-all duration-300">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-dark-800 overflow-hidden">
          {stream.is_live && (
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-accent-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-accent-600/50">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              EN VIVO
            </div>
          )}
          
          {category && (
            <div className="absolute top-3 right-3 z-10 bg-dark-900/80 backdrop-blur-sm text-dark-200 px-2.5 py-1 rounded-full text-xs font-medium">
              {category}
            </div>
          )}
          
          <Image
            src={thumbnailUrl}
            alt={stream.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            unoptimized
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent opacity-60" />
          
          {/* Viewer Count */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-dark-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Eye className="w-3.5 h-3.5 text-dark-400" />
            <span className="text-xs font-semibold text-dark-100">{viewers.toLocaleString()}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden ring-2 ring-dark-800 group-hover:ring-accent-600/50 transition-all">
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
              <h3 className="font-bold text-dark-50 truncate group-hover:text-accent-400 transition-colors mb-1">
                {stream.title}
              </h3>
              <p className="text-sm text-dark-400 truncate mb-1">
                {stream.profiles.username}
              </p>
              <p className="text-xs text-dark-500">
                {timeAgo}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
