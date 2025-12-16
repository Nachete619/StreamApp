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
    const { title, category } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = ['gaming', 'music', 'coding']
    const streamCategory = category && validCategories.includes(category) ? category : 'gaming'

    // Validate API key before making request
    const apiKey = process.env.LIVEPEER_API_KEY || process.env.NEXT_PUBLIC_LIVEPEER_API_KEY
    if (!apiKey || apiKey === 'build-time-dummy-key-for-nextjs-build') {
      console.error('LIVEPEER_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Livepeer API key is not configured. Please set LIVEPEER_API_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    // Create stream in Livepeer
    let streamResponse
    try {
      streamResponse = await livepeer.stream.create({
        name: title,
        record: true, // Enable recording for VOD
      })
    } catch (error: any) {
      console.error('Livepeer API error:', error)
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      const errorDetails = error?.response?.data || error?.body || {}
      
      return NextResponse.json(
        { 
          error: 'Failed to create stream in Livepeer',
          details: errorMessage,
          livepeerError: errorDetails
        },
        { status: error?.status || error?.statusCode || 500 }
      )
    }

    if (!streamResponse || !streamResponse.stream) {
      console.error('Invalid stream response:', streamResponse)
      return NextResponse.json(
        { 
          error: 'Failed to create stream in Livepeer',
          details: 'Stream response is invalid or empty',
          response: streamResponse
        },
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
    let streamKeyResponse
    try {
      streamKeyResponse = await livepeer.stream.get(stream.id)
    } catch (error: any) {
      console.error('Livepeer get stream error:', error)
      const errorMessage = error?.message || error?.toString() || 'Unknown error'
      return NextResponse.json(
        { 
          error: 'Failed to get stream details from Livepeer',
          details: errorMessage
        },
        { status: error?.status || error?.statusCode || 500 }
      )
    }
    
    if (!streamKeyResponse || !streamKeyResponse.stream) {
      console.error('Invalid stream key response:', streamKeyResponse)
      return NextResponse.json(
        { 
          error: 'Failed to get stream details',
          details: 'Stream key response is invalid or empty'
        },
        { status: 500 }
      )
    }

    const streamKey = streamKeyResponse.stream.streamKey
    // RTMP ingest URL is constant for Livepeer Studio
    const ingestUrl = `rtmp://rtmp.livepeer.com/live`

    // Save stream to Supabase
    const { data: streamData, error: dbError } = await (supabase
      .from('streams') as any)
      .insert({
        user_id: user.id,
        title,
        stream_key: streamKey || '',
        ingest_url: ingestUrl,
        playback_id: stream.playbackId || '',
        is_live: false,
        category: streamCategory,
      })
      .select()
      .single()

    if (dbError || !streamData) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save stream to database' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      id: (streamData as any).id,
      streamKey: streamKey || '',
      playbackId: stream.playbackId || '',
      ingestUrl,
      stream: streamData,
    })
  } catch (error: any) {
    console.error('Create stream error:', error)
    const errorMessage = error?.message || error?.toString() || 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
