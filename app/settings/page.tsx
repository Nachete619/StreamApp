'use client'

import { useAuth } from '@/components/Providers'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Settings, User, Bell, Shield, Moon } from 'lucide-react'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-dark-50">Configuración</h1>
        </div>
        <p className="text-dark-400">Gestiona tus preferencias y configuración de cuenta</p>
      </div>

      <div className="space-y-6">
        {/* Account Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-dark-50">Cuenta</h2>
          </div>
          <div className="space-y-4">
            <p className="text-dark-400">
              Configura tu perfil desde la página de perfil
            </p>
            <a
              href={`/profile/${user.id}`}
              className="btn btn-secondary inline-flex items-center gap-2"
            >
              Ir a mi Perfil
            </a>
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-dark-50">Notificaciones</h2>
          </div>
          <div className="space-y-4">
            <p className="text-dark-400 text-sm">
              Configuración de notificaciones próximamente
            </p>
          </div>
        </div>

        {/* Privacy */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-accent-500" />
            <h2 className="text-xl font-semibold text-dark-50">Privacidad</h2>
          </div>
          <div className="space-y-4">
            <p className="text-dark-400 text-sm">
              Configuración de privacidad próximamente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
