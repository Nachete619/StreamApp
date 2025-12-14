'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()

  const navigationItems = [
    { icon: Home, label: 'Inicio', href: '/', badge: null },
    { icon: Heart, label: 'Siguiendo', href: '/following', badge: null },
    { icon: Compass, label: 'Explorar', href: '/explore', badge: null },
    { icon: Calendar, label: 'Schedules', href: '/schedules', badge: null },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href)
  }

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
            <div className="w-12 h-12 relative flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Image 
                src="/logo.png" 
                alt="StreamApp Logo" 
                width={48} 
                height={48} 
                className="object-contain logo-neon"
                priority
              />
            </div>
            <span className="text-lg font-bold text-gradient">StreamApp</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="w-12 h-12 relative flex items-center justify-center mx-auto">
            <Image 
              src="/logo.png" 
              alt="StreamApp Logo" 
              width={48} 
              height={48} 
              className="object-contain logo-neon"
              priority
            />
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
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors cursor-pointer group"
                    title={isCollapsed ? 'Canal' : ''}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex-shrink-0" />
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-dark-200 truncate">Canal {i}</p>
                        <p className="text-xs text-dark-500">Offline</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
