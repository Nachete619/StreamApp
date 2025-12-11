import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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

    // Insert message (without join to avoid foreign key error)
    const { data: messageData, error: insertError } = await (supabase
      .from('messages') as any)
      .insert({
        user_id: user.id,
        stream_id,
        content: content.trim(),
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

    // Fetch profile separately
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('id, username, avatar_url')
      .eq('id', user.id)
      .single()

    // Combine message with profile
    const message = {
      ...messageData,
      profiles: profile || null
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
