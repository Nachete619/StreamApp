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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const hlsUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`
    let hls: Hls | null = null
    let loadedMetadataHandler: (() => void) | null = null

    // Set timeout to stop loading after 15 seconds
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.warn('Stream loading timeout after 15 seconds')
        setLoading(false)
        setError('El stream no está disponible en este momento. Por favor, espera unos segundos e intenta recargar.')
      }
    }, 15000)

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxLoadingDelay: 4,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })

      hls.loadSource(hlsUrl)
      hls.attachMedia(video)

      const manifestHandler = () => {
        console.log('Manifest parsed successfully')
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setLoading(false)
        setError(null)
        retryCountRef.current = 0
        if (autoPlay) {
          video.play().catch((err) => {
            console.error('Error playing video:', err)
            setError('Error al reproducir el video')
          })
        }
      }

      hls.on(Hls.Events.MANIFEST_PARSED, manifestHandler)

      // Handle when manifest is loaded but not parsed yet
      hls.on(Hls.Events.MANIFEST_LOADED, () => {
        console.log('Manifest loaded, waiting for parsing...')
      })

      const errorHandler = (_: any, data: any) => {
        console.error('HLS Error:', data)
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('Network error, trying to recover...', data)
              retryCountRef.current += 1
              
              if (retryCountRef.current < 3) {
                setTimeout(() => {
                  hls?.startLoad()
                }, 2000)
              } else {
                console.error('Max retries reached, stream may not be available')
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
                setLoading(false)
                setError('El stream no está disponible. Asegúrate de que la transmisión esté activa.')
                hls?.destroy()
              }
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('Media error, trying to recover...', data)
              try {
                hls?.recoverMediaError()
              } catch (e) {
                console.error('Recovery failed:', e)
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current)
                }
                setLoading(false)
                setError('Error al cargar el stream')
              }
              break
            default:
              console.error('Fatal error, destroying HLS...', data)
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
              setLoading(false)
              setError('Error al cargar el stream. Verifica que la transmisión esté activa.')
              hls?.destroy()
              break
          }
        } else {
          // Non-fatal errors, just log them
          console.warn('Non-fatal HLS error:', data)
        }
      }

      hls.on(Hls.Events.ERROR, errorHandler)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (hls) {
          hls.off(Hls.Events.MANIFEST_PARSED, manifestHandler)
          hls.off(Hls.Events.MANIFEST_LOADED, () => {})
          hls.off(Hls.Events.ERROR, errorHandler)
          hls.destroy()
        }
      }
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = hlsUrl
      
      loadedMetadataHandler = () => {
        console.log('Metadata loaded (Safari)')
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setLoading(false)
        setError(null)
        retryCountRef.current = 0
        if (autoPlay) {
          video.play().catch((err) => {
            console.error('Error playing video:', err)
            setError('Error al reproducir el video')
          })
        }
      }
      
      const errorHandler = () => {
        console.error('Video error (Safari)')
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        setLoading(false)
        setError('El stream no está disponible. Verifica que la transmisión esté activa.')
      }
      
      video.addEventListener('loadedmetadata', loadedMetadataHandler)
      video.addEventListener('error', errorHandler)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        if (loadedMetadataHandler) {
          video.removeEventListener('loadedmetadata', loadedMetadataHandler)
        }
        video.removeEventListener('error', errorHandler)
        video.src = ''
      }
    } else {
      setError('Tu navegador no soporta la reproducción de streams HLS')
      setLoading(false)
    }
  }, [playbackId, autoPlay, loading])

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