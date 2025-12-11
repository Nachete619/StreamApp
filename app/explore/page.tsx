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

  let query = (supabase
    .from('streams') as any)
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq('is_live', true)

  // In the future, you can filter by category here
  // For now, we'll just show all live streams

  const { data: streams } = await query
    .order('created_at', { ascending: false })
    .limit(50)

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
              {streams.map((stream: any) => (
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
