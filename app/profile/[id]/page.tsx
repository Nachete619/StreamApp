'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { User, Video, Calendar, Edit2, Save, X, Upload, Heart, Share2, Settings, Globe, Twitter, Youtube, Eye } from 'lucide-react'
import { EnhancedStreamCard } from '@/components/EnhancedStreamCard'
import { XPDisplay } from '@/components/XPDisplay'
import { BadgeDisplay } from '@/components/BadgeDisplay'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/Providers'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  cover_url?: string | null
  total_xp?: number
  level?: number
}

type TabType = 'home' | 'videos' | 'clips' | 'about'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const supabase = createClient()
  const id = params.id as string
  
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streams, setStreams] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar_url: '',
    cover_url: '',
    twitter: '',
    youtube: '',
    website: '',
  })
  const isOwnProfile = currentUser?.id === id

  const fetchData = useCallback(async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await (supabase
        .from('profiles') as any)
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)
      setEditForm({
        username: profileData.username,
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        cover_url: profileData.cover_url || '',
        twitter: '',
        youtube: '',
        website: '',
      })

      // Fetch streams
      const { data: streamsData } = await (supabase
        .from('streams') as any)
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20)

      setStreams(streamsData || [])

      // Fetch videos
      const { data: videosData } = await (supabase
        .from('videos') as any)
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20)

      setVideos(videosData || [])

      // Fetch badges
      const { data: badgesData } = await (supabase
        .from('user_badges') as any)
        .select(`
          badge_id,
          unlocked_at,
          badges:badge_id (
            id,
            name,
            description,
            icon
          )
        `)
        .eq('user_id', id)

      if (badgesData) {
        const formattedBadges = badgesData.map((b: any) => ({
          id: b.badges.id,
          name: b.badges.name,
          description: b.badges.description,
          icon: b.badges.icon,
          unlocked_at: b.unlocked_at,
        }))
        setBadges(formattedBadges)
      }
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }, [id, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSave = async () => {
    if (!isOwnProfile) return

    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url,
          cover_url: editForm.cover_url,
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Perfil actualizado correctamente')
      setEditing(false)
      await fetchData()
      router.refresh()
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Error al actualizar el perfil')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-dark-400">
          <p className="text-lg">Perfil no encontrado</p>
        </div>
      </div>
    )
  }

  const createdAt = formatDistanceToNow(new Date(profile.created_at), {
    addSuffix: false,
    locale: es,
  })

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Banner/Cover Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 overflow-hidden">
        {profile.cover_url ? (
          <Image
            src={profile.cover_url}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 via-accent-500/10 to-dark-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
        
        {/* Edit Cover Button */}
        {isOwnProfile && (
          <button
            onClick={() => setEditing(!editing)}
            className="absolute top-4 right-4 px-4 py-2 bg-dark-900/80 backdrop-blur-sm text-dark-200 rounded-lg hover:bg-dark-800 transition-colors flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            {editing ? 'Cancelar' : 'Editar Perfil'}
          </button>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative -mt-20 px-6 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Avatar */}
          <div className="relative inline-block mb-4">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden border-4 border-dark-900 shadow-xl">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={160}
                  height={160}
                  className="object-cover w-full h-full"
                />
              ) : (
                <User className="w-16 h-16 md:w-20 md:h-20 text-white" />
              )}
            </div>
            {isOwnProfile && editing && (
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-accent-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-accent-500 transition-colors">
                <Upload className="w-5 h-5 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // Handle upload logic here
                    toast('Subida de imagen próximamente. Usa una URL por ahora.')
                  }}
                />
              </label>
            )}
          </div>

          {/* Profile Details */}
          <div className="card-premium p-6 mb-6">
            {editing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="input"
                    placeholder="Nombre de usuario"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    className="input min-h-[120px]"
                    placeholder="Cuéntanos sobre ti..."
                    maxLength={500}
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    {editForm.bio.length}/500 caracteres
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    URL del Avatar
                  </label>
                  <input
                    type="url"
                    value={editForm.avatar_url}
                    onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    URL del Banner
                  </label>
                  <input
                    type="url"
                    value={editForm.cover_url}
                    onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value })}
                    className="input"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm({
                        username: profile.username,
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url || '',
                        cover_url: profile.cover_url || '',
                        twitter: '',
                        youtube: '',
                        website: '',
                      })
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-dark-50 mb-2">
                    {profile.username}
                  </h1>
                  {profile.bio && (
                    <p className="text-dark-300 mb-4 max-w-2xl">{profile.bio}</p>
                  )}
                  <div className="space-y-4">
                    {/* XP and Level Display */}
                    {profile.total_xp !== undefined && profile.level !== undefined && (
                      <div>
                        <XPDisplay
                          totalXP={profile.total_xp || 0}
                          level={profile.level || 1}
                          showProgress={true}
                          size="md"
                        />
                      </div>
                    )}
                    
                    {/* Badges Display */}
                    {badges.length > 0 && (
                      <div>
                        <BadgeDisplay badges={badges} maxDisplay={8} showTooltip={true} />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-sm text-dark-400">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Se unió hace {createdAt}
                      </span>
                      <span className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        {streams?.length || 0} streams
                      </span>
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        {videos?.length || 0} videos
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!isOwnProfile && (
                    <>
                      <button className="btn btn-primary flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Seguir
                      </button>
                      <button className="btn btn-secondary p-2">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {isOwnProfile && (
                    <Link
                      href={`/stream/${profile.username}`}
                      className="btn btn-primary"
                    >
                      Ver mi Stream
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-dark-800 overflow-x-auto scrollbar-hide">
            {[
              { id: 'home' as TabType, label: 'Inicio', count: streams.length },
              { id: 'videos' as TabType, label: 'Vídeos', count: videos.length },
              { id: 'clips' as TabType, label: 'Clips', count: 0 },
              { id: 'about' as TabType, label: 'Acerca de', count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold text-sm transition-all relative ${
                  activeTab === tab.id
                    ? 'text-accent-500'
                    : 'text-dark-400 hover:text-dark-200'
                }`}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="ml-2 text-xs bg-dark-800 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-600" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'home' && (
              <div>
                {streams && streams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {streams.map((stream: any) => (
                      <EnhancedStreamCard key={stream.id} stream={stream} />
                    ))}
                  </div>
                ) : (
                  <div className="card-premium p-16 text-center">
                    <Video className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-dark-300 mb-2">
                      No hay streams todavía
                    </p>
                    <p className="text-dark-500">
                      {isOwnProfile ? 'Crea tu primer stream para comenzar' : 'Este usuario aún no ha transmitido'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div>
                {videos && videos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {videos.map((video: any) => (
                      <Link
                        key={video.id}
                        href={video.playback_url}
                        target="_blank"
                        className="card-premium overflow-hidden group"
                      >
                        <div className="relative aspect-video bg-dark-800">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="w-12 h-12 text-dark-600 group-hover:text-accent-500 transition-colors" />
                          </div>
                          <div className="absolute bottom-2 right-2 bg-dark-900/80 text-white text-xs px-2 py-1 rounded">
                            VOD
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-dark-300 truncate mb-1">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-dark-500">
                            {formatDistanceToNow(new Date(video.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="card-premium p-16 text-center">
                    <Video className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-dark-300 mb-2">
                      No hay videos guardados
                    </p>
                    <p className="text-dark-500">
                      Los videos de tus streams aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clips' && (
              <div className="card-premium p-16 text-center">
                <Video className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-dark-300 mb-2">
                  Próximamente
                </p>
                <p className="text-dark-500">
                  Los clips estarán disponibles pronto
                </p>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="card-premium p-8">
                <h3 className="text-xl font-bold text-dark-50 mb-6">Acerca de</h3>
                {profile.bio ? (
                  <p className="text-dark-300 whitespace-pre-line">{profile.bio}</p>
                ) : (
                  <p className="text-dark-500 italic">
                    {isOwnProfile ? 'Añade una descripción sobre ti en la edición del perfil' : 'Este usuario no ha añadido una descripción'}
                  </p>
                )}
                
                {/* Social Links */}
                <div className="mt-8 pt-8 border-t border-dark-800">
                  <h4 className="text-sm font-semibold text-dark-400 uppercase mb-4">Enlaces</h4>
                  <div className="flex flex-wrap gap-4">
                    {/* Social links would go here */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}