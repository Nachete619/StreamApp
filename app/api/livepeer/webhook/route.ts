import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createServerClient()

    // Verify webhook signature if needed (add this for production)
    // const signature = request.headers.get('livepeer-signature')
    
    const { type, stream } = body

    if (!type || !stream) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      )
    }

    // Handle different webhook types
    switch (type) {
      case 'stream.started':
        // Update stream status to live
        await supabase
          .from('streams')
          .update({ is_live: true })
          .eq('playback_id', stream.playbackId)

        break

      case 'stream.idle':
        // Update stream status to offline
        await supabase
          .from('streams')
          .update({ is_live: false })
          .eq('playback_id', stream.playbackId)
        break

      case 'stream.ended':
        // Update stream status to offline
        await supabase
          .from('streams')
          .update({ is_live: false })
          .eq('playback_id', stream.playbackId)
        break

      case 'recording.ready':
        // When recording is ready, save as VOD
        // Get stream from database
        const { data: streamData } = await supabase
          .from('streams')
          .select('id, user_id, playback_id')
          .eq('playback_id', stream.playbackId)
          .single()

        if (streamData) {
          // Get recording URL from Livepeer
          // The recording URL format: https://playback.livepeer.studio/recordings/{playbackId}/index.m3u8
          const playbackUrl = `https://playback.livepeer.studio/recordings/${stream.playbackId}/index.m3u8`

          // Check if video already exists to avoid duplicates
          const { data: existingVideo } = await supabase
            .from('videos')
            .select('id')
            .eq('stream_id', streamData.id)
            .single()

          if (!existingVideo) {
            // Save video (VOD) to database
            await supabase
              .from('videos')
              .insert({
                stream_id: streamData.id,
                user_id: streamData.user_id,
                playback_url: playbackUrl,
                duration: null, // You can calculate this later if needed
              })
          }
        }
        break

      default:
        console.log('Unhandled webhook type:', type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
