'use client'

import { useState, useEffect } from 'react'
import { Calendar, Plus, X } from 'lucide-react'
import { StreamScheduleCard } from './StreamScheduleCard'
import toast from 'react-hot-toast'

interface Schedule {
  id: string
  title: string
  description: string | null
  scheduled_start: string
  scheduled_end: string | null
  is_recurring: boolean
  recurring_pattern: string | null
  timezone: string
}

interface ScheduleManagerProps {
  userId: string
  isOwn?: boolean
}

export function ScheduleManager({ userId, isOwn = false }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_start: '',
    scheduled_end: '',
    is_recurring: false,
    recurring_pattern: 'weekly',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schedules/get?user_id=${userId}&upcoming=false`)
      const data = await response.json()
      if (data.success) {
        setSchedules(data.schedules || [])
      } else {
        console.error('Error in response:', data)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.scheduled_start) {
      toast.error('Título y fecha de inicio son requeridos')
      return
    }

    try {
      const url = editingSchedule
        ? '/api/schedules/update'
        : '/api/schedules/create'

      const body = editingSchedule
        ? { schedule_id: editingSchedule.id, ...formData }
        : formData

      const response = await fetch(url, {
        method: editingSchedule ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar schedule')
      }

      toast.success(editingSchedule ? 'Schedule actualizado' : 'Schedule creado')
      setShowForm(false)
      setEditingSchedule(null)
      setFormData({
        title: '',
        description: '',
        scheduled_start: '',
        scheduled_end: '',
        is_recurring: false,
        recurring_pattern: 'weekly',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar schedule')
    }
  }

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este schedule?')) {
      return
    }

    try {
      const response = await fetch(`/api/schedules/delete?schedule_id=${scheduleId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar schedule')
      }

      toast.success('Schedule eliminado')
      fetchSchedules()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar schedule')
    }
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    setFormData({
      title: schedule.title,
      description: schedule.description || '',
      scheduled_start: schedule.scheduled_start.slice(0, 16), // Format for datetime-local
      scheduled_end: schedule.scheduled_end ? schedule.scheduled_end.slice(0, 16) : '',
      is_recurring: schedule.is_recurring,
      recurring_pattern: schedule.recurring_pattern || 'weekly',
      timezone: schedule.timezone,
    })
    setShowForm(true)
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-dark-400">Cargando schedules...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-accent-500" />
          <h2 className="text-2xl font-bold text-dark-50">Horarios de Stream</h2>
        </div>
        {isOwn && (
          <button
            onClick={() => {
              setShowForm(!showForm)
              if (showForm) {
                setEditingSchedule(null)
                setFormData({
                  title: '',
                  description: '',
                  scheduled_start: '',
                  scheduled_end: '',
                  is_recurring: false,
                  recurring_pattern: 'weekly',
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
              }
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4" />
                Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Nuevo Schedule
              </>
            )}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-premium p-6 mb-6">
          <h3 className="text-lg font-bold text-dark-50 mb-4">
            {editingSchedule ? 'Editar Schedule' : 'Nuevo Schedule'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input min-h-[100px]"
                maxLength={500}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Fecha y Hora de Fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({ ...formData, scheduled_end: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_recurring" className="text-sm text-dark-300">
                Recurrente
              </label>
            </div>

            {formData.is_recurring && (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Patrón de Repetición
                </label>
                <select
                  value={formData.recurring_pattern}
                  onChange={(e) => setFormData({ ...formData, recurring_pattern: e.target.value })}
                  className="input"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button type="submit" className="btn btn-primary">
                {editingSchedule ? 'Actualizar' : 'Crear'} Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingSchedule(null)
                }}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {schedules.length === 0 ? (
        <div className="card-premium p-8 text-center">
          <Calendar className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">No hay schedules programados</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <StreamScheduleCard
              key={schedule.id}
              schedule={schedule}
              isOwn={isOwn}
              onEdit={isOwn ? handleEdit : undefined}
              onDelete={isOwn ? handleDelete : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

