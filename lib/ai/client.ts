/**
 * AI Client Helper
 * Supports both OpenAI and Groq APIs
 */

interface ModerationResult {
  isAppropriate: boolean
  reason?: string
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

}

// Export singleton instance
export const aiClient = new AIClient()
