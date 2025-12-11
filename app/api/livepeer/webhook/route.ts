import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createServerClient()

    // Verify webhook signature if needed (add this for production)
    // const signature = request.headers.get('livepeer-signature')
    
    // Livepeer sends 'event' not 'type', and the structure is different
    const eventType = body.event || body.type
    
    console.log('Webhook received:', { 
      event: eventType, 
      hasStream: !!body.stream, 
      hasPayload: !!body.payload,
      hasSession: !!(body.payload?.session || body.session)
    })

    if (!eventType) {
      console.error('Webhook missing event/type:', body)
      return NextResponse.json(
        { error: 'Invalid webhook payload: missing event' },
        { status: 400 }
      )
    }

    // Handle different webhook types
    switch (eventType) {
      case 'stream.started': {
        // For stream.started, the stream is in body.stream
        const stream = body.stream

        if (!stream) {
          console.error('stream.started missing stream:', body)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing stream' },
            { status: 400 }
          )
        }

        const playbackId = stream.playbackId

        if (!playbackId) {
          console.error('stream.started missing playbackId:', stream)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing playbackId' },
            { status: 400 }
          )
        }

        console.log('Updating stream to live:', playbackId)
        const { data: updatedData, error: updateError, count } = await (supabase
          .from('streams') as any)
          .update({ is_live: true })
          .eq('playback_id', playbackId)
          .select()

        if (updateError) {
          console.error('Error updating stream.started:', updateError)
        } else {
          console.log('Stream updated to live successfully:', {
            playbackId,
            rowsUpdated: updatedData?.length || 0,
            updatedData
          })
          
          if (!updatedData || updatedData.length === 0) {
            console.warn(`⚠️ No stream found with playback_id: ${playbackId}. Stream may not exist in database.`)
          }
        }
        break
      }

      case 'stream.idle': {
        // For stream.idle, the stream is in body.stream
        const stream = body.stream

        if (!stream) {
          console.error('stream.idle missing stream:', body)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing stream' },
            { status: 400 }
          )
        }

        const playbackId = stream.playbackId

        if (!playbackId) {
          console.error('stream.idle missing playbackId:', stream)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing playbackId' },
            { status: 400 }
          )
        }

        console.log('Updating stream to idle:', playbackId)
        const { data: updatedData, error: updateError } = await (supabase
          .from('streams') as any)
          .update({ is_live: false })
          .eq('playback_id', playbackId)
          .select()

        if (updateError) {
          console.error('Error updating stream.idle:', updateError)
        } else {
          console.log('Stream updated to idle successfully:', {
            playbackId,
            rowsUpdated: updatedData?.length || 0
          })
          
          if (!updatedData || updatedData.length === 0) {
            console.warn(`⚠️ No stream found with playback_id: ${playbackId}. Stream may not exist in database.`)
          }
        }
        break
      }

      case 'stream.ended': {
        // For stream.ended, the stream is in body.stream
        const stream = body.stream

        if (!stream) {
          console.error('stream.ended missing stream:', body)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing stream' },
            { status: 400 }
          )
        }

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
        } else {
          console.log('Stream updated to ended successfully')
        }
        break
      }

      case 'recording.ready': {
        // For recording.ready, the data is in body.payload
        const payload = body.payload

        if (!payload) {
          console.error('recording.ready missing payload:', body)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing payload' },
            { status: 400 }
          )
        }

        const session = payload.session

        if (!session) {
          console.error('recording.ready missing session:', payload)
          return NextResponse.json(
            { error: 'Invalid webhook payload: missing session' },
            { status: 400 }
          )
        }

        const playbackId = session.playbackId
        const recordingUrl = payload.recordingUrl || session.recordingUrl
        const mp4Url = payload.mp4Url || session.mp4Url

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
        console.log('Unhandled webhook event type:', eventType)
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
