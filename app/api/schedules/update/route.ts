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
    const { schedule_id, scheduled_start, scheduled_end, ...otherUpdates } = body

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

    // Convert dates if provided
    const updateData: any = { ...otherUpdates }
    
    if (scheduled_start) {
      let startDate: Date
      if (scheduled_start.includes('T') && !scheduled_start.includes('Z') && !scheduled_start.includes('+')) {
        startDate = new Date(scheduled_start)
      } else {
        startDate = new Date(scheduled_start)
      }
      
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid scheduled_start date' },
          { status: 400 }
        )
      }
      updateData.scheduled_start = startDate.toISOString()
    }

    if (scheduled_end !== undefined) {
      if (scheduled_end) {
        let endDate: Date
        if (scheduled_end.includes('T') && !scheduled_end.includes('Z') && !scheduled_end.includes('+')) {
          endDate = new Date(scheduled_end)
        } else {
          endDate = new Date(scheduled_end)
        }
        
        if (isNaN(endDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid scheduled_end date' },
            { status: 400 }
          )
        }
        updateData.scheduled_end = endDate.toISOString()
      } else {
        updateData.scheduled_end = null
      }
    }

    // Update schedule
    const { data: schedule, error: updateError } = await (supabase
      .from('stream_schedules') as any)
      .update(updateData)
      .eq('id', schedule_id)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating schedule:', updateError)
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      )
    }

    // Fetch profile for the schedule
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('id, username, avatar_url')
      .eq('id', schedule.user_id)
      .single()

    const scheduleWithProfile = {
      ...schedule,
      profiles: profile || null,
    }

    return NextResponse.json({
      success: true,
      schedule: scheduleWithProfile,
    })
  } catch (error: any) {
    console.error('Update schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




