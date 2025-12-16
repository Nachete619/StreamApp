/**
 * Gamification System Utilities
 * Handles XP, levels, badges, and emojis
 */

export const XP_REWARDS = {
  WATCH: 10,      // XP per stream viewed (once per stream)
  CHAT: 5,        // XP per message sent
  DONATE: 50,     // XP per donation
  CLIP: 25,       // XP per clip created
} as const

export type ActionType = 'watch' | 'chat' | 'donate' | 'clip'

/**
 * Calculate level from total XP
 * Formula: level = floor(sqrt(xp / 100)) + 1
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(xp, 0) / 100)) + 1
}

/**
 * Calculate XP required for a specific level
 * Formula: xp = (level - 1)^2 * 100
 */
export function xpForLevel(level: number): number {
  return Math.pow(Math.max(level - 1, 0), 2) * 100
}

/**
 * Calculate XP required for next level
 */
export function xpForNextLevel(currentLevel: number): number {
  return xpForLevel(currentLevel + 1)
}

/**
 * Calculate XP progress to next level
 */
export function xpProgress(currentXP: number, currentLevel: number): {
  current: number
  required: number
  percentage: number
} {
  const xpForCurrentLevel = xpForLevel(currentLevel)
  const xpForNext = xpForNextLevel(currentLevel)
  const current = currentXP - xpForCurrentLevel
  const required = xpForNext - xpForCurrentLevel
  const percentage = Math.min((current / required) * 100, 100)

  return { current, required, percentage }
}

/**
 * Get XP reward for an action
 */
export function getXPReward(action: ActionType): number {
  return XP_REWARDS[action.toUpperCase() as keyof typeof XP_REWARDS] || 0
}




