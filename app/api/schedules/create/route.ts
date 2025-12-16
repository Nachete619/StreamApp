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
    const {
      title,
      description,
      scheduled_start,
      scheduled_end,
      is_recurring = false,
      recurring_pattern,
      timezone = 'UTC',
      stream_id,
    } = body

    if (!title || !scheduled_start) {
      return NextResponse.json(
        { error: 'title and scheduled_start are required' },
        { status: 400 }
      )
    }

    // Validate and convert dates
    // datetime-local format: "YYYY-MM-DDTHH:mm" (no timezone)
    // Convert to ISO string with timezone
    let startDate: Date
    let endDate: Date | null = null
    
    // If scheduled_start doesn't have timezone info, treat it as local time
    if (scheduled_start.includes('T') && !scheduled_start.includes('Z') && !scheduled_start.includes('+')) {
      // It's a datetime-local format, convert to ISO with timezone
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

    if (scheduled_end) {
      if (scheduled_end.includes('T') && !scheduled_end.includes('Z') && !scheduled_end.includes('+')) {
        endDate = new Date(scheduled_end)
      } else {
        endDate = new Date(scheduled_end)
      }

      if (isNaN(endDate.getTime()) || endDate <= startDate) {
        return NextResponse.json(
          { error: 'Invalid scheduled_end date' },
          { status: 400 }
        )
      }
    }

    // Convert to ISO strings for database storage
    const scheduledStartISO = startDate.toISOString()
    const scheduledEndISO = endDate ? endDate.toISOString() : null

    // Create schedule
    const { data: schedule, error: insertError } = await (supabase
      .from('stream_schedules') as any)
      .insert({
        user_id: user.id,
        stream_id: stream_id || null,
        title,
        description: description || null,
        scheduled_start: scheduledStartISO,
        scheduled_end: scheduledEndISO,
        is_recurring,
        recurring_pattern: recurring_pattern || null,
        timezone,
        is_active: true,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('Error creating schedule:', insertError)
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      )
    }

    // Fetch profile for the schedule
    const { data: profile } = await (supabase
      .from('profiles') as any)
      .select('id, username, avatar_url')
      .eq('id', user.id)
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
    console.error('Create schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}




