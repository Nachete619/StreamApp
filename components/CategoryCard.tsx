'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LucideIcon } from 'lucide-react'

interface CategoryCardProps {
  name: string
  slug: string
  icon?: LucideIcon
  image?: string
  viewers?: number
  streams?: number
}

export function CategoryCard({ name, slug, icon: Icon, image, viewers, streams }: CategoryCardProps) {
  return (
    <Link href={`/explore?category=${slug}`} className="group">
      <div className="relative h-48 rounded-xl overflow-hidden card-premium border-2 border-transparent hover:border-accent-600/50 transition-all duration-300">
        {/* Background Image or Gradient */}
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-600/20 via-accent-500/10 to-dark-900" />
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/50 to-transparent" />
        
        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            {Icon && (
              <div className="w-12 h-12 bg-accent-600/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:bg-accent-600/30 transition-colors">
                <Icon className="w-6 h-6 text-accent-500" />
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-dark-50 mb-1 group-hover:text-accent-400 transition-colors">
              {name}
            </h3>
            {viewers !== undefined && (
              <p className="text-sm text-dark-400">
                {viewers.toLocaleString()} espectadores
              </p>
            )}
            {streams !== undefined && (
              <p className="text-sm text-dark-400">
                {streams} streams en vivo
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
