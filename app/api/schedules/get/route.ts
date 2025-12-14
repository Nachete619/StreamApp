import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = (supabase
      .from('stream_schedules') as any)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        ),
        streams:stream_id (
          id,
          title,
          playback_id
        )
      `)
      .eq('is_active', true)
      .order('scheduled_start', { ascending: true })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (upcoming) {
      const now = new Date().toISOString()
      query = query.gte('scheduled_start', now)
    }

    const { data: schedules, error } = await query

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedules: schedules || [],
    })
  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

