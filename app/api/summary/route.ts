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
    const { stream_id } = body

    if (!stream_id) {
      return NextResponse.json(
        { error: 'stream_id is required' },
        { status: 400 }
      )
    }

    if (typeof stream_id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Get stream information
    const { data: stream, error: streamError } = await (supabase
      .from('streams') as any)
      .select('id, title, user_id')
      .eq('id', stream_id)
      .single()

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    // Verify the stream belongs to the user
    if (stream.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only generate summaries for your own streams' },
        { status: 403 }
      )
    }

    // Get streamer profile
    const { data: streamerProfile } = await (supabase
      .from('profiles') as any)
      .select('username')
      .eq('id', stream.user_id)
      .single()

    // Get last 200 messages from the stream (only visible ones)
    const { data: messages, error: messagesError } = await (supabase
      .from('messages') as any)
      .select('content, created_at')
      .eq('stream_id', stream_id)
      .eq('hidden', false) // Only visible messages
      .order('created_at', { ascending: true })
      .limit(200)

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: 'No messages found for this stream' },
        { status: 400 }
      )
    }

    // Generate summary using AI
    let summaries
    try {
      summaries = await aiClient.generateSummary(
        stream.title,
        messages,
        streamerProfile?.username
      )
    } catch (error: any) {
      console.error('Error generating summary:', error)
      return NextResponse.json(
        { error: 'Failed to generate summary. Please try again later.' },
        { status: 500 }
      )
    }

    // Save summary to database
    const { data: summaryData, error: insertError } = await (supabase
      .from('stream_summaries') as any)
      .insert({
        stream_id: stream_id,
        short_summary: summaries.shortSummary,
        long_summary: summaries.longSummary,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error saving summary:', insertError)
      return NextResponse.json(
        { error: 'Failed to save summary' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      summary: summaryData,
      message: 'Summary generated successfully',
    })
  } catch (error) {
    console.error('Generate summary error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
