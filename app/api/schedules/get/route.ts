import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const upcoming = searchParams.get('upcoming') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const followingIdsParam = searchParams.get('following_ids')

    let query = (supabase
      .from('stream_schedules') as any)
      .select('*')
      .eq('is_active', true)
      .order('scheduled_start', { ascending: true })
      .limit(limit)

    // Si se proporcionan IDs de usuarios seguidos, filtrar por ellos (tiene prioridad sobre userId)
    if (followingIdsParam) {
      const followingIds = followingIdsParam
        .split(',')
        .map(id => id.trim())
        .filter(id => id !== '' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
      
      console.log('Filtering by following_ids:', followingIds)
      console.log('Following IDs count:', followingIds.length)
      
      if (followingIds.length > 0) {
        query = query.in('user_id', followingIds)
      } else {
        // Si no hay IDs válidos, retornar array vacío
        console.log('No valid following IDs after filtering')
        return NextResponse.json({
          success: true,
          schedules: [],
        })
      }
    } else if (userId) {
      // Si se proporciona userId (y no hay followingIdsParam), filtrar por ese usuario
      query = query.eq('user_id', userId)
    }

    // Aplicar filtro de fecha según el parámetro upcoming
    // Si upcoming=true, solo mostrar schedules futuros
    // Si upcoming=false y hay userId, mostrar todos (incluyendo pasados)
    // Si no hay userId ni followingIds, por defecto mostrar solo futuros
    if (upcoming) {
      const now = new Date().toISOString()
      console.log('Filtering by upcoming, now:', now)
      query = query.gte('scheduled_start', now)
    } else if (!userId && !followingIdsParam) {
      // Si no hay filtro de usuario, por defecto mostrar solo futuros
      const now = new Date().toISOString()
      query = query.gte('scheduled_start', now)
    }
    // Si upcoming=false y hay userId, no aplicar filtro de fecha (mostrar todos)

    const { data: schedules, error } = await query

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schedules', details: error.message },
        { status: 500 }
      )
    }

    console.log('Schedules found:', schedules?.length || 0)

    if (!schedules || schedules.length === 0) {
      console.log('No schedules found')
      return NextResponse.json({
        success: true,
        schedules: [],
      })
    }

    // Get unique user IDs and stream IDs
    const userIds = [...new Set(schedules.map((s: any) => s.user_id).filter(Boolean))]
    const streamIds = [...new Set(schedules.map((s: any) => s.stream_id).filter(Boolean))]

    // Fetch profiles for all users
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

    // Fetch streams if needed
    let streamsMap = new Map()
    if (streamIds.length > 0) {
      const { data: streams } = await (supabase
        .from('streams') as any)
        .select('id, title, playback_id')
        .in('id', streamIds)

      if (streams) {
        streams.forEach((stream: any) => {
          streamsMap.set(stream.id, stream)
        })
      }
    }

    // Combine schedules with profiles and streams
    const schedulesWithRelations = schedules.map((schedule: any) => ({
      ...schedule,
      profiles: profilesMap.get(schedule.user_id) || null,
      streams: schedule.stream_id ? (streamsMap.get(schedule.stream_id) || null) : null,
    }))

    return NextResponse.json({
      success: true,
      schedules: schedulesWithRelations,
    })
  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

