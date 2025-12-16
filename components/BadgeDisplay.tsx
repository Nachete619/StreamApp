'use client'

import { Award } from 'lucide-react'

interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked_at?: string
}

interface BadgeDisplayProps {
  badges: Badge[]
  maxDisplay?: number
  showTooltip?: boolean
}

export function BadgeDisplay({ badges, maxDisplay = 5, showTooltip = true }: BadgeDisplayProps) {
  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - maxDisplay

  if (badges.length === 0) {
    return (
      <div className="flex items-center gap-2 text-dark-500 text-sm">
        <Award className="w-4 h-4" />
        <span>Sin insignias</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {displayBadges.map((badge) => (
        <div
          key={badge.id}
          className="group relative"
          title={showTooltip ? `${badge.name}: ${badge.description}` : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500/20 to-accent-600/20 border border-accent-500/30 flex items-center justify-center text-lg hover:scale-110 transition-transform cursor-help">
            {badge.icon}
          </div>
          {showTooltip && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-dark-800 text-dark-50 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {badge.name}
            </div>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center text-xs text-dark-400">
          +{remainingCount}
        </div>
      )}
    </div>
  )
}




