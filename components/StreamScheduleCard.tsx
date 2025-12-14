'use client'

import { Calendar, Clock, Edit2, Trash2, Video } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'

interface StreamSchedule {
  id: string
  title: string
  description: string | null
  scheduled_start: string
  scheduled_end: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  timezone: string
  profiles?: {
    username: string
    avatar_url: string | null
  }
  streams?: {
    title: string
    playback_id: string
  } | null
}

interface StreamScheduleCardProps {
  schedule: StreamSchedule
  isOwn?: boolean
  onEdit?: (schedule: StreamSchedule) => void
  onDelete?: (scheduleId: string) => void
}

export function StreamScheduleCard({ schedule, isOwn = false, onEdit, onDelete }: StreamScheduleCardProps) {
  const startDate = new Date(schedule.scheduled_start)
  const endDate = schedule.scheduled_end ? new Date(schedule.scheduled_end) : null
  const isUpcoming = startDate > new Date()
  const isLive = startDate <= new Date() && (!endDate || endDate > new Date())

  return (
    <div className="card-premium p-4 hover:border-accent-600/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-accent-500" />
            <h3 className="font-bold text-dark-50">{schedule.title}</h3>
            {isLive && (
              <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
                EN VIVO
              </span>
            )}
            {isUpcoming && !isLive && (
              <span className="px-2 py-0.5 bg-accent-600 text-white text-xs font-semibold rounded">
                PRÓXIMAMENTE
              </span>
            )}
          </div>

          {schedule.description && (
            <p className="text-sm text-dark-400 mb-3">{schedule.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>
                {format(startDate, "d 'de' MMMM 'a las' HH:mm", { locale: es })}
              </span>
            </div>
            {endDate && (
              <div className="flex items-center gap-1.5">
                <span>Hasta:</span>
                <span>{format(endDate, "HH:mm", { locale: es })}</span>
              </div>
            )}
            {schedule.is_recurring && schedule.recurring_pattern && (
              <span className="text-accent-500">
                {schedule.recurring_pattern === 'daily' ? 'Diario' :
                 schedule.recurring_pattern === 'weekly' ? 'Semanal' :
                 schedule.recurring_pattern}
              </span>
            )}
          </div>

          {schedule.profiles && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dark-800">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden">
                {schedule.profiles.avatar_url ? (
                  <Image
                    src={schedule.profiles.avatar_url}
                    alt={schedule.profiles.username}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                ) : (
                  <span className="text-xs text-white">
                    {schedule.profiles.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="text-sm text-dark-300">{schedule.profiles.username}</span>
            </div>
          )}

          {isUpcoming && (
            <p className="text-xs text-dark-500 mt-2">
              {formatDistanceToNow(startDate, { addSuffix: true, locale: es })}
            </p>
          )}
        </div>

        {isOwn && (onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(schedule)}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4 text-dark-400" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(schedule.id)}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

