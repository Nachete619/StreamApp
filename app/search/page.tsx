'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, User, Video, Radio } from 'lucide-react'
import { EnhancedStreamCard } from '@/components/EnhancedStreamCard'
import Link from 'next/link'
import Image from 'next/image'

function SearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchInput, setSearchInput] = useState(query)

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.success) {
        setResults(data)
      }
    } catch (error) {
      console.error('Error searching:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="container mx-auto px-4 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar streams, canales, categorías..."
                className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border border-dark-700 rounded-lg text-dark-50 placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-600/50 focus:border-accent-600/50 transition-all text-lg"
              />
            </div>
          </form>
        </div>

        {!query && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-dark-50 mb-2">Buscar en StreamApp</h2>
            <p className="text-dark-400">Escribe algo en la barra de búsqueda para comenzar</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Buscando...</p>
          </div>
        )}

        {!loading && query && results && (
          <div>
            {/* Results Summary */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-dark-50">
                Resultados para &quot;{results.query}&quot;
              </h2>
              <p className="text-sm text-dark-400 mt-1">
                {results.total} resultado{results.total !== 1 ? 's' : ''} encontrado{results.total !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Live Streams */}
            {results.streams && results.streams.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Radio className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-semibold text-dark-50">Streams en Vivo</h3>
                  <span className="text-sm text-dark-400">({results.streams.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.streams.map((stream: any) => (
                    <EnhancedStreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users && results.users.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-accent-500" />
                  <h3 className="text-lg font-semibold text-dark-50">Canales</h3>
                  <span className="text-sm text-dark-400">({results.users.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {results.users.map((user: any) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.id}`}
                      className="card-premium p-4 hover:border-accent-600/30 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center overflow-hidden border-2 border-dark-800 flex-shrink-0">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.username}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-dark-50 truncate">{user.username}</h4>
                          {user.bio && (
                            <p className="text-sm text-dark-400 truncate mt-1">{user.bio}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Offline Streams / VODs */}
            {results.offlineStreams && results.offlineStreams.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Video className="w-5 h-5 text-dark-400" />
                  <h3 className="text-lg font-semibold text-dark-50">Streams Anteriores</h3>
                  <span className="text-sm text-dark-400">({results.offlineStreams.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.offlineStreams.map((stream: any) => (
                    <EnhancedStreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {results.total === 0 && (
              <div className="text-center py-16">
                <Search className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-dark-50 mb-2">No se encontraron resultados</h3>
                <p className="text-dark-400">
                  Intenta con otros términos de búsqueda
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-dark-400">Cargando búsqueda...</p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
