'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { 
  Home, 
  Users, 
  Compass, 
  Video, 
  Settings, 
  ChevronLeft,
  Radio,
  User,
  Heart,
  TrendingUp,
  Calendar
} from 'lucide-react'
import { useAuth } from './Providers'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

interface FollowingChannel {
  id: string
  username: string
  avatar_url: string | null
  is_live: boolean
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const [followingChannels, setFollowingChannels] = useState<FollowingChannel[]>([])
  const [loadingChannels, setLoadingChannels] = useState(true)

  const navigationItems = [
    { icon: Home, label: 'Inicio', href: '/', badge: null },
    { icon: Heart, label: 'Siguiendo', href: '/following', badge: null },
    { icon: Calendar, label: 'Calendarios', href: '/schedules', badge: null },
    { icon: Compass, label: 'Explorar', href: '/explore', badge: null },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

  useEffect(() => {
    const fetchFollowingChannels = async () => {
      if (!user) {
        setFollowingChannels([])
        setLoadingChannels(false)
        return
      }

      try {
        const supabase = createClient()
        
        // Obtener los IDs de los usuarios que el usuario actual sigue
        const { data: follows, error: followsError } = await (supabase
          .from('follows') as any)
          .select('following_id')
          .eq('follower_id', user.id)

        if (followsError) {
          console.error('Error fetching follows:', followsError)
          setFollowingChannels([])
          setLoadingChannels(false)
          return
        }

        const followingIds = follows?.map((f: any) => f.following_id) || []

        if (followingIds.length === 0) {
          setFollowingChannels([])
          setLoadingChannels(false)
          return
        }

        // Obtener los perfiles de los usuarios seguidos
        const { data: profiles, error: profilesError } = await (supabase
          .from('profiles') as any)
          .select('id, username, avatar_url')
          .in('id', followingIds)

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError)
          setFollowingChannels([])
          setLoadingChannels(false)
          return
        }

        // Obtener los streams activos de los usuarios seguidos
        const { data: streams, error: streamsError } = await (supabase
          .from('streams') as any)
          .select('user_id, is_live')
          .in('user_id', followingIds)
          .eq('is_live', true)

        if (streamsError) {
          console.error('Error fetching streams:', streamsError)
        }

        // Crear un mapa de usuarios que están en vivo
        const liveUserIds = new Set((streams || []).map((s: any) => s.user_id))

        // Combinar perfiles con estado de stream
        const channels: FollowingChannel[] = (profiles || []).map((profile: any) => ({
          id: profile.id,
          username: profile.username,
          avatar_url: profile.avatar_url,
          is_live: liveUserIds.has(profile.id),
        }))

        // Ordenar: primero los que están en vivo, luego los offline
        channels.sort((a, b) => {
          if (a.is_live && !b.is_live) return -1
          if (!a.is_live && b.is_live) return 1
          return a.username.localeCompare(b.username)
        })

        setFollowingChannels(channels)
      } catch (error) {
        console.error('Error fetching following channels:', error)
        setFollowingChannels([])
      } finally {
        setLoadingChannels(false)
      }
    }

    fetchFollowingChannels()

    // Refrescar cada 30 segundos para actualizar el estado de los streams
    const interval = setInterval(fetchFollowingChannels, 30000)

    return () => clearInterval(interval)
  }, [user])

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-dark-900 border-r border-dark-800 transition-all duration-300 z-40 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Logo Section */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-dark-800">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/30 group-hover:shadow-accent-500/50 transition-all">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gradient">StreamApp</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/30 mx-auto">
            <Video className="w-5 h-5 text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
          title={isCollapsed ? 'Expandir' : 'Colapsar'}
        >
          <ChevronLeft className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-4rem)] overflow-y-auto scrollbar-hide">
        {/* Main Navigation */}
        <div className="p-4">
          <div className="mb-6">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-3">
                Navegación Principal
              </p>
            )}
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                      active
                        ? 'bg-accent-600/20 text-accent-500 border-l-2 border-accent-600'
                        : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
                    }`}
                    title={isCollapsed ? item.label : ''}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-accent-500' : ''}`} />
                    {!isCollapsed && (
                      <>
                        <span className="font-medium">{item.label}</span>
                        {item.badge && (
                          <span className="ml-auto bg-accent-600 text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Divider */}
          <div className="h-px bg-dark-800 my-4" />

          {/* Stream Action */}
          <div className="mb-6">
            {!isCollapsed && (
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-3">
                Streaming
              </p>
            )}
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-accent-600 to-accent-500 text-white hover:from-accent-500 hover:to-accent-600 transition-all duration-200 shadow-lg shadow-accent-600/30 group"
              title={isCollapsed ? 'Iniciar Stream' : ''}
            >
              <Radio className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-semibold">Iniciar Stream</span>}
            </Link>
          </div>

          {/* Following Channels */}
          {user && (
            <div className="mb-6">
              {!isCollapsed && (
                <p className="text-xs font-semibold text-dark-500 uppercase tracking-wider mb-3 px-3">
                  Tus Canales
                </p>
              )}
              {loadingChannels ? (
                <div className="px-3 py-2">
                  <div className="w-8 h-8 border-2 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : followingChannels.length === 0 ? (
                !isCollapsed && (
                  <div className="px-3 py-2 text-center">
                    <p className="text-xs text-dark-500">No sigues a nadie</p>
                  </div>
                )
              ) : (
                <div className="space-y-2">
                  {followingChannels.map((channel) => (
                    <Link
                      key={channel.id}
                      href={`/profile/${channel.id}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer group"
                      title={isCollapsed ? channel.username : ''}
                    >
                      <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex-shrink-0 overflow-hidden">
                        {channel.avatar_url ? (
                          <Image
                            src={channel.avatar_url}
                            alt={channel.username}
                            width={32}
                            height={32}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {channel.is_live && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-600 rounded-full border-2 border-dark-900" />
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-dark-200 truncate">
                            {channel.username}
                          </p>
                          <p className={`text-xs ${channel.is_live ? 'text-red-500' : 'text-dark-500'}`}>
                            {channel.is_live ? 'En vivo' : 'Offline'}
                          </p>
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          <div className="mt-auto">
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                pathname === '/settings'
                  ? 'bg-dark-800 text-accent-500'
                  : 'text-dark-300 hover:bg-dark-800 hover:text-dark-100'
              }`}
              title={isCollapsed ? 'Configuración' : ''}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">Configuración</span>}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
