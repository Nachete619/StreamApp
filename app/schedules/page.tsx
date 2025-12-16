'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Heart } from 'lucide-react'
import { StreamScheduleCard } from '@/components/StreamScheduleCard'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/components/Providers'
import { useRouter } from 'next/navigation'

export default function SchedulesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSchedules = useCallback(async () => {
    if (!user) return

    const supabase = createClient()
    try {
      // Obtener los IDs de los usuarios que el usuario actual sigue
      const { data: follows } = await (supabase
        .from('follows') as any)
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = follows?.map((f: any) => f.following_id) || []

      // Si no sigue a nadie, mostrar mensaje vacío
      if (followingIds.length === 0) {
        setSchedules([])
        setLoading(false)
        return
      }

      // Obtener los schedules de los usuarios seguidos
      const followingIdsParam = followingIds.join(',')
      const response = await fetch(`/api/schedules/get?upcoming=true&following_ids=${followingIdsParam}`)
      const data = await response.json()
      if (data.success) {
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      fetchSchedules()
    }
  }, [user, authLoading, router, fetchSchedules])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Cargando schedules...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-dark-50">Calendarios de Streams</h1>
            <p className="text-sm text-dark-400 mt-1">Streams programados de los canales que sigues</p>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-accent-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-accent-500" />
              </div>
              <h3 className="text-2xl font-bold text-dark-50 mb-3">
                No hay streams programados
              </h3>
              <p className="text-dark-400 mb-6">
                Los streamers que sigues pueden programar sus transmisiones para que aparezcan aquí. 
                Sigue a más streamers para ver sus calendarios.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedules.map((schedule) => (
              <StreamScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}




