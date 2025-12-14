import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createServerClient()
    
    // Create admin client with service role key to bypass RLS for deleting messages
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

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
        
        // First, get the stream to get its ID
        const { data: streamData, error: streamFetchError } = await (supabase
          .from('streams') as any)
          .select('id')
          .eq('playback_id', playbackId)
          .single()

        if (streamFetchError || !streamData) {
          console.error('Error fetching stream for chat reset:', streamFetchError)
        } else {
          // Delete all messages for this stream to reset chat using admin client (bypasses RLS)
          const { error: deleteError, count } = await (supabaseAdmin
            .from('messages') as any)
            .delete()
            .eq('stream_id', streamData.id)
            .select('*', { count: 'exact', head: true })

          if (deleteError) {
            console.error('Error deleting messages on stream start:', deleteError)
          } else {
            console.log('Chat messages cleared for stream:', streamData.id, 'Messages deleted:', count || 0)
          }
        }

        // Update stream to live
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
        console.log('recording.ready webhook received, full body:', JSON.stringify(body, null, 2))
        
        // Try different payload structures that Livepeer might use
        const payload = body.payload || body.data || body
        const session = payload.session || payload.stream || body.stream

        if (!session) {
          console.error('recording.ready missing session/stream:', { payload, body })
          // Try to continue with what we have
        }

        // Try multiple ways to get playbackId
        const playbackId = session?.playbackId || 
                          payload?.playbackId || 
                          body.playbackId ||
                          session?.id ||
                          payload?.id

        // Try multiple ways to get recording URL
        const recordingUrl = payload?.recordingUrl || 
                            session?.recordingUrl || 
                            payload?.recording?.url ||
                            body.recordingUrl

        const mp4Url = payload?.mp4Url || session?.mp4Url

        console.log('Extracted data:', { playbackId, recordingUrl, mp4Url, hasSession: !!session })

        if (!playbackId) {
          console.error('recording.ready missing playbackId. Full body:', JSON.stringify(body, null, 2))
          // Don't return error, just log it - might be a different format
          break
        }

        // Get stream from database using playbackId
        const { data: streamData, error: streamError } = await (supabase
          .from('streams') as any)
          .select('id, user_id, playback_id')
          .eq('playback_id', playbackId)
          .single()

        if (streamError) {
          console.error('Error fetching stream for recording:', streamError, 'playbackId:', playbackId)
          // Try to find by partial match or other methods
          const { data: allStreams } = await (supabase
            .from('streams') as any)
            .select('id, user_id, playback_id')
            .limit(10)
          
          console.log('Available streams in DB:', allStreams?.map((s: any) => ({ id: s.id, playback_id: s.playback_id })))
          break
        }

        if (!streamData) {
          console.log('No stream found for playbackId:', playbackId)
          break
        }

        // Use the recordingUrl from the webhook, or construct it
        const finalRecordingUrl = recordingUrl || 
                                  mp4Url ||
                                  `https://playback.livepeer.studio/recordings/${playbackId}/index.m3u8`

        console.log('Saving VOD with URL:', finalRecordingUrl)

        // Check if video already exists to avoid duplicates
        const { data: existingVideo } = await (supabase
          .from('videos') as any)
          .select('id')
          .eq('stream_id', (streamData as any).id)
          .single()

        if (!existingVideo) {
          console.log('Creating VOD for stream:', (streamData as any).id, 'user:', (streamData as any).user_id)
          
          // Save video (VOD) to database
          const { error: insertError, data: insertedVideo } = await (supabase
            .from('videos') as any)
            .insert({
              stream_id: (streamData as any).id,
              user_id: (streamData as any).user_id,
              playback_url: finalRecordingUrl,
              duration: session?.transcodedSegmentsDuration || 
                       payload?.duration || 
                       null,
            })
            .select()
            .single()

          if (insertError) {
            console.error('Error inserting video:', insertError)
            console.error('Video data attempted:', {
              stream_id: (streamData as any).id,
              user_id: (streamData as any).user_id,
              playback_url: finalRecordingUrl,
            })
          } else {
            console.log('✅ VOD created successfully:', insertedVideo)
          }
        } else {
          console.log('VOD already exists for stream:', (streamData as any).id)
          // Update the URL in case it changed
          const { error: updateError } = await (supabase
            .from('videos') as any)
            .update({ playback_url: finalRecordingUrl })
            .eq('id', existingVideo.id)
          
          if (updateError) {
            console.error('Error updating video URL:', updateError)
          } else {
            console.log('Video URL updated')
          }
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
