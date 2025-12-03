'use client'

import Link from 'next/link'
import { Gamepad2, Music, Code, Film, TrendingUp } from 'lucide-react'

const categories = [
  { name: 'Gaming', icon: Gamepad2, slug: 'gaming', color: 'text-purple-400' },
  { name: 'Música', icon: Music, slug: 'music', color: 'text-pink-400' },
  { name: 'Programación', icon: Code, slug: 'coding', color: 'text-blue-400' },
  { name: 'IRL', icon: Film, slug: 'irl', color: 'text-green-400' },
  { name: 'Tendencias', icon: TrendingUp, slug: 'trending', color: 'text-yellow-400' },
]

export function CategorySidebar() {
  return (
    <div className="card p-4">
      <h3 className="font-semibold text-dark-50 mb-4">Categorías</h3>
      <nav className="space-y-2">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <Link
              key={category.slug}
              href={`/explore?category=${category.slug}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-800 transition-colors group"
            >
              <Icon className={`w-5 h-5 ${category.color} group-hover:scale-110 transition-transform`} />
              <span className="text-dark-300 group-hover:text-dark-50 transition-colors">
                {category.name}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Top Streamers */}
      <div className="mt-8">
        <h3 className="font-semibold text-dark-50 mb-4">Top Streamers</h3>
        <div className="space-y-3 text-sm text-dark-400">
          <p className="text-dark-500">Próximamente...</p>
        </div>
      </div>
    </div>
  )
}
