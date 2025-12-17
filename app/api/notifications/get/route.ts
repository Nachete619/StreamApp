import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

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

    // Fetch notifications
    const { data: notifications, error: notificationsError } = await (supabase
      .from('notifications') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    // Get unread count
    const { count: unreadCount } = await (supabase
      .from('notifications') as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    // Fetch related user profiles if needed
    const userIds = [
      ...new Set(
        (notifications || [])
          .map((n: any) => n.related_user_id)
          .filter(Boolean)
      ),
    ]

    let profilesMap = new Map()
    if (userIds.length > 0) {
      const { data: profiles } = await (supabase
        .from('profiles') as any)
        .select('id, username, avatar_url')
        .in('id', userIds)

      if (profiles) {
        profiles.forEach((profile: any) => {
          profilesMap.set(profile.id, profile)
        })
      }
    }

    // Combine notifications with profiles
    const notificationsWithProfiles = (notifications || []).map((notification: any) => ({
      ...notification,
      related_user: notification.related_user_id
        ? profilesMap.get(notification.related_user_id) || null
        : null,
    }))

    return NextResponse.json({
      success: true,
      notifications: notificationsWithProfiles,
      unread_count: unreadCount || 0,
    })
  } catch (error: any) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
