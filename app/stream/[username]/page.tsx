'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { HLSPlayer } from '@/components/HLSPlayer'
import { LiveChat } from '@/components/LiveChat'
import { StreamViewTracker } from '@/components/StreamViewTracker'
import { User, Eye, Heart, Share2, Video } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function StreamPage() {
  const params = useParams()
  const username = params.username as string
  const supabase = createClient()
  
  const [profile, setProfile] = useState<any>(null)
  const [stream, setStream] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Get profile by username
        const { data: profileData } = await (supabase
          .from('profiles') as any)
          .select('*')
          .eq('username', username)
          .single()

        if (!profileData) {
          window.location.href = '/'
          return
        }

        setProfile(profileData)

        // Get stream
        const { data: streamData } = await (supabase
          .from('streams') as any)
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        setStream(streamData)

        // Get videos
        const { data: videosData } = await (supabase
          .from('videos') as any)
          .select('*')
          .eq('user_id', profileData.id)
          .order('created_at', { ascending: false })
          .limit(6)

        setVideos(videosData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Poll for stream updates every 5 seconds if stream exists and is marked as live
    const interval = setInterval(async () => {
      if (profile) {
        try {
          const { data } = await (supabase
            .from('streams') as any)
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (data) {
            setStream(data)
          }
        } catch (error) {
          console.error('Error polling stream:', error)
        }
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [username, supabase, profile?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Stream Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video Player */}
            <div className="relative aspect-video bg-dark-900 rounded-lg overflow-hidden border border-dark-800">
              {stream && stream.is_live && stream.playback_id ? (
                <>
                  <HLSPlayer playbackId={stream.playback_id} />
                  <StreamViewTracker streamId={stream.id} isLive={stream.is_live} />
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-dark-900">
                  <div className="text-center text-dark-400">
                    <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Este streamer no está transmitiendo en este momento</p>
                    <p className="text-sm mt-2">Vuelve más tarde para ver contenido en vivo</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stream Info */}
            <div className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-dark-50 mb-2">
                    {stream?.title || `${profile.username} - Offline`}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    {stream?.is_live && (
                      <span className="flex items-center gap-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        EN VIVO
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      0 espectadores
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn btn-secondary flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Seguir
                  </button>
                  <button className="btn btn-secondary p-2">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Streamer Info */}
              <div className="flex items-center gap-4 pt-4 border-t border-dark-800">
                <Link
                  href={`/profile/${profile.id}`}
                  className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center overflow-hidden border-2 border-dark-800"
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={64}
                      height={64}
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/profile/${profile.id}`}
                    className="text-lg font-semibold text-dark-50 hover:text-accent-400 transition-colors"
                  >
                    {profile.username}
                  </Link>
                  {profile.bio && (
                    <p className="text-dark-400 text-sm mt-1">{profile.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Previous Videos */}
            {videos && videos.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-dark-50 mb-4">Videos Anteriores</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((video: any) => (
                    <Link
                      key={video.id}
                      href={video.playback_url}
                      target="_blank"
                      className="card-hover overflow-hidden"
                    >
                      <div className="relative aspect-video bg-dark-800">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Video className="w-12 h-12 text-dark-600" />
                        </div>
                        <div className="absolute bottom-2 right-2 bg-dark-900/80 text-white text-xs px-2 py-1 rounded">
                          VOD
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-sm text-dark-300 truncate">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            {stream ? (
              <div className="sticky top-20 h-[calc(100vh-5rem)]">
                <LiveChat streamId={stream.id} isLive={stream.is_live} />
              </div>
            ) : (
              <div className="card p-6 h-[calc(100vh-5rem)] flex items-center justify-center">
                <div className="text-center text-dark-400">
                  <p className="text-sm">El chat estará disponible cuando el stream esté en vivo</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
