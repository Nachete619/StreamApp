'use client'

import { useState, useEffect } from 'react'
import { Smile } from 'lucide-react'

interface SpecialEmoji {
  id: string
  emoji: string
  name: string
  description: string | null
  unlock_level: number
}

interface SpecialEmojiPickerProps {
  onSelect: (emoji: string) => void
  currentLevel: number
}

export function SpecialEmojiPicker({ onSelect, currentLevel }: SpecialEmojiPickerProps) {
  const [emojis, setEmojis] = useState<SpecialEmoji[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Fetch unlocked emojis
    fetch('/api/gamification/get-user-stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.emojis) {
          setEmojis(data.emojis)
        }
      })
      .catch((error) => {
        console.error('Error fetching emojis:', error)
      })
  }, [])

  const unlockedEmojis = emojis.filter((e) => e.unlock_level <= currentLevel)

  if (unlockedEmojis.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
        title="Emojis especiales"
      >
        <Smile className="w-5 h-5 text-accent-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 bg-dark-800 border border-dark-700 rounded-lg p-3 shadow-xl z-20 min-w-[200px]">
            <div className="text-xs text-dark-400 mb-2 font-semibold">
              Emojis Especiales
            </div>
            <div className="grid grid-cols-4 gap-2">
              {unlockedEmojis.map((emoji) => (
                <button
                  key={emoji.id}
                  type="button"
                  onClick={() => {
                    onSelect(emoji.emoji)
                    setIsOpen(false)
                  }}
                  className="text-2xl hover:scale-125 transition-transform p-2 rounded-lg hover:bg-dark-700"
                  title={emoji.name}
                >
                  {emoji.emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}




