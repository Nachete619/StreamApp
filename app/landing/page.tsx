'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Video, Users, Zap, Shield, Sparkles, TrendingUp, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background with Mouse Parallax */}
        <div className="absolute inset-0">
          <div 
            className="absolute top-0 left-1/4 w-96 h-96 bg-accent-600/20 rounded-full blur-3xl animate-float"
            style={{
              transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            }}
          />
          <div 
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float-delayed"
            style={{
              animationDelay: '1s',
              transform: `translate(${mousePosition.x * -0.02}px, ${mousePosition.y * -0.02}px)`,
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent-600/10 rounded-full blur-2xl animate-rotate-slow"
            style={{
              transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
            }}
          />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-accent-500/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${4 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Logo/Brand with Animation */}
            <div 
              className={`inline-flex items-center gap-3 mb-8 transition-all duration-1000 ${
                isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-90'
              }`}
            >
              <div className="w-12 h-12 relative flex items-center justify-center animate-glow group">
                <Image 
                  src="/logo.png" 
                  alt="StreamApp Logo" 
                  width={48} 
                  height={48} 
                  className="object-contain animate-float logo-neon"
                  priority
                />
              </div>
              <span className="text-3xl font-bold text-gradient animate-shimmer bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-accent-500 via-accent-600 to-accent-500">
                StreamApp
              </span>
            </div>

            {/* Main Heading with Staggered Animation */}
            <h1 
              className={`text-5xl md:text-7xl font-bold text-dark-50 mb-6 transition-all duration-1000 delay-200 ${
                isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
              }`}
            >
              Transmite en Vivo,
              <br />
              <span 
                className="text-gradient inline-block animate-shimmer bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-accent-500 via-accent-600 to-accent-500"
                style={{ animationDelay: '0.5s' }}
              >
                Conecta con el Mundo
              </span>
            </h1>

            <p 
              className={`text-xl text-dark-300 mb-12 max-w-2xl mx-auto transition-all duration-1000 delay-400 ${
                isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
              }`}
            >
              La plataforma de streaming más moderna y profesional. Transmite tus momentos, 
              interactúa con tu audiencia y construye tu comunidad.
            </p>

            {/* CTA Buttons with Hover Effects */}
            <div 
              className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-1000 delay-600 ${
                isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-90'
              }`}
            >
              <Link
                href="/auth/register"
                className="btn btn-primary px-8 py-4 text-lg flex items-center gap-2 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Comenzar Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-accent-500 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/"
                className="btn btn-secondary px-8 py-4 text-lg group hover:scale-105 transition-transform duration-300"
              >
                Explorar Streams
              </Link>
            </div>

            {/* Features Grid with Staggered Animation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
              {[
                { icon: Video, title: 'Streaming HD', desc: 'Transmisión en alta calidad con tecnología de vanguardia', delay: '0.8s' },
                { icon: Users, title: 'Chat en Vivo', desc: 'Interactúa en tiempo real con tu audiencia', delay: '1s' },
                { icon: Zap, title: 'VOD Automático', desc: 'Tus streams se guardan automáticamente para verlos después', delay: '1.2s' },
              ].map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    className={`card p-6 text-left hover:border-accent-600/50 transition-all duration-500 group hover:scale-105 hover:shadow-xl hover:shadow-accent-600/20 ${
                      isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
                    }`}
                    style={{ 
                      transitionDelay: feature.delay,
                      animationDelay: feature.delay,
                    }}
                  >
                    <div className="w-12 h-12 bg-accent-600/20 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent-600/30 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-6 h-6 text-accent-500 group-hover:rotate-12 transition-transform duration-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-dark-50 mb-2 group-hover:text-accent-500 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-dark-400">
                      {feature.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Section with Scroll Animation */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div 
            className={`text-center mb-12 transition-all duration-1000 ${
              isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
            }`}
            style={{ transitionDelay: '1.4s' }}
          >
            <h2 className="text-4xl font-bold text-dark-50 mb-4">
              Una Experiencia <span className="text-gradient animate-shimmer bg-clip-text bg-[length:200%_auto] bg-gradient-to-r from-accent-500 via-accent-600 to-accent-500">Profesional</span>
            </h2>
            <p className="text-dark-400 text-lg">
              Diseñado para streamers que buscan calidad y profesionalismo
            </p>
          </div>

          {/* Preview Mockup with Hover Effects */}
          <div 
            className={`card-gradient p-8 rounded-2xl border-2 border-accent-600/20 hover:border-accent-600/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent-600/20 ${
              isVisible ? 'animate-scale-in opacity-100' : 'opacity-0 scale-90'
            }`}
            style={{ transitionDelay: '1.6s', animationDelay: '1.6s' }}
          >
            <div className="aspect-video bg-dark-800 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-accent-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="text-center relative z-10">
                <Video className="w-16 h-16 text-accent-500 mx-auto mb-4 animate-float group-hover:scale-110 transition-transform duration-300" />
                <p className="text-dark-400 group-hover:text-dark-300 transition-colors">Vista previa del reproductor</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-dark-800 rounded-lg hover:bg-dark-700 transition-all duration-300 hover:scale-105 cursor-pointer group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: TrendingUp, value: '100%', label: 'HD Quality', delay: '1.8s' },
              { icon: Globe, value: '24/7', label: 'Disponible', delay: '2s' },
              { icon: Sparkles, value: '∞', label: 'Sin Límites', delay: '2.2s' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className={`text-center card p-6 hover:border-accent-600/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-accent-600/10 ${
                    isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
                  }`}
                  style={{ 
                    transitionDelay: stat.delay,
                    animationDelay: stat.delay,
                  }}
                >
                  <div className="w-16 h-16 bg-accent-600/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-accent-600/30 transition-all duration-300">
                    <Icon className="w-8 h-8 text-accent-500" />
                  </div>
                  <div className="text-4xl font-bold text-gradient mb-2">{stat.value}</div>
                  <div className="text-dark-400">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Final CTA with Pulse Effect */}
      <div className="container mx-auto px-4 py-20">
        <div 
          className={`max-w-3xl mx-auto text-center card p-12 border-2 border-accent-600/20 hover:border-accent-600/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-accent-600/20 ${
            isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
          }`}
          style={{ transitionDelay: '2.4s', animationDelay: '2.4s' }}
        >
          <h2 className="text-4xl font-bold text-dark-50 mb-4">
            ¿Listo para <span className="text-gradient">Comenzar</span>?
          </h2>
          <p className="text-dark-300 text-lg mb-8">
            Únete a la comunidad de streamers profesionales
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="btn btn-primary px-8 py-4 text-lg group relative overflow-hidden"
            >
              <span className="relative z-10">Crear Cuenta Gratis</span>
              <span className="absolute inset-0 bg-gradient-to-r from-accent-500 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              href="/auth/login"
              className="btn btn-ghost px-8 py-4 text-lg hover:scale-105 transition-transform duration-300"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}