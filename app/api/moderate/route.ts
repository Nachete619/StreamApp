import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { aiClient } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { stream_id, content } = body

    if (!stream_id || !content) {
      return NextResponse.json(
        { error: 'stream_id and content are required' },
        { status: 400 }
      )
    }

    if (typeof stream_id !== 'string' || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Message too long (max 500 characters)' },
        { status: 400 }
      )
    }

    // Moderate the message using AI
    let isAppropriate = true
    let moderationReason: string | undefined

    try {
      const moderationResult = await aiClient.moderateMessage(content.trim())
      isAppropriate = moderationResult.isAppropriate
      moderationReason = moderationResult.reason

      console.log('Moderation result:', {
        isAppropriate,
        reason: moderationReason,
        contentLength: content.length,
      })
    } catch (error: any) {
      console.error('Error in AI moderation:', error)
      // If moderation fails, allow the message (fail open)
      // You can change this to fail closed if preferred
      isAppropriate = true
    }

    // Insert message with hidden flag
    const { data: messageData, error: insertError } = await (supabase
      .from('messages') as any)
      .insert({
        user_id: user.id,
        stream_id,
        content: content.trim(),
        hidden: !isAppropriate, // hidden = true if inappropriate
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Database error:', insertError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Only fetch profile if message is not hidden (for realtime)
    let profile = null
    if (isAppropriate) {
      const { data: profileData } = await (supabase
        .from('profiles') as any)
        .select('id, username, avatar_url')
        .eq('id', user.id)
        .single()

      profile = profileData || null
    }

    // Combine message with profile
    const message = {
      ...messageData,
      profiles: profile,
    }

    return NextResponse.json({
      message,
      moderated: !isAppropriate,
      reason: moderationReason,
    })
  } catch (error) {
    console.error('Moderate message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
