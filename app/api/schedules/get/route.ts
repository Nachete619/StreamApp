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
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        ),
        streams:stream_id (
          id,
          title,
          playback_id
        )
      `)
      .eq('is_active', true)
      .order('scheduled_start', { ascending: true })
      .limit(limit)

    // Si se proporcionan IDs de usuarios seguidos, filtrar por ellos (tiene prioridad sobre userId)
    if (followingIdsParam) {
      const followingIds = followingIdsParam.split(',').filter(id => id.trim() !== '')
      if (followingIds.length > 0) {
        query = query.in('user_id', followingIds)
      } else {
        // Si no hay IDs válidos, retornar array vacío
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
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      schedules: schedules || [],
    })
  } catch (error: any) {
    console.error('Get schedules error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

