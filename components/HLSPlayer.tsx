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

    // Reset state when playbackId changes
    setLoading(true)
    setError(null)
    retryCountRef.current = 0

    const hlsUrl = `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`
    let hls: Hls | null = null
    let loadedMetadataHandler: (() => void) | null = null
    let retryTimeout: NodeJS.Timeout | null = null

    // First, verify the manifest URL is accessible
    const verifyManifest = async () => {
      try {
        console.log('🔍 Verifying manifest availability:', hlsUrl)
        // Use GET instead of HEAD to avoid CORS issues
        const response = await fetch(hlsUrl, { 
          method: 'GET', 
          cache: 'no-cache',
          headers: {
            'Accept': 'application/vnd.apple.mpegurl, application/x-mpegURL, video/mp2t'
          }
        })
        console.log('📡 Manifest check response:', response.status, response.statusText)
        
        if (response.status === 404) {
          console.warn('⚠️ Manifest not found (404) - stream is not transmitting data')
          return false
        }
        if (!response.ok) {
          console.warn(`⚠️ Manifest check failed: ${response.status}`)
          return false
        }
        const text = await response.text()
        if (text.includes('#EXTM3U')) {
          console.log('✅ Manifest is accessible and valid')
          return true
        } else {
          console.warn('⚠️ Manifest response is not valid M3U8 format')
          return false
        }
      } catch (error: any) {
        console.error('❌ Error checking manifest:', error)
        // If it's a network error, the stream might not be active
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          console.warn('⚠️ Network error - stream may not be transmitting')
        }
        return false
      }
    }

    // Set timeout to stop loading after 30 seconds (increased from 15)
    // This gives Livepeer more time to make the manifest available after stream.started
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.warn('⏱️ Stream loading timeout after 30 seconds')
        setLoading(false)
        setError('El stream no está transmitiendo datos. Verifica que OBS o tu software de streaming esté enviando datos a Livepeer.')
      }
    }, 30000)

    const attemptLoad = async () => {
      // Verify manifest before attempting to load (only on first attempt)
      if (retryCountRef.current === 0) {
        const manifestAvailable = await verifyManifest()
        if (!manifestAvailable) {
          console.warn('⚠️ Manifest not available - stream may not be transmitting')
          // Still try to load, but with reduced retries
          retryCountRef.current = 5 // Start at attempt 5 to reduce retries
        }
      }

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxLoadingDelay: 8, // Increased to wait longer for segments
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          startLevel: -1, // Auto-select best quality
        })

        console.log('📺 Loading HLS manifest:', hlsUrl)
        hls.loadSource(hlsUrl)
        hls.attachMedia(video)

        const manifestHandler = () => {
          console.log('✅ Manifest parsed successfully')
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
          }
          if (retryTimeout) {
            clearTimeout(retryTimeout)
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
          console.error('HLS Error:', data.type, data.details, data.fatal)
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.error('Network error, trying to recover...', data)
                retryCountRef.current += 1
                
                // More aggressive retries - up to 10 attempts with increasing delays
                if (retryCountRef.current < 10) {
                  const delay = Math.min(2000 * retryCountRef.current, 10000) // 2s, 4s, 6s, 8s, 10s, 10s...
                  console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current}/10)`)
                  
                  retryTimeout = setTimeout(() => {
                    if (hls && video) {
                      try {
                        hls.startLoad()
                      } catch (e) {
                        console.error('Error restarting load:', e)
                        // If restart fails, destroy and recreate
                        hls.destroy()
                        attemptLoad()
                      }
                    }
                  }, delay)
                } else {
                  console.error('❌ Max retries reached (10 attempts)')
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                  }
                  setLoading(false)
                  setError('El stream no está transmitiendo datos. Verifica que OBS o tu software de streaming esté configurado correctamente y enviando datos a Livepeer.')
                  if (hls) {
                    hls.destroy()
                  }
                }
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.error('Media error, trying to recover...', data)
                try {
                  hls?.recoverMediaError()
                } catch (e) {
                  console.error('Recovery failed:', e)
                  // Try to restart load
                  retryCountRef.current += 1
                  if (retryCountRef.current < 5) {
                    setTimeout(() => {
                      hls?.startLoad()
                    }, 3000)
                  } else {
                    if (timeoutRef.current) {
                      clearTimeout(timeoutRef.current)
                    }
                    setLoading(false)
                    setError('Error al cargar el stream. Verifica que la transmisión esté activa.')
                  }
                }
                break
              default:
                console.error('Fatal error, destroying HLS...', data)
                // For other fatal errors, try one more time after a delay
                if (retryCountRef.current < 3) {
                  retryCountRef.current += 1
                  setTimeout(() => {
                    if (hls) {
                      hls.destroy()
                    }
                    attemptLoad()
                  }, 5000)
                } else {
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current)
                  }
                  setLoading(false)
                  setError('Error al cargar el stream. Verifica que la transmisión esté activa.')
                  if (hls) {
                    hls.destroy()
                  }
                }
                break
            }
          } else {
            // Non-fatal errors, just log them
            console.warn('Non-fatal HLS error:', data)
          }
        }

        hls.on(Hls.Events.ERROR, errorHandler)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        console.log('Using native HLS (Safari):', hlsUrl)
        video.src = hlsUrl
        
        loadedMetadataHandler = () => {
          console.log('✅ Metadata loaded (Safari)')
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
        
        const errorHandler = (e: Event) => {
          console.error('Video error (Safari):', e)
          retryCountRef.current += 1
          
          if (retryCountRef.current < 5) {
            // Retry after delay
            setTimeout(() => {
              video.load()
            }, 3000 * retryCountRef.current)
          } else {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            setLoading(false)
            setError('El stream está iniciando. Por favor, espera unos segundos más e intenta recargar la página.')
          }
        }
        
        video.addEventListener('loadedmetadata', loadedMetadataHandler)
        video.addEventListener('error', errorHandler)
      } else {
        setError('Tu navegador no soporta la reproducción de streams HLS')
        setLoading(false)
      }
    }

    // Start loading
    attemptLoad()

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      if (hls) {
        hls.destroy()
      }
      if (loadedMetadataHandler && video) {
        video.removeEventListener('loadedmetadata', loadedMetadataHandler)
        video.removeEventListener('error', () => {})
        video.src = ''
      }
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