import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
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
    const { streamId } = body

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId is required' },
        { status: 400 }
      )
    }

    if (typeof streamId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Verify the stream belongs to the user
    const { data: stream, error: streamError } = await (supabase
      .from('streams') as any)
      .select('user_id, is_live')
      .eq('id', streamId)
      .single()

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    if (stream.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only stop your own streams' },
        { status: 403 }
      )
    }

    // Only update if stream is currently live
    if (!stream.is_live) {
      return NextResponse.json(
        { error: 'Stream is already offline' },
        { status: 400 }
      )
    }

    // Update is_live to false
    const { data: updatedStream, error: updateError } = await (supabase
      .from('streams') as any)
      .update({ is_live: false })
      .eq('id', streamId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to stop stream' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stream: updatedStream })
  } catch (error) {
    console.error('Stop stream error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
