import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

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
    const { following_id } = body

    if (!following_id) {
      return NextResponse.json(
        { error: 'following_id is required' },
        { status: 400 }
      )
    }

    if (following_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if already following
    const { data: existingFollow } = await (supabase
      .from('follows') as any)
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single()

    if (existingFollow) {
      // Unfollow
      const { error: deleteError } = await (supabase
        .from('follows') as any)
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', following_id)

      if (deleteError) {
        console.error('Error unfollowing:', deleteError)
        return NextResponse.json(
          { error: 'Failed to unfollow' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        is_following: false,
        action: 'unfollowed',
      })
    } else {
      // Follow
      const { error: insertError } = await (supabase
        .from('follows') as any)
        .insert({
          follower_id: user.id,
          following_id,
        })

      if (insertError) {
        console.error('Error following:', insertError)
        return NextResponse.json(
          { error: 'Failed to follow' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        is_following: true,
        action: 'followed',
      })
    }
  } catch (error: any) {
    console.error('Toggle follow error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

