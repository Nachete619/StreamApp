'use client'

import { useAuth } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Settings, User, Bell, Shield, Radio, Lock, Globe } from 'lucide-react'
import Link from 'next/link'

type SettingsTab = 'account' | 'security' | 'stream' | 'notifications'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-dark-400">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const settingsCategories = [
    { id: 'account' as SettingsTab, label: 'Cuenta', icon: User, description: 'Información personal y perfil' },
    { id: 'security' as SettingsTab, label: 'Seguridad', icon: Lock, description: 'Contraseña y autenticación' },
    { id: 'stream' as SettingsTab, label: 'Stream', icon: Radio, description: 'Configuración de transmisión' },
    { id: 'notifications' as SettingsTab, label: 'Notificaciones', icon: Bell, description: 'Preferencias de alertas' },
  ]

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <div className="border-b border-dark-800/50 bg-dark-900/50 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-lg shadow-accent-600/30">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-dark-50">Configuración</h1>
          </div>
          <p className="text-sm text-dark-400">Gestiona tus preferencias y configuración de cuenta</p>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Categories Menu */}
            <aside className="lg:col-span-1">
              <nav className="space-y-1">
                {settingsCategories.map((category) => {
                  const Icon = category.icon
                  const isActive = activeTab === category.id
                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveTab(category.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                        isActive
                          ? 'bg-accent-600/20 text-accent-500 border-l-2 border-accent-600'
                          : 'text-dark-400 hover:bg-dark-800/50 hover:text-dark-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isActive ? 'text-accent-500' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${isActive ? 'text-accent-500' : 'text-dark-200'}`}>
                          {category.label}
                        </p>
                        <p className="text-xs text-dark-500 mt-0.5">{category.description}</p>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* Right Content Area */}
            <div className="lg:col-span-3">
              <div className="card-premium">
                {activeTab === 'account' && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-accent-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-dark-50">Configuración de Cuenta</h2>
                        <p className="text-sm text-dark-400">Gestiona tu información personal</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
                        <p className="text-sm text-dark-300 mb-4">
                          Para editar tu perfil completo (nombre de usuario, avatar, banner, bio), 
                          visita tu página de perfil.
                        </p>
                        <Link
                          href={`/profile/${user.id}`}
                          className="btn btn-primary inline-flex items-center gap-2"
                        >
                          Ir a mi Perfil
                        </Link>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-dark-300 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="input bg-dark-800/50 text-dark-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-dark-500 mt-1">
                          El email no puede ser modificado desde aquí
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <Lock className="w-6 h-6 text-accent-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-dark-50">Seguridad</h2>
                        <p className="text-sm text-dark-400">Gestiona tu seguridad y contraseña</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
                        <h3 className="font-semibold text-dark-200 mb-2">Cambiar Contraseña</h3>
                        <p className="text-sm text-dark-400 mb-4">
                          La funcionalidad de cambio de contraseña estará disponible próximamente
                        </p>
                        <button className="btn btn-secondary" disabled>
                          Cambiar Contraseña
                        </button>
                      </div>

                      <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
                        <h3 className="font-semibold text-dark-200 mb-2">Autenticación de Dos Factores</h3>
                        <p className="text-sm text-dark-400 mb-4">
                          Añade una capa extra de seguridad a tu cuenta
                        </p>
                        <button className="btn btn-secondary" disabled>
                          Habilitar 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'stream' && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <Radio className="w-6 h-6 text-accent-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-dark-50">Configuración de Stream</h2>
                        <p className="text-sm text-dark-400">Ajusta tus preferencias de transmisión</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
                        <h3 className="font-semibold text-dark-200 mb-2">Calidad de Transmisión</h3>
                        <p className="text-sm text-dark-400 mb-4">
                          Configura la calidad predeterminada para tus streams
                        </p>
                        <select className="input">
                          <option>1080p (Recomendado)</option>
                          <option>720p</option>
                          <option>480p</option>
                        </select>
                      </div>

                      <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
                        <h3 className="font-semibold text-dark-200 mb-2">Grabación Automática</h3>
                        <p className="text-sm text-dark-400 mb-4">
                          Automáticamente guarda tus streams como VODs
                        </p>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 rounded bg-dark-800 border-dark-700 text-accent-600 focus:ring-accent-600" defaultChecked />
                          <span className="text-dark-300">Habilitar grabación automática</span>
                        </label>
                      </div>

                      <div>
                        <Link
                          href="/dashboard"
                          className="btn btn-primary inline-flex items-center gap-2"
                        >
                          Ir al Dashboard
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center">
                        <Bell className="w-6 h-6 text-accent-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-dark-50">Notificaciones</h2>
                        <p className="text-sm text-dark-400">Gestiona tus preferencias de alertas</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-dark-800/50 rounded-lg border border-dark-700">
                        <h3 className="font-semibold text-dark-200 mb-4">Tipos de Notificaciones</h3>
                        
                        <div className="space-y-4">
                          {[
                            { label: 'Nuevos seguidores', description: 'Cuando alguien te sigue' },
                            { label: 'Nuevos comentarios', description: 'Comentarios en tus streams' },
                            { label: 'Streams de canales seguidos', description: 'Cuando un canal que sigues va en vivo' },
                            { label: 'Actualizaciones del sistema', description: 'Novedades y mejoras de la plataforma' },
                          ].map((item, index) => (
                            <div key={index} className="flex items-start justify-between py-3 border-b border-dark-700 last:border-0">
                              <div>
                                <p className="font-medium text-dark-200">{item.label}</p>
                                <p className="text-sm text-dark-500">{item.description}</p>
                              </div>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  defaultChecked
                                  className="w-5 h-5 rounded bg-dark-800 border-dark-700 text-accent-600 focus:ring-accent-600"
                                />
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}