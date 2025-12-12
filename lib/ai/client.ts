/**
 * AI Client Helper
 * Supports both OpenAI and Groq APIs
 */

interface ModerationResult {
  isAppropriate: boolean
  reason?: string
}

interface SummaryResult {
  shortSummary: string
  longSummary: string
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
      const response = await fetch(`${this.baseURL}/chat/completions`, {
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
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from AI')
      }

      const result = JSON.parse(content) as ModerationResult
      return result
    } catch (error: any) {
      console.error('Error moderating message:', error)
      // Fallback: if moderation fails, allow the message (fail open)
      // In production, you might want to fail closed
      return { isAppropriate: true, reason: 'Error en moderación, mensaje permitido' }
    }
  }

  /**
   * Generate summaries for a stream
   */
  async generateSummary(
    title: string,
    messages: Array<{ content: string; created_at: string }>,
    streamerUsername?: string
  ): Promise<SummaryResult> {
    this.checkAPIKey()
    const messagesText = messages
      .slice(-200) // Last 200 messages
      .map((m) => m.content)
      .join('\n')

    const systemPrompt = `Eres un asistente que genera resúmenes de streams de transmisión en vivo.

Genera dos resúmenes del stream basándote en:
- El título del stream: "${title}"
- Los mensajes del chat (últimos 200 mensajes)
${streamerUsername ? `- El streamer: ${streamerUsername}` : ''}

Genera:
1. Un resumen corto (máximo 100 palabras) - breve y conciso
2. Un resumen extendido (máximo 300 palabras) - más detallado con temas principales, interacciones destacadas, y momentos importantes

Responde SOLO con JSON en este formato:
{
  "shortSummary": "resumen corto aquí",
  "longSummary": "resumen extendido aquí"
}`

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.provider === 'openai' ? 'gpt-4-turbo-preview' : 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Mensajes del chat:\n${messagesText}\n\nGenera los resúmenes.`,
            },
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
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from AI')
      }

      const result = JSON.parse(content) as SummaryResult
      return result
    } catch (error: any) {
      console.error('Error generating summary:', error)
      throw error
    }
  }
}

// Export singleton instance
export const aiClient = new AIClient()
