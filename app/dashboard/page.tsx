'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/Providers'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Copy, Check, Video, Play, Radio, ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'

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
  const supabase = createClient()
  const [stream, setStream] = useState<Stream | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchStream()
      fetchVideos()
    }
  }, [user, authLoading, router])

  const fetchStream = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .eq('user_id', user?.id)
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
  }

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setVideos(data || [])
    } catch (error: any) {
      console.error('Error fetching videos:', error)
    }
  }

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-dark-800">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-600/10 via-transparent to-transparent" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg shadow-accent-600/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-dark-50">
                Centro de <span className="text-gradient">Transmisión</span>
              </h1>
            </div>
            <p className="text-dark-400 text-lg">
              Gestiona tus streams, configura tu transmisión y conecta con tu audiencia
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {!stream ? (
          /* Create Stream Card */
          <div className="max-w-2xl mx-auto">
            <div className="card-gradient p-8 border-2 border-accent-600/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-accent-600/20 rounded-xl flex items-center justify-center">
                  <Video className="w-8 h-8 text-accent-500" />
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
          <div className="space-y-8">
            {/* Stream Info Card */}
            <div className="card-gradient p-8 border-2 border-accent-600/20">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-dark-50">{stream.title}</h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      stream.is_live
                        ? 'bg-accent-600 text-white animate-pulse'
                        : 'bg-dark-700 text-dark-300'
                    }`}>
                      {stream.is_live ? (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-white rounded-full" />
                          EN VIVO
                        </span>
                      ) : (
                        'OFFLINE'
                      )}
                    </div>
                  </div>
                  <p className="text-dark-400">
                    Configura tu software de streaming con los datos de abajo
                  </p>
                </div>
                <Link
                  href={`/stream/${user.id}`}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Ver Stream
                </Link>
              </div>

              {/* Stream Key */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
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

                {/* Ingest URL */}
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
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
                  <li>¡Haz clic en "Iniciar Transmisión"!</li>
                </ol>
              </div>
            </div>

            {/* Videos Section */}
            {videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-dark-50 mb-6">Videos Guardados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <Link
                      key={video.id}
                      href={video.playback_url}
                      target="_blank"
                      className="card-hover p-6 group"
                    >
                      <div className="aspect-video bg-dark-800 rounded-lg mb-4 flex items-center justify-center">
                        <Video className="w-12 h-12 text-accent-500 group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-dark-200 font-medium">
                            {new Date(video.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-dark-500">
                            {new Date(video.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-dark-400 group-hover:text-accent-500 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}