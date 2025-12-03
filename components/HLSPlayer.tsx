'use client'

import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

interface HLSPlayerProps {
  playbackId: string
  autoPlay?: boolean
}

export function HLSPlayer({ playbackId, autoPlay = true }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const hlsUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      })

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        if (autoPlay) {
          video.play().catch((err) => {
            console.error('Error playing video:', err)
            setError('Error al reproducir el video')
          })
        }
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...')
              hls.recoverMediaError()
              break
            default:
              console.error('Fatal error, destroying HLS...')
              hls.destroy()
              setError('Error al cargar el stream')
              break
          }
        }
      })

      return () => {
        hls.destroy()
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl
      video.addEventListener('loadedmetadata', () => {
        setLoading(false)
        if (autoPlay) {
          video.play().catch((err) => {
            console.error('Error playing video:', err)
            setError('Error al reproducir el video')
          })
        }
      })
    } else {
      setError('Tu navegador no soporta la reproducción de streams HLS')
    }
  }, [playbackId, autoPlay])

  if (error) {
    return (
      <div className="absolute inset-0 bg-dark-900 flex items-center justify-center">
        <div className="text-center text-dark-400">
          <p className="text-lg mb-2">Error al cargar el stream</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-dark-950">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-dark-950 z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Cargando stream...</p>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        autoPlay={autoPlay}
        muted={!autoPlay}
      />
    </div>
  )
}