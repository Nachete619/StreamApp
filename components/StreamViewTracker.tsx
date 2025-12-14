'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './Providers'

interface StreamViewTrackerProps {
  streamId: string
  isLive: boolean
}

export function StreamViewTracker({ streamId, isLive }: StreamViewTrackerProps) {
  const { user } = useAuth()
  const hasAwardedXP = useRef(false)
  const viewStartTime = useRef<number | null>(null)
  const minViewTime = 30000 // 30 seconds minimum to get XP

  useEffect(() => {
    if (!user || !isLive || hasAwardedXP.current) return

    // Start tracking view time
    viewStartTime.current = Date.now()

    // Award XP after minimum view time
    const timer = setTimeout(async () => {
      if (hasAwardedXP.current) return

      try {
        const response = await fetch('/api/gamification/add-xp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'watch',
            stream_id: streamId,
          }),
        })

        const data = await response.json()
        if (data.success) {
          hasAwardedXP.current = true
          
          // Check for badges
          if (data.leveled_up) {
            // Check badges after a short delay
            setTimeout(() => {
              fetch('/api/gamification/check-badges', {
                method: 'POST',
              }).catch(() => {})
            }, 1000)
          }
        }
      } catch (error) {
        console.error('Error adding XP for watching:', error)
      }
    }, minViewTime)

    return () => {
      clearTimeout(timer)
    }
  }, [user, streamId, isLive])

  return null
}


