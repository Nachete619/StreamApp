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
            <span>{viewers.toLocaleString()}</span>
          </div>

          {/* Category/Tags - Top Right */}
          {category && (
            <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[10px] font-medium">
              {category}
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
          {/* Tags row - similar to Kick */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {category && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-dark-800 text-gray-300">
                {category}
              </span>
            )}
            <span className="text-[10px] text-gray-500">
              {timeAgo}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
