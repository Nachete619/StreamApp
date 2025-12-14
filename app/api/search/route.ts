import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        success: true,
        streams: [],
        users: [],
        total: 0,
      })
    }

    const searchTerm = `%${query.trim()}%`

    // Search streams (by title)
    const { data: streams, error: streamsError } = await (supabase
      .from('streams') as any)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .ilike('title', searchTerm)
      .eq('is_live', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (streamsError) {
      console.error('Error searching streams:', streamsError)
    }

    // Search users/profiles (by username)
    const { data: users, error: usersError } = await (supabase
      .from('profiles') as any)
      .select('*')
      .ilike('username', searchTerm)
      .limit(20)

    if (usersError) {
      console.error('Error searching users:', usersError)
    }

    // Search offline streams (by title) - for VODs
    const { data: offlineStreams, error: offlineStreamsError } = await (supabase
      .from('streams') as any)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .ilike('title', searchTerm)
      .eq('is_live', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (offlineStreamsError) {
      console.error('Error searching offline streams:', offlineStreamsError)
    }

    return NextResponse.json({
      success: true,
      query: query.trim(),
      streams: streams || [],
      offlineStreams: offlineStreams || [],
      users: users || [],
      total: (streams?.length || 0) + (users?.length || 0) + (offlineStreams?.length || 0),
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

