import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getLivepeerClient } from '@/lib/livepeer'

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

    // Verify the stream belongs to the user and get playback_id
    const { data: stream, error: streamError } = await (supabase
      .from('streams') as any)
      .select('user_id, is_live, playback_id, stream_key')
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

    // Try to save video immediately when stream stops
    // This is a fallback in case the webhook doesn't fire or is delayed
    if (stream.playback_id) {
      try {
        const playbackId = stream.playback_id
        
        // Construct the recording URL (Livepeer standard format)
        const constructedRecordingUrl = `https://playback.livepeer.studio/recordings/${playbackId}/index.m3u8`
        
        // Check if video already exists
        const { data: existingVideo } = await (supabase
          .from('videos') as any)
          .select('id')
          .eq('stream_id', streamId)
          .single()

        if (!existingVideo) {
          console.log('Attempting to save video for stream:', streamId, 'playbackId:', playbackId)
          
          // Save with the constructed URL
          // The recording might not be ready immediately, but we'll save the URL
          // Livepeer will make it available when ready, and the webhook can update it later
          const { error: insertError, data: insertedVideo } = await (supabase
            .from('videos') as any)
            .insert({
              stream_id: streamId,
              user_id: stream.user_id,
              playback_url: constructedRecordingUrl,
              duration: null, // Will be updated later by webhook if available
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error saving video to database:', insertError)
            console.error('Video data attempted:', {
              stream_id: streamId,
              user_id: stream.user_id,
              playback_url: constructedRecordingUrl,
            })
          } else {
            console.log('✅ Video saved to database immediately:', insertedVideo?.id)
          }
        } else {
          console.log('Video already exists for stream:', streamId)
        }
      } catch (error: any) {
        // Don't fail the request if video save fails
        // The webhook will handle it later
        console.error('Error in video save attempt:', error?.message || error)
      }
    } else {
      console.warn('No playback_id found for stream:', streamId, '- cannot save video')
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
