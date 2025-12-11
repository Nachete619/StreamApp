import { createServerClient } from '@/lib/supabase/server'
import { StreamCard } from '@/components/StreamCard'
import { CategorySidebar } from '@/components/CategorySidebar'
import { Suspense } from 'react'

interface PageProps {
  searchParams: {
    category?: string
  }
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const supabase = await createServerClient()
  const { category } = searchParams

  // Fetch live streams (without join to avoid foreign key error)
  const { data: streamsData, error: streamsError } = await (supabase
    .from('streams') as any)
    .select('*')
    .eq('is_live', true)
    .order('created_at', { ascending: false })
    .limit(50)

  // Fetch profiles for all stream users
  let streams: any[] = []
  if (streamsData && streamsData.length > 0) {
    const userIds = [...new Set(streamsData.map((s: any) => s.user_id))]
    const { data: profilesData } = await (supabase
      .from('profiles') as any)
      .select('id, username, avatar_url')
      .in('id', userIds)

    // Map profiles to streams
    const profilesMap = new Map((profilesData || []).map((p: any) => [p.id, p]))
    streams = streamsData.map((stream: any) => ({
      ...stream,
      profiles: profilesMap.get(stream.user_id) || null
    }))
  }

  if (streamsError) {
    console.error('Error fetching streams in explore:', streamsError)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark-50 mb-2">
              Explorar Streams
            </h1>
            <p className="text-dark-400">
              {category ? `Categoría: ${category}` : 'Descubre los mejores streams en vivo'}
            </p>
          </div>

          {streams && streams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {streams
                .filter((stream: any) => stream.profiles && stream.profiles.username) // Filter out streams without profiles
                .map((stream: any) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
            </div>
          ) : (
            <div className="text-center py-16 text-dark-400">
              <p className="text-lg">No hay streams en vivo en este momento</p>
              <p className="text-sm mt-2">Vuelve más tarde para ver contenido</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block w-80">
          <CategorySidebar />
        </aside>
      </div>
    </div>
  )
}
