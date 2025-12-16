import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
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
    const { schedule_id, ...updates } = body

    if (!schedule_id) {
      return NextResponse.json(
        { error: 'schedule_id is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const { data: existingSchedule, error: fetchError } = await (supabase
      .from('stream_schedules') as any)
      .select('user_id')
      .eq('id', schedule_id)
      .single()

    if (fetchError || !existingSchedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    if (existingSchedule.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Update schedule
    const { data: schedule, error: updateError } = await (supabase
      .from('stream_schedules') as any)
      .update(updates)
      .eq('id', schedule_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating schedule:', updateError)
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error: any) {
    console.error('Update schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




