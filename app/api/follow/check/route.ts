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

    const { searchParams } = new URL(request.url)
    const following_id = searchParams.get('following_id')

    if (!following_id) {
      return NextResponse.json(
        { error: 'following_id is required' },
        { status: 400 }
      )
    }

    // Check if following
    const { data: follow } = await (supabase
      .from('follows') as any)
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', following_id)
      .single()

    return NextResponse.json({
      is_following: !!follow,
    })
  } catch (error: any) {
    console.error('Check follow error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

