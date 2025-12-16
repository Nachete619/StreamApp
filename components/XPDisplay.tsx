'use client'

import { Trophy, Star } from 'lucide-react'
import { xpProgress } from '@/lib/gamification'

interface XPDisplayProps {
  totalXP: number
  level: number
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function XPDisplay({ totalXP, level, showProgress = true, size = 'md' }: XPDisplayProps) {
  const progress = xpProgress(totalXP, level)
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <Star className={`${iconSizes[size]} text-accent-500`} />
        <span className={`font-bold text-dark-50 ${sizeClasses[size]}`}>
          Nivel {level}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Trophy className={`${iconSizes[size]} text-accent-600`} />
        <span className={`text-dark-300 ${sizeClasses[size]}`}>
          {totalXP.toLocaleString()} XP
        </span>
      </div>
      {showProgress && (
        <div className="flex-1 min-w-[100px]">
          <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <span className={`text-dark-500 ${sizeClasses.sm} mt-0.5 block`}>
            {progress.current.toLocaleString()} / {progress.required.toLocaleString()} XP
          </span>
        </div>
      )}
    </div>
  )
}




