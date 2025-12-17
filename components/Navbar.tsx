'use client'

import Link from 'next/link'
import { useAuth } from './Providers'
import { usePathname, useRouter } from 'next/navigation'
import { Search, User, LogOut, Radio, Settings, ChevronDown, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

function NotificationBadge() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/get')
        const data = await response.json()
        if (data.success) {
          setUnreadCount(data.unread_count || 0)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    fetchUnreadCount()

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications-badge')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  if (unreadCount === 0) return null

  return (
    <span className="absolute top-1 right-1 w-5 h-5 bg-accent-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}

export function Navbar() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/landing')
    router.refresh()
    setDropdownOpen(false)
  }

  // Don't show navbar on landing page
  if (pathname === '/landing') {
    return null
  }

  return (
    <nav className="sticky top-0 z-30 bg-dark-900/95 backdrop-blur-md border-b border-dark-800/50">
      <div className="px-6">
        <div className="flex items-center justify-between h-16">
          {/* Search Bar - More Prominent */}
          <div className="flex-1 max-w-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (searchQuery.trim()) {
                  router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
                }
              }}
              className="relative"
            >
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar streams, canales, categorías..."
                className="w-full pl-12 pr-4 py-2.5 bg-dark-800/50 border border-dark-700 rounded-lg text-dark-50 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-600/50 focus:border-accent-600/50 transition-all"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 ml-6">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-dark-800 animate-pulse" />
            ) : user ? (
              <>
                {/* Stream Button - Highlighted */}
                <Link
                  href="/dashboard"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-accent-500 text-white rounded-lg font-semibold hover:from-accent-500 hover:to-accent-600 transition-all duration-200 shadow-lg shadow-accent-600/30 hover:shadow-accent-500/40 hover:scale-105"
                >
                  <Radio className="w-4 h-4" />
                  Iniciar Stream
                </Link>

                {/* Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-2 rounded-lg hover:bg-dark-800 text-dark-400 hover:text-dark-200 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <NotificationBadge />
                </Link>
                
                {/* User Menu Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 hover:bg-dark-800 rounded-lg px-2 py-1.5 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-600/30 border-2 border-dark-800">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 text-dark-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-dark-900 border border-dark-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
                      <div className="p-2">
                        <div className="px-3 py-2 mb-2 border-b border-dark-800">
                          <p className="text-sm font-semibold text-dark-50">Mi Cuenta</p>
                          <p className="text-xs text-dark-400 truncate">{user.email}</p>
                        </div>
                        <Link
                          href={`/profile/${user.id}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 text-dark-200 transition-colors"
                        >
                          <User className="w-5 h-5 text-dark-400" />
                          <span>Mi Perfil</span>
                        </Link>
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 text-dark-200 transition-colors"
                        >
                          <Radio className="w-5 h-5 text-dark-400" />
                          <span>Dashboard</span>
                        </Link>
                        <Link
                          href="/settings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 text-dark-200 transition-colors"
                        >
                          <Settings className="w-5 h-5 text-dark-400" />
                          <span>Configuración</span>
                        </Link>
                        <div className="border-t border-dark-800 my-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-ghost">
                  Iniciar Sesión
                </Link>
                <Link href="/auth/register" className="btn btn-primary">
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}