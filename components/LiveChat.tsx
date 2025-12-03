'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './Providers'
import { Send, User } from 'lucide-react'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Message {
  id: string
  content: string
  created_at: string
  profiles: {
    username: string
    avatar_url: string | null
  }
}

interface LiveChatProps {
  streamId: string
}

export function LiveChat({ streamId }: LiveChatProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch initial messages
    fetchMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel(`stream:${streamId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          fetchMessages()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [streamId, supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('stream_id', streamId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      setMessages(data as Message[] || [])
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching messages:', error)
      toast.error('Error al cargar mensajes')
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Debes iniciar sesión para enviar mensajes')
      return
    }

    if (!newMessage.trim()) return

    const messageContent = newMessage.trim()
    setNewMessage('')

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stream_id: streamId,
          content: messageContent,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar mensaje')
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar mensaje')
      setNewMessage(messageContent)
    }
  }

  return (
    <div className="flex flex-col h-full bg-dark-900 border-l border-dark-800">
      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-dark-800">
        <h3 className="font-semibold text-dark-50">Chat en Vivo</h3>
        <p className="text-xs text-dark-400 mt-1">{messages.length} mensajes</p>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide"
      >
        {loading ? (
          <div className="text-center text-dark-400 py-8">
            <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Cargando mensajes...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-dark-400 py-8">
            <p className="text-sm">No hay mensajes todavía</p>
            <p className="text-xs mt-1">Sé el primero en escribir!</p>
          </div>
        ) : (
          messages.map((message) => {
            const timeAgo = formatDistanceToNow(new Date(message.created_at), {
              addSuffix: true,
              locale: es,
            })

            return (
              <div key={message.id} className="flex gap-3 animate-fade-in">
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center overflow-hidden">
                  {message.profiles.avatar_url ? (
                    <Image
                      src={message.profiles.avatar_url}
                      alt={message.profiles.username}
                      width={32}
                      height={32}
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-dark-200 text-sm">
                      {message.profiles.username}
                    </span>
                    <span className="text-xs text-dark-500">{timeAgo}</span>
                  </div>
                  <p className="text-dark-300 text-sm break-words">
                    {message.content}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {user ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t border-dark-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="input flex-1 text-sm"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn btn-primary px-4 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 border-t border-dark-800 text-center">
          <p className="text-sm text-dark-400 mb-2">
            <a href="/auth/login" className="text-accent-500 hover:text-accent-400">
              Inicia sesión
            </a>{' '}
            para participar en el chat
          </p>
        </div>
      )}
    </div>
  )
}
