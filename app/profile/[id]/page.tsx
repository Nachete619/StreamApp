'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { User, Video, Calendar, Edit2, Save, X, Upload } from 'lucide-react'
import { StreamCard } from '@/components/StreamCard'
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
}

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const supabase = createClient()
  const id = params.id as string
  
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streams, setStreams] = useState<any[]>([])
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar_url: '',
  })
  const [uploading, setUploading] = useState(false)
  const isOwnProfile = currentUser?.id === id

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)
      setEditForm({
        username: profileData.username,
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
      })

      // Fetch streams
      const { data: streamsData } = await supabase
        .from('streams')
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
      const { data: videosData } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(20)

      setVideos(videosData || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar el perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!isOwnProfile) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: editForm.username,
          bio: editForm.bio,
          avatar_url: editForm.avatar_url,
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Note: You'll need to set up Supabase Storage bucket for avatars
    // For now, we'll just show a placeholder
    toast.info('Subida de avatar próximamente. Usa una URL por ahora.')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16 text-dark-400">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-16 text-dark-400">
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <div className="card p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden border-4 border-dark-800 flex-shrink-0">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  width={128}
                  height={128}
                  className="object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-white" />
              )}
            </div>
            {isOwnProfile && editing && (
              <label className="absolute inset-0 rounded-full bg-dark-900/80 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="w-6 h-6 text-accent-500" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="input text-3xl font-bold"
                  placeholder="Nombre de usuario"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="input min-h-[100px]"
                  placeholder="Descripción"
                  maxLength={500}
                />
                <input
                  type="url"
                  value={editForm.avatar_url}
                  onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                  className="input"
                  placeholder="URL del avatar"
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-dark-50 mb-2">{profile.username}</h1>
                {profile.bio && (
                  <p className="text-dark-300 mb-4">{profile.bio}</p>
                )}
                <div className="flex items-center gap-6 text-sm text-dark-400">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Se unió hace {createdAt}
                  </span>
                  <span className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    {streams?.length || 0} streams
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {isOwnProfile ? (
              editing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="btn btn-primary flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm({
                        username: profile.username,
                        bio: profile.bio || '',
                        avatar_url: profile.avatar_url || '',
                      })
                    }}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href={`/stream/${profile.username}`}
                    className="btn btn-primary"
                  >
                    Ver Stream
                  </Link>
                  <button
                    onClick={() => setEditing(true)}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                </>
              )
            ) : (
              <>
                <Link
                  href={`/stream/${profile.username}`}
                  className="btn btn-primary"
                >
                  Ver Stream
                </Link>
                <button className="btn btn-secondary">
                  Seguir
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      {isOwnProfile && (
        <div className="flex gap-4 mb-8 border-b border-dark-800">
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'view'
                ? 'text-accent-500 border-b-2 border-accent-500'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Contenido
          </button>
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'edit'
                ? 'text-accent-500 border-b-2 border-accent-500'
                : 'text-dark-400 hover:text-dark-200'
            }`}
          >
            Editar Perfil
          </button>
        </div>
      )}

      {/* Content based on tab */}
      {activeTab === 'view' || !isOwnProfile ? (
        <>
          {/* Streams Section */}
          {streams && streams.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-dark-50 mb-6">Streams</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {streams.map((stream: any) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
              </div>
            </div>
          )}

          {/* Videos Section */}
          {videos && videos.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-dark-50 mb-6">Videos (VODs)</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.map((video) => (
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
            </div>
          )}

          {/* Empty State */}
          {(!streams || streams.length === 0) && (!videos || videos.length === 0) && (
            <div className="text-center py-16 text-dark-400">
              <Video className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Este perfil aún no tiene contenido</p>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8">
          <h2 className="text-2xl font-bold text-dark-50 mb-6">Editar Perfil</h2>
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
              <p className="text-xs text-dark-500 mt-1">
                Ingresa la URL de tu imagen de perfil
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
              <button
                onClick={() => {
                  setEditForm({
                    username: profile.username,
                    bio: profile.bio || '',
                    avatar_url: profile.avatar_url || '',
                  })
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}