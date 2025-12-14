import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerClient()

    // Get followers count
    const { count: followersCount } = await (supabase
      .from('follows') as any)
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user_id)

    // Get following count
    const { count: followingCount } = await (supabase
      .from('follows') as any)
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user_id)

    return NextResponse.json({
      followers: followersCount || 0,
      following: followingCount || 0,
    })
  } catch (error: any) {
    console.error('Get follow stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

