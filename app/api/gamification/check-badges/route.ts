import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

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

    // Get user profile
    const { data: profile } = await (supabaseAdmin
      .from('profiles') as any)
      .select('total_xp, level')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    const profileData = profile as any
    const userLevel = profileData.level || 1
    const totalXP = profileData.total_xp || 0

    // Get user's current badges
    const { data: userBadges } = await (supabaseAdmin
      .from('user_badges') as any)
      .select('badge_id')
      .eq('user_id', user.id)

    const ownedBadgeIds = new Set((userBadges || []).map((b: any) => b.badge_id))

    // Get action counts
    const { count: watchCount } = await (supabaseAdmin
      .from('user_stream_views') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const { count: chatCount } = await (supabaseAdmin
      .from('messages') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('hidden', false)

    // Get all badges
    const { data: allBadges } = await (supabaseAdmin
      .from('badges') as any)
      .select('*')

    const newlyUnlocked: any[] = []

    // Check each badge
    for (const badge of allBadges || []) {
      if (ownedBadgeIds.has(badge.id)) continue // Already owned

      let shouldUnlock = false

      switch (badge.requirement_type) {
        case 'level':
          shouldUnlock = userLevel >= badge.requirement_value
          break
        case 'xp':
          shouldUnlock = totalXP >= badge.requirement_value
          break
        case 'action_count':
          // This is simplified - you might want to track specific actions
          // For now, we'll use total actions (watch + chat)
          const totalActions = (watchCount || 0) + (chatCount || 0)
          shouldUnlock = totalActions >= badge.requirement_value
          break
      }

      if (shouldUnlock) {
        // Unlock badge
        await (supabaseAdmin
          .from('user_badges') as any)
          .insert({
            user_id: user.id,
            badge_id: badge.id,
          })

        newlyUnlocked.push({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
        })
      }
    }

    return NextResponse.json({
      success: true,
      newly_unlocked: newlyUnlocked,
    })
  } catch (error: any) {
    console.error('Check badges error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

