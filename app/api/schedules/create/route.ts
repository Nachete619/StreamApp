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

    // Validate dates
    const startDate = new Date(scheduled_start)
    const endDate = scheduled_end ? new Date(scheduled_end) : null

    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid scheduled_start date' },
        { status: 400 }
      )
    }

    if (endDate && (isNaN(endDate.getTime()) || endDate <= startDate)) {
      return NextResponse.json(
        { error: 'Invalid scheduled_end date' },
        { status: 400 }
      )
    }

    // Create schedule
    const { data: schedule, error: insertError } = await (supabase
      .from('stream_schedules') as any)
      .insert({
        user_id: user.id,
        stream_id: stream_id || null,
        title,
        description: description || null,
        scheduled_start: scheduled_start,
        scheduled_end: scheduled_end || null,
        is_recurring,
        recurring_pattern: recurring_pattern || null,
        timezone,
        is_active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating schedule:', insertError)
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error: any) {
    console.error('Create schedule error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

