import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { calculateLevel, getXPReward, type ActionType } from '@/lib/gamification'

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

    const body = await request.json()
    const { action, stream_id } = body

    if (!action) {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    const validActions: ActionType[] = ['watch', 'chat', 'donate', 'clip']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action type' },
        { status: 400 }
      )
    }

    // Get XP reward for this action
    const xpReward = getXPReward(action)

    // Create admin client to bypass RLS for XP operations
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

    // For 'watch' action, check if user already viewed this stream
    if (action === 'watch' && stream_id) {
      const { data: existingView } = await supabaseAdmin
        .from('user_stream_views')
        .select('id')
        .eq('user_id', user.id)
        .eq('stream_id', stream_id)
        .single()

      if (existingView) {
        // Already viewed this stream, no XP
        return NextResponse.json({
          success: true,
          xp_gained: 0,
          message: 'Ya has visto este stream',
        })
      }

      // Mark stream as viewed
      await supabaseAdmin
        .from('user_stream_views')
        .insert({
          user_id: user.id,
          stream_id,
        })
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('total_xp, level')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Calculate new XP and level
    const newXP = profile.total_xp + xpReward
    const newLevel = calculateLevel(newXP)

    // Update profile with new XP and level
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        total_xp: newXP,
        level: newLevel,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating XP:', updateError)
      return NextResponse.json(
        { error: 'Failed to update XP' },
        { status: 500 }
      )
    }

    // Log XP gain
    await supabaseAdmin
      .from('user_xp_log')
      .insert({
        user_id: user.id,
        xp_amount: xpReward,
        action_type: action,
        stream_id: stream_id || null,
      })

    // Check for new badges (this will be handled by a separate function)
    const leveledUp = newLevel > profile.level

    return NextResponse.json({
      success: true,
      xp_gained: xpReward,
      total_xp: newXP,
      level: newLevel,
      leveled_up: leveledUp,
      previous_level: profile.level,
    })
  } catch (error: any) {
    console.error('Add XP error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

