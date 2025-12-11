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
      <div className="relative overflow-hidden rounded-lg bg-dark-900 hover:opacity-90 transition-opacity">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-dark-800 overflow-hidden">
          <Image
            src={thumbnailUrl}
            alt={stream.title}
            fill
            className="object-cover"
            unoptimized
          />
          
          {/* LIVE Badge - Top Left */}
          {stream.is_live && (
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              LIVE
            </div>
          )}
          
          {/* Viewer Count - Bottom Left */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-[11px] font-semibold text-white">
            <Eye className="w-3 h-3" />
            <span>0</span>
          </div>

          {!stream.is_live && (
            <div className="absolute inset-0 bg-dark-900/50 flex items-center justify-center">
              <span className="text-gray-400 text-xs">Offline</span>
            </div>
          )}
        </div>

        {/* Stream Info - Below Thumbnail */}
        <div className="p-3">
          <h3 className="font-semibold text-white text-sm truncate mb-1 group-hover:text-accent-400 transition-colors">
            {stream.title}
          </h3>
          <p className="text-xs text-gray-400 truncate mb-2">
            {stream.profiles.username}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-gray-500">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
