import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const username = searchParams.get('username')
    const userId = searchParams.get('userId')
    const streamId = searchParams.get('streamId')

    let query = (supabase
      .from('streams') as any)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url,
          bio
        )
      `)

    if (streamId) {
      query = query.eq('id', streamId)
    } else if (username) {
      // Get stream by username
      const { data: profile } = await (supabase
        .from('profiles') as any)
        .select('id')
        .eq('username', username)
        .single()

      if (!profile) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      query = query.eq('user_id', (profile as any).id).order('created_at', { ascending: false }).limit(1)
    } else if (userId) {
      query = query.eq('user_id', userId).order('created_at', { ascending: false }).limit(1)
    } else {
      return NextResponse.json(
        { error: 'username, userId, or streamId is required' },
        { status: 400 }
      )
    }

    const { data: streams, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch stream' },
        { status: 500 }
      )
    }

    if (!streams || streams.length === 0) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ stream: streams[0] })
  } catch (error) {
    console.error('Get stream error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
