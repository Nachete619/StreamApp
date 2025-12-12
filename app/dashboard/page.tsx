'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Copy, Check, Video, Radio, ExternalLink, Users, Clock, TrendingUp, Settings, Eye, BarChart3, Edit2, X, Square } from 'lucide-react'
import Link from 'next/link'
import { LiveChat } from '@/components/LiveChat'
import { HLSPlayer } from '@/components/HLSPlayer'

interface Stream {
  id: string
  title: string
  stream_key: string
  ingest_url: string
  playback_id: string
  is_live: boolean
  created_at: string
}

interface Video {
  id: string
  playback_url: string
  created_at: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabaseRef = useRef(createClient())
  const [stream, setStream] = useState<Stream | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
  })
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editingTitle, setEditingTitle] = useState('')
  const [updatingTitle, setUpdatingTitle] = useState(false)
  const [stopping, setStopping] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    viewers: 0,
    followers: 0,
    uptime: '0:00',
  })

  const calculateUptime = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = Date.now()
    const diff = now - start
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}:${minutes.toString().padStart(2, '0')}`
  }

  const fetchStream = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await (supabaseRef.current
        .from('streams') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      setStream(data)
    } catch (error: any) {
      console.error('Error fetching stream:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchVideos = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await (supabaseRef.current
        .from('videos') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setVideos(data || [])
    } catch (error: any) {
      console.error('Error fetching videos:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchStream()
      fetchVideos()
    }
  }, [user, authLoading, router, fetchStream, fetchVideos])

  // Poll for stream status updates when stream exists
  useEffect(() => {
    if (!stream) return

    // Poll every 10 seconds to check if stream status changed
    const interval = setInterval(() => {
      fetchStream()
    }, 10000)

    return () => clearInterval(interval)
  }, [stream, fetchStream])

  useEffect(() => {
    if (!stream?.is_live) return
    
    // Update stats every 5 seconds if live
    const interval = setInterval(() => {
      if (stream) {
        setStats({
          viewers: Math.floor(Math.random() * 100) + 10,
          followers: 42,
          uptime: calculateUptime(stream.created_at),
        })
      }
    }, 5000)
    
    return () => clearInterval(interval)
  }, [stream?.is_live, stream])

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error('Por favor ingresa un título')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/livepeer/create-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: formData.title }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear stream')
      }

      toast.success('Stream creado exitosamente')
      setFormData({ title: '' })
      fetchStream()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear stream')
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      toast.success('Copiado al portapapeles')
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      toast.error('Error al copiar')
    }
  }

  const handleStartEditTitle = () => {
    if (stream) {
      setEditingTitle(stream.title)
      setIsEditingTitle(true)
    }
  }

  const handleCancelEditTitle = () => {
    setIsEditingTitle(false)
    setEditingTitle('')
  }

  const handleSaveTitle = async () => {
    if (!stream || !editingTitle.trim()) {
      toast.error('El título no puede estar vacío')
      return
    }

    if (editingTitle.trim() === stream.title) {
      setIsEditingTitle(false)
      return
    }

    setUpdatingTitle(true)
    try {
      const response = await fetch('/api/streams/update-title', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId: stream.id,
          title: editingTitle.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar título')
      }

      toast.success('Título actualizado exitosamente')
      setIsEditingTitle(false)
      fetchStream() // Refresh stream data
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar título')
    } finally {
      setUpdatingTitle(false)
    }
  }

  const handleStopStream = async () => {
    if (!stream) return

    if (!confirm('¿Estás seguro de que deseas detener la transmisión?')) {
      return
    }

    setStopping(true)
    try {
      const response = await fetch('/api/streams/stop-stream', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          streamId: stream.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al detener stream')
      }

      toast.success('Transmisión detenida exitosamente')
      fetchStream() // Refresh stream data
    } catch (error: any) {
      toast.error(error.message || 'Error al detener stream')
    } finally {
      setStopping(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800/50 bg-dark-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark-50">Centro de Transmisión</h1>
              <p className="text-sm text-dark-400 mt-1">Gestiona tus streams y estadísticas</p>
            </div>
            <Link
              href={`/stream/${user.id}`}
              className="btn btn-ghost flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Stream
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        {!stream ? (
          /* Create Stream Card */
          <div className="max-w-2xl mx-auto">
            <div className="card-premium p-8 border-2 border-accent-600/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-accent-600/20 rounded-xl flex items-center justify-center">
                  <Radio className="w-8 h-8 text-accent-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dark-50">Crear Nueva Transmisión</h2>
                  <p className="text-dark-400">Comienza a transmitir en minutos</p>
                </div>
              </div>

              <form onSubmit={handleCreateStream} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-dark-300 mb-2">
                    Título del Stream
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input text-lg"
                    placeholder="¿Sobre qué vas a transmitir hoy?"
                    maxLength={100}
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Radio className="w-5 h-5" />
                      Crear y Configurar Stream
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Dashboard Grid Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Video Preview */}
            <div className="lg:col-span-7 space-y-6">
              {/* Stats Widgets */}
              {stream.is_live && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="card-premium p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <Eye className="w-5 h-5 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Espectadores</p>
                        <p className="text-xl font-bold text-dark-50">{stats.viewers}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-premium p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Seguidores</p>
                        <p className="text-xl font-bold text-dark-50">{stats.followers}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-premium p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-accent-500" />
                      </div>
                      <div>
                        <p className="text-xs text-dark-500">Tiempo</p>
                        <p className="text-xl font-bold text-dark-50">{stats.uptime}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stream Preview */}
              <div className="card-premium overflow-hidden">
                <div className="aspect-video bg-dark-800 relative">
                  {stream.is_live && stream.playback_id ? (
                    <>
                      <HLSPlayer playbackId={stream.playback_id} autoPlay={true} />
                      <div className="absolute top-4 left-4 bg-accent-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg z-10">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        EN VIVO
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
                      <div className="text-center">
                        <Radio className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                        <p className="text-dark-400 font-medium mb-2">Stream Offline</p>
                        <p className="text-sm text-dark-500">
                          Inicia tu transmisión para ver la vista previa
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  {/* Stream Title with Edit */}
                  <div className="mb-4">
                    {isEditingTitle ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="input text-xl font-bold flex-1"
                          placeholder="Título del stream"
                          maxLength={100}
                          disabled={updatingTitle}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitle()
                            } else if (e.key === 'Escape') {
                              handleCancelEditTitle()
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={handleSaveTitle}
                          disabled={updatingTitle || !editingTitle.trim()}
                          className="btn btn-primary px-3 py-2"
                        >
                          {updatingTitle ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={handleCancelEditTitle}
                          disabled={updatingTitle}
                          className="btn btn-secondary px-3 py-2"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h3 className="text-xl font-bold text-dark-50 flex-1">{stream.title}</h3>
                        <button
                          onClick={handleStartEditTitle}
                          className="opacity-0 group-hover:opacity-100 transition-opacity btn btn-ghost p-2"
                          title="Editar título"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {stream.is_live && (
                          <button
                            onClick={handleStopStream}
                            disabled={stopping}
                            className="btn btn-danger px-4 py-2 flex items-center gap-2"
                            title="Detener transmisión"
                          >
                            {stopping ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Square className="w-4 h-4" />
                                <span className="hidden sm:inline">Detener</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Stream Configuration */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark-500 uppercase mb-2">
                        Stream Key
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={stream.stream_key}
                          className="input font-mono text-sm flex-1"
                        />
                        <button
                          onClick={() => copyToClipboard(stream.stream_key, 'key')}
                          className="btn btn-secondary px-4 flex-shrink-0"
                        >
                          {copied === 'key' ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark-500 uppercase mb-2">
                        RTMP Ingest URL
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={stream.ingest_url}
                          className="input font-mono text-sm flex-1"
                        />
                        <button
                          onClick={() => copyToClipboard(stream.ingest_url, 'ingest')}
                          className="btn btn-secondary px-4 flex-shrink-0"
                        >
                          {copied === 'ingest' ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Copy className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="mt-6 p-4 bg-dark-800/50 rounded-lg border border-dark-700">
                    <p className="text-sm text-dark-300 font-medium mb-2">📋 Guía Rápida:</p>
                    <ol className="text-sm text-dark-400 space-y-1 ml-4 list-decimal">
                      <li>Descarga OBS Studio desde obsproject.com</li>
                      <li>Copia el RTMP Ingest URL y Stream Key</li>
                      <li>En OBS: Configuración → Stream → Servicio: Personalizado</li>
                      <li>Pega la URL y el Stream Key</li>
                      <li>¡Haz clic en &quot;Iniciar Transmisión&quot;!</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Recent Videos */}
              {videos.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-dark-50 mb-4">Videos Recientes</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {videos.slice(0, 4).map((video: any) => (
                      <Link
                        key={video.id}
                        href={video.playback_url}
                        target="_blank"
                        className="card-premium p-4 group hover:border-accent-600/30 transition-all"
                      >
                        <div className="aspect-video bg-dark-800 rounded-lg mb-3 flex items-center justify-center">
                          <Video className="w-8 h-8 text-dark-600 group-hover:text-accent-500 transition-colors" />
                        </div>
                        <p className="text-sm text-dark-300 font-medium truncate">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Chat */}
            <div className="lg:col-span-5">
              {stream.is_live ? (
                <div className="sticky top-20">
                  <LiveChat streamId={stream.id} isLive={stream.is_live} />
                </div>
              ) : (
                <div className="card-premium p-8 text-center">
                  <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-dark-600" />
                  </div>
                  <p className="text-dark-400 font-medium mb-2">Chat en Vivo</p>
                  <p className="text-sm text-dark-500">
                    El chat estará disponible cuando tu stream esté en vivo
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}