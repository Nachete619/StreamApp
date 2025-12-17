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
    const { notification_id } = body

    if (!notification_id) {
      return NextResponse.json(
        { error: 'notification_id is required' },
        { status: 400 }
      )
    }

    // Verify ownership and update
    const { error: updateError } = await (supabase
      .from('notifications') as any)
      .update({ is_read: true })
      .eq('id', notification_id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating notification:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notification' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Mark notification as read error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
