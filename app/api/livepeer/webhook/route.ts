import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createServerClient()

    // Verify webhook signature if needed (add this for production)
    // const signature = request.headers.get('livepeer-signature')
    
    console.log('Webhook received:', { type: body.type, hasStream: !!body.stream, hasSession: !!body.session })
    
    const { type } = body

    if (!type) {
      console.error('Webhook missing type:', body)
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing type' },
        { status: 400 }
      )
    }

    // Handle different webhook types
    switch (type) {
      case 'stream.started': {
        // For stream.started, the entire body IS the stream object
        const stream = body
        const playbackId = stream.playbackId

        if (!playbackId) {
          console.error('stream.started missing playbackId:', stream)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing playbackId' },
            { status: 400 }
          )
        }

        console.log('Updating stream to live:', playbackId)
        const { error: updateError } = await (supabase
          .from('streams') as any)
          .update({ is_live: true })
          .eq('playback_id', playbackId)

        if (updateError) {
          console.error('Error updating stream.started:', updateError)
        }
        break
      }

      case 'stream.idle': {
        // For stream.idle, the entire body IS the stream object
        const stream = body
        const playbackId = stream.playbackId

        if (!playbackId) {
          console.error('stream.idle missing playbackId:', stream)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing playbackId' },
            { status: 400 }
          )
        }

        console.log('Updating stream to idle:', playbackId)
        const { error: updateError } = await (supabase
          .from('streams') as any)
          .update({ is_live: false })
          .eq('playback_id', playbackId)

        if (updateError) {
          console.error('Error updating stream.idle:', updateError)
        }
        break
      }

      case 'stream.ended': {
        // For stream.ended, the entire body IS the stream object
        const stream = body
        const playbackId = stream.playbackId

        if (!playbackId) {
          console.error('stream.ended missing playbackId:', stream)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing playbackId' },
            { status: 400 }
          )
        }

        console.log('Updating stream to ended:', playbackId)
        const { error: updateError } = await (supabase
          .from('streams') as any)
          .update({ is_live: false })
          .eq('playback_id', playbackId)

        if (updateError) {
          console.error('Error updating stream.ended:', updateError)
        }
        break
      }

      case 'recording.ready': {
        // For recording.ready, the playbackId is in session.playbackId
        const session = body.session

        if (!session) {
          console.error('recording.ready missing session:', body)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing session' },
            { status: 400 }
          )
        }

        const playbackId = session.playbackId
        const recordingUrl = body.recordingUrl || session.recordingUrl
        const mp4Url = body.mp4Url || session.mp4Url

        if (!playbackId) {
          console.error('recording.ready missing playbackId:', session)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing playbackId in session' },
            { status: 400 }
          )
        }

        console.log('Processing recording.ready:', { playbackId, recordingUrl, mp4Url })

        // Get stream from database using playbackId
        const { data: streamData, error: streamError } = await (supabase
          .from('streams') as any)
          .select('id, user_id, playback_id')
          .eq('playback_id', playbackId)
          .single()

        if (streamError) {
          console.error('Error fetching stream for recording:', streamError)
          // Don't return error, just log it - the recording might be for a stream we don't have
          break
        }

        if (!streamData) {
          console.log('No stream found for playbackId:', playbackId)
          // Don't return error, just log it
          break
        }

        // Use the recordingUrl from the webhook, or fallback to the old format
        const finalRecordingUrl = recordingUrl || `https://playback.livepeer.studio/recordings/${playbackId}/index.m3u8`

        // Check if video already exists to avoid duplicates
        const { data: existingVideo } = await (supabase
          .from('videos') as any)
          .select('id')
          .eq('stream_id', (streamData as any).id)
          .single()

        if (!existingVideo) {
          console.log('Creating VOD for stream:', (streamData as any).id)
          // Save video (VOD) to database
          const { error: insertError } = await (supabase
            .from('videos') as any)
            .insert({
              stream_id: (streamData as any).id,
              user_id: (streamData as any).user_id,
              playback_url: finalRecordingUrl,
              duration: session.transcodedSegmentsDuration || null,
            })

          if (insertError) {
            console.error('Error inserting video:', insertError)
          } else {
            console.log('VOD created successfully')
          }
        } else {
          console.log('VOD already exists for stream:', (streamData as any).id)
        }
        break
      }

      default:
        console.log('Unhandled webhook type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error?.message || error?.toString()
      },
      { status: 500 }
    )
  }
}
