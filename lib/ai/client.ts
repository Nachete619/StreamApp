/**
 * AI Client Helper
 * Supports both OpenAI and Groq APIs
 */

interface ModerationResult {
  isAppropriate: boolean
  reason?: string
}

interface SummaryResult {
  short_summary: string
  long_summary: string
}

export class AIClient {
  private apiKey: string
  private baseURL: string
  private provider: 'openai' | 'groq'

  constructor() {
    // Check for OpenAI first, then Groq
    const openaiKey = process.env.OPENAI_API_KEY
    const groqKey = process.env.GROQ_API_KEY

    if (openaiKey && openaiKey !== '') {
      this.apiKey = openaiKey
      this.baseURL = 'https://api.openai.com/v1'
      this.provider = 'openai'
    } else if (groqKey && groqKey !== '') {
      this.apiKey = groqKey
      this.baseURL = 'https://api.groq.com/openai/v1'
      this.provider = 'groq'
    } else {
      // Don't throw error in constructor, check in methods instead
      this.apiKey = ''
      this.baseURL = ''
      this.provider = 'openai'
    }
  }

  private checkAPIKey(): void {
    if (!this.apiKey || this.apiKey === '') {
      throw new Error('No AI API key found. Please set OPENAI_API_KEY or GROQ_API_KEY in environment variables.')
    }
  }

  /**
   * Moderate a message to check if it's appropriate
   */
  async moderateMessage(content: string): Promise<ModerationResult> {
    this.checkAPIKey()
    const systemPrompt = `Eres un moderador de chat para una plataforma de streaming. 
Analiza el siguiente mensaje y determina si es apropiado para un chat público.

El mensaje es INAPROPIADO si contiene:
- Insultos o lenguaje ofensivo
- Odio o discriminación
- Acoso o bullying
- Contenido sexual explícito o inapropiado
- Amenazas o violencia
- Spam excesivo o contenido repetitivo

Responde SOLO con JSON en este formato:
{
  "isAppropriate": true/false,
  "reason": "breve explicación si es inapropiado"
}`

    try {
      const response: Response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.provider === 'openai' ? 'gpt-3.5-turbo' : 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: content },
          ],
          temperature: 0.3,
          max_tokens: 150,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AI API error:', error)
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()
      const responseContent = data.choices[0]?.message?.content

      if (!responseContent) {
        throw new Error('No response from AI')
      }

      const result = JSON.parse(responseContent) as ModerationResult
      return result
    } catch (error: any) {
      console.error('Error moderating message:', error)
      // Fallback: if moderation fails, allow the message (fail open)
      // In production, you might want to fail closed
      return { isAppropriate: true, reason: 'Error en moderación, mensaje permitido' }
    }
  }

  /**
   * Generate stream summary based on metadata and optional chat messages
   */
  async generateSummary(metadata: {
    title: string
    category: string | null
    duration?: number // in seconds
    isLive: boolean
    messageCount?: number
    createdAt: string
  }, chatMessages?: string[]): Promise<SummaryResult> {
    this.checkAPIKey()

    // Calculate duration text
    let durationText = ''
    if (metadata.duration) {
      const hours = Math.floor(metadata.duration / 3600)
      const minutes = Math.floor((metadata.duration % 3600) / 60)
      if (hours > 0) {
        durationText = `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minuto${minutes !== 1 ? 's' : ''}`
      } else {
        durationText = `${minutes} minuto${minutes !== 1 ? 's' : ''}`
      }
    } else if (metadata.isLive) {
      const now = new Date()
      const start = new Date(metadata.createdAt)
      const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
      const hours = Math.floor(diff / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      if (hours > 0) {
        durationText = `${hours} hora${hours > 1 ? 's' : ''} y ${minutes} minuto${minutes !== 1 ? 's' : ''}`
      } else {
        durationText = `${minutes} minuto${minutes !== 1 ? 's' : ''}`
      }
    }

    // Build context
    const categoryMap: Record<string, string> = {
      gaming: 'Gaming',
      music: 'Música',
      coding: 'Programación',
    }
    const categoryName = metadata.category ? categoryMap[metadata.category] || metadata.category : 'General'
    
    const statusText = metadata.isLive ? 'en vivo' : 'finalizado'
    const dateText = new Date(metadata.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    let contextText = `Stream de ${categoryName} titulado "${metadata.title}", ${statusText}`
    if (durationText) {
      contextText += ` con una duración de ${durationText}`
    }
    contextText += `, transmitido el ${dateText}.`
    
    if (metadata.messageCount && metadata.messageCount > 0) {
      contextText += ` El chat tuvo ${metadata.messageCount} mensajes durante la transmisión.`
    }

    // Add sample chat messages if provided (limited to avoid token limits)
    if (chatMessages && chatMessages.length > 0) {
      const sampleMessages = chatMessages.slice(0, 15).join('\n- ')
      contextText += `\n\nAlgunos mensajes destacados del chat:\n- ${sampleMessages}`
    } else if (metadata.isLive) {
      contextText += ' El stream está en curso y aún no hay suficiente actividad en el chat para incluirlo en el resumen.'
    }

    const systemPrompt = `Eres un asistente que genera resúmenes de streams de una plataforma de streaming.

Basándote en la información proporcionada, genera DOS resúmenes en español:

1. **Resumen corto**: Máximo 100 palabras. Debe ser conciso y directo, destacando los aspectos más importantes del stream.

2. **Resumen extendido**: Máximo 300 palabras. Debe ser más detallado, incluyendo contexto sobre la categoría, el contenido y la interacción con el chat si es relevante.

IMPORTANTE:
- Si el stream está en vivo, menciona que es un resumen "hasta el momento"
- Sé profesional pero amigable
- No inventes información que no esté en el contexto
- Responde SOLO con JSON en este formato exacto:
{
  "short_summary": "resumen corto aquí",
  "long_summary": "resumen extendido aquí"
}`

    try {
      const response: Response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.provider === 'openai' ? 'gpt-3.5-turbo' : 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: contextText },
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AI API error:', error)
        throw new Error(`AI API error: ${response.status}`)
      }

      const data = await response.json()
      const responseContent = data.choices[0]?.message?.content

      if (!responseContent) {
        throw new Error('No response from AI')
      }

      const result = JSON.parse(responseContent) as SummaryResult
      
      // Validate and clean summaries
      if (!result.short_summary || !result.long_summary) {
        throw new Error('Invalid summary format from AI')
      }

      return {
        short_summary: result.short_summary.trim(),
        long_summary: result.long_summary.trim(),
      }
    } catch (error: any) {
      console.error('Error generating summary:', error)
      throw new Error(`Error al generar resumen: ${error.message}`)
    }
  }

}

// Export singleton instance
export const aiClient = new AIClient()
