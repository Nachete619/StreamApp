import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EnhancedStreamCard } from "@/components/EnhancedStreamCard";
import { CategoryCard } from "@/components/CategoryCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import Link from "next/link";
import { TrendingUp, ArrowRight } from "lucide-react";

export default async function Home() {
  const supabase = await createServerClient();
  
  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not authenticated, redirect to landing
  if (!user) {
    redirect('/landing');
  }

  // Fetch live streams
  const { data: streams } = await supabase
    .from("streams")
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url
      )
    `)
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(20);

  // Fetch featured streams for carousel
  const { data: featuredStreams } = await supabase
    .from("streams")
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        avatar_url,
        bio
      )
    `)
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(5);

  // Top categories (hardcoded for now, can be dynamic later)
  const topCategories = [
    { name: 'Gaming', slug: 'gaming', iconName: 'gaming', viewers: 15234, streams: 234 },
    { name: 'Música', slug: 'music', iconName: 'music', viewers: 8932, streams: 156 },
    { name: 'Programación', slug: 'coding', iconName: 'coding', viewers: 12345, streams: 189 },
  ];

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Carousel Section */}
      {featuredStreams && featuredStreams.length > 0 && (
        <section className="mb-8">
          <HeroCarousel streams={featuredStreams} />
        </section>
      )}

      <div className="px-6 py-8">
        {/* Top Categories Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-accent-500" />
              <h2 className="text-2xl font-bold text-dark-50">Categorías Top</h2>
            </div>
            <Link 
              href="/explore" 
              className="text-accent-500 hover:text-accent-400 transition-colors flex items-center gap-1 font-medium"
            >
              Ver todas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topCategories.map((category) => (
              <CategoryCard
                key={category.slug}
                name={category.name}
                slug={category.slug}
                iconName={category.iconName}
                viewers={category.viewers}
                streams={category.streams}
              />
            ))}
          </div>
        </section>

        {/* Recommended Channels / Live Streams */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-accent-500 to-accent-600 rounded-full" />
              <h2 className="text-2xl font-bold text-dark-50">Canales Recomendados</h2>
            </div>
            <Link 
              href="/explore" 
              className="text-accent-500 hover:text-accent-400 transition-colors flex items-center gap-1 font-medium"
            >
              Explorar más
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {streams && streams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {streams.map((stream: any) => (
                <EnhancedStreamCard 
                  key={stream.id} 
                  stream={stream}
                  viewers={Math.floor(Math.random() * 5000)}
                />
              ))}
            </div>
          ) : (
            /* Enhanced Empty State */
            <div className="card-premium p-16 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-accent-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-10 h-10 text-accent-500" />
                </div>
                <h3 className="text-2xl font-bold text-dark-50 mb-3">
                  No hay streams en vivo
                </h3>
                <p className="text-dark-400 mb-6">
                  Sé el primero en transmitir y comparte tus momentos con la comunidad
                </p>
                <Link
                  href="/dashboard"
                  className="btn btn-primary inline-flex items-center gap-2"
                >
                  Iniciar mi Primera Transmisión
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}