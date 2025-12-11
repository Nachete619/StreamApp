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
    const { streamId, title } = body

    if (!streamId || !title) {
      return NextResponse.json(
        { error: 'streamId and title are required' },
        { status: 400 }
      )
    }

    if (typeof streamId !== 'string' || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    if (title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title cannot be empty' },
        { status: 400 }
      )
    }

    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title too long (max 100 characters)' },
        { status: 400 }
      )
    }

    // Verify the stream belongs to the user
    const { data: stream, error: streamError } = await (supabase
      .from('streams') as any)
      .select('user_id')
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
        { error: 'Unauthorized: You can only update your own streams' },
        { status: 403 }
      )
    }

    // Update the title
    const { data: updatedStream, error: updateError } = await (supabase
      .from('streams') as any)
      .update({ title: title.trim() })
      .eq('id', streamId)
      .select()
      .single()

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update stream title' },
        { status: 500 }
      )
    }

    return NextResponse.json({ stream: updatedStream })
  } catch (error) {
    console.error('Update title error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

