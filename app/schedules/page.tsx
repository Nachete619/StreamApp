'use client'

import { useEffect, useState } from 'react'
import { Calendar } from 'lucide-react'
import { StreamScheduleCard } from '@/components/StreamScheduleCard'

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/schedules/get?upcoming=true')
      const data = await response.json()
      if (data.success) {
        setSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
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
          <Calendar className="w-8 h-8 text-accent-500" />
          <h1 className="text-3xl font-bold text-dark-50">Streams Programados</h1>
        </div>

        {schedules.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <Calendar className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-dark-300 mb-2">
              No hay streams programados
            </p>
            <p className="text-dark-500">
              Los streamers pueden programar sus transmisiones para que aparezcan aquí
            </p>
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

