import { NextRequest, NextResponse } from 'next/server'
import { livepeer } from '@/lib/livepeer'
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
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create stream in Livepeer
    const streamResponse = await livepeer.stream.create({
      name: title,
      record: true, // Enable recording for VOD
    })

    if (!streamResponse || !streamResponse.stream) {
      return NextResponse.json(
        { error: 'Failed to create stream in Livepeer' },
        { status: 500 }
      )
    }

    const stream = streamResponse.stream

    // Validate stream ID exists
    if (!stream.id || typeof stream.id !== 'string') {
      return NextResponse.json(
        { error: 'Stream ID is missing' },
        { status: 500 }
      )
    }

    // Get stream key and RTMP ingest URL
    const streamKeyResponse = await livepeer.stream.get(stream.id)
    
    if (!streamKeyResponse || !streamKeyResponse.stream) {
      return NextResponse.json(
        { error: 'Failed to get stream details' },
        { status: 500 }
      )
    }

    const streamKey = streamKeyResponse.stream.streamKey
    // RTMP ingest URL is constant for Livepeer Studio
    const ingestUrl = `rtmp://rtmp.livepeer.com/live`

    // Save stream to Supabase
    const { data: streamData, error: dbError } = await supabase
      .from('streams')
      .insert({
        user_id: user.id,
        title,
        stream_key: streamKey || '',
        ingest_url: ingestUrl,
        playback_id: stream.playbackId || '',
        is_live: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save stream to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: streamData.id,
      streamKey: streamKey || '',
      playbackId: stream.playbackId || '',
      ingestUrl,
      stream: streamData,
    })
  } catch (error) {
    console.error('Create stream error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
