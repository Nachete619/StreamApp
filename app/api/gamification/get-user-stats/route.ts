import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Get user profile with XP and level
    const { data: profile, error: profileError } = await (supabase
      .from('profiles') as any)
      .select('total_xp, level')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const userLevel = (profile as any).level || 1
    const totalXP = (profile as any).total_xp || 0

    // Get user badges
    const { data: badges } = await (supabase
      .from('user_badges') as any)
      .select(`
        badge_id,
        unlocked_at,
        badges:badge_id (
          id,
          name,
          description,
          icon
        )
      `)
      .eq('user_id', user.id)

    // Get unlocked special emojis (based on level)
    const { data: emojis } = await (supabase
      .from('special_emojis') as any)
      .select('*')
      .lte('unlock_level', userLevel)
      .order('unlock_level', { ascending: true })

    // Get action counts
    const { count: watchCount } = await supabase
      .from('user_stream_views')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: chatCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('hidden', false)

    return NextResponse.json({
      total_xp: totalXP,
      level: userLevel,
      badges: badges?.map((b: any) => ({
        id: b.badges.id,
        name: b.badges.name,
        description: b.badges.description,
        icon: b.badges.icon,
        unlocked_at: b.unlocked_at,
      })) || [],
      emojis: emojis || [],
      stats: {
        streams_watched: watchCount || 0,
        messages_sent: chatCount || 0,
      },
    })
  } catch (error: any) {
    console.error('Get user stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

