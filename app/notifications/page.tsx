'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, Heart, Radio, User, X, Check } from 'lucide-react'
import { useAuth } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  related_user_id: string | null
  related_stream_id: string | null
  is_read: boolean
  created_at: string
  related_user?: {
    username: string
    avatar_url: string | null
  }
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const response = await fetch('/api/notifications/get')
      const data = await response.json()
      
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
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
      fetchNotifications()

      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchNotifications()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [user, authLoading, router, fetchNotifications, supabase])

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_id: notificationId }),
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        setUnreadCount(0)
        toast.success('Todas las notificaciones marcadas como leídas')
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
      toast.error('Error al marcar todas como leídas')
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <Heart className="w-5 h-5 text-accent-500" />
      case 'stream_started':
        return <Radio className="w-5 h-5 text-red-500" />
      case 'stream_ended':
        return <Radio className="w-5 h-5 text-dark-400" />
      default:
        return <Bell className="w-5 h-5 text-accent-500" />
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Cargando notificaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-accent-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-50">Notificaciones</h1>
              <p className="text-sm text-dark-400 mt-1">
                {unreadCount > 0 
                  ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                  : 'Todas las notificaciones leídas'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="card-premium p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-accent-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="w-10 h-10 text-accent-500" />
              </div>
              <h3 className="text-2xl font-bold text-dark-50 mb-3">
                No hay notificaciones
              </h3>
              <p className="text-dark-400">
                Cuando alguien te siga o haya actividad en tus streams, aparecerá aquí
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`card-premium p-4 hover:border-accent-600/30 transition-all ${
                  !notification.is_read ? 'border-l-4 border-l-accent-600 bg-accent-600/5' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {notification.related_user?.avatar_url ? (
                      <Link href={notification.link || '#'}>
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-dark-800">
                          <Image
                            src={notification.related_user.avatar_url}
                            alt={notification.related_user.username}
                            width={40}
                            height={40}
                            className="object-cover"
                          />
                        </div>
                      </Link>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={notification.link || '#'}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-dark-50 mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-dark-400 mb-2">
                            {notification.message}
                            {notification.related_user && (
                              <span className="text-accent-500 font-medium">
                                {' '}{notification.related_user.username}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-dark-500">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-accent-600 rounded-full" />
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
                        title="Marcar como leída"
                      >
                        <Check className="w-4 h-4 text-dark-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
