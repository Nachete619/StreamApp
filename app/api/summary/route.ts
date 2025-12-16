import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { aiClient } from '@/lib/ai/client'

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
    const { stream_id } = body

    if (!stream_id || typeof stream_id !== 'string') {
      return NextResponse.json(
        { error: 'stream_id is required' },
        { status: 400 }
      )
    }

    // Fetch stream data
    const { data: stream, error: streamError } = await (supabase
      .from('streams') as any)
      .select('*')
      .eq('id', stream_id)
      .single()

    if (streamError || !stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      )
    }

    // Calculate duration (time elapsed since stream started)
    let duration: number | undefined
    if (stream.created_at) {
      const start = new Date(stream.created_at).getTime()
      const end = Date.now()
      duration = Math.floor((end - start) / 1000) // duration in seconds
    }

    // Get message count (only visible messages)
    const { count: messageCount } = await (supabase
      .from('messages') as any)
      .select('*', { count: 'exact', head: true })
      .eq('stream_id', stream_id)
      .eq('hidden', false)

    // Get sample chat messages (optional, limited to avoid token limits)
    // Only get messages that are not hidden and are somewhat relevant
    const { data: sampleMessages } = await (supabase
      .from('messages') as any)
      .select('content')
      .eq('stream_id', stream_id)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(20)

    const chatMessages = sampleMessages?.map((m: any) => m.content).filter(Boolean) || []

    // Prepare metadata
    const metadata = {
      title: stream.title,
      category: stream.category || null,
      duration,
      isLive: stream.is_live,
      messageCount: messageCount || 0,
      createdAt: stream.created_at,
    }

    // Generate summary using AI
    let summaryResult
    try {
      summaryResult = await aiClient.generateSummary(metadata, chatMessages)
    } catch (error: any) {
      console.error('Error generating summary with AI:', error)
      return NextResponse.json(
        { error: error.message || 'Error al generar resumen con IA' },
        { status: 500 }
      )
    }

    // Check if summary already exists for this stream
    const { data: existingSummary } = await (supabase
      .from('stream_summaries') as any)
      .select('id')
      .eq('stream_id', stream_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // If exists, update it; otherwise, create new
    let summaryData
    if (existingSummary) {
      const { data, error: updateError } = await (supabase
        .from('stream_summaries') as any)
        .update({
          short_summary: summaryResult.short_summary,
          long_summary: summaryResult.long_summary,
          created_at: new Date().toISOString(),
        })
        .eq('id', existingSummary.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating summary:', updateError)
        return NextResponse.json(
          { error: 'Error al actualizar resumen' },
          { status: 500 }
        )
      }

      summaryData = data
    } else {
      const { data, error: insertError } = await (supabase
        .from('stream_summaries') as any)
        .insert({
          stream_id,
          short_summary: summaryResult.short_summary,
          long_summary: summaryResult.long_summary,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating summary:', insertError)
        return NextResponse.json(
          { error: 'Error al guardar resumen' },
          { status: 500 }
        )
      }

      summaryData = data
    }

    return NextResponse.json({
      success: true,
      summary: summaryData,
    })
  } catch (error: any) {
    console.error('Summary generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
