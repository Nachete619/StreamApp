import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EnhancedStreamCard } from '@/components/EnhancedStreamCard'
import { Heart } from 'lucide-react'

export default async function FollowingPage() {
  const supabase = await createServerClient()
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/landing')
  }

  // Get users that the current user is following
  const { data: follows } = await (supabase
    .from('follows') as any)
    .select('following_id')
    .eq('follower_id', user.id)

  const followingIds = follows?.map((f: any) => f.following_id) || []

  // Fetch streams from followed channels
  let streams: any[] = []
  if (followingIds.length > 0) {
    const { data: streamsData } = await (supabase
      .from("streams") as any)
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .in("user_id", followingIds)
      .eq("is_live", true)
      .order("created_at", { ascending: false })
      .limit(20)
    
    streams = streamsData || []
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-accent-600/20 rounded-lg flex items-center justify-center">
            <Heart className="w-5 h-5 text-accent-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-dark-50">Siguiendo</h1>
            <p className="text-sm text-dark-400 mt-1">Streams de los canales que sigues</p>
          </div>
        </div>

        {streams && streams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {streams.map((stream: any) => (
              <EnhancedStreamCard key={stream.id} stream={stream} />
            ))}
          </div>
        ) : (
          <div className="card-premium p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-accent-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-accent-500" />
              </div>
              <h3 className="text-2xl font-bold text-dark-50 mb-3">
                {followingIds.length === 0 
                  ? 'No estás siguiendo a nadie'
                  : 'No hay streams en vivo'}
              </h3>
              <p className="text-dark-400 mb-6">
                {followingIds.length === 0
                  ? 'Descubre nuevos streamers y sigue tus canales favoritos para ver sus streams aquí'
                  : 'Los streams de los canales que sigues aparecerán aquí cuando estén en vivo'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


