'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Video } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if username is available
      const { data: existingProfile } = await (supabase
        .from('profiles') as any)
        .select('username')
        .eq('username', formData.username)
        .single()

      if (existingProfile) {
        toast.error('Este nombre de usuario ya está en uso')
        setLoading(false)
        return
      }

      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      })

      if (authError) throw authError

      // Update profile with username
      if (authData.user) {
        const { error: profileError } = await (supabase
          .from('profiles') as any)
          .update({ username: formData.username })
          .eq('id', authData.user.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }
      }

      toast.success('¡Cuenta creada exitosamente!')
      router.push('/dashboard')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-primary-500 rounded-lg flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">StreamApp</span>
          </Link>
          <h1 className="text-2xl font-bold text-dark-50">Crear Cuenta</h1>
          <p className="text-dark-400 mt-2">Comienza a transmitir hoy</p>
        </div>

        {/* Form */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-dark-300 mb-2">
                Nombre de usuario
              </label>
              <input
                id="username"
                type="text"
                required
                minLength={3}
                maxLength={20}
                pattern="^[a-zA-Z0-9_]+$"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                className="input"
                placeholder="miusuario"
              />
              <p className="text-xs text-dark-500 mt-1">
                Solo letras, números y guiones bajos (3-20 caracteres)
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                placeholder="••••••••"
              />
              <p className="text-xs text-dark-500 mt-1">
                Mínimo 6 caracteres
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-dark-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-accent-500 hover:text-accent-400 font-medium">
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
