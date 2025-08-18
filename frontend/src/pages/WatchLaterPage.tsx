import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, Trash2, Play, Grid, List } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import { useAuthStore } from '@/store/authStore'
import VideoCard from '@/components/video/VideoCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'

const WatchLaterPage = () => {
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  // Fetch watch later videos
  const {
    data: watchLaterData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.WATCH_LATER, page],
    queryFn: () => apiService.getWatchLaterVideos(page, 20),
    enabled: !!user
  })

  const watchLaterVideos = watchLaterData?.data?.docs || []
  const totalVideos = watchLaterData?.data?.totalDocs || 0
  const hasNextPage = watchLaterData?.data?.hasNextPage || false
  const hasPrevPage = watchLaterData?.data?.hasPrevPage || false

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">Failed to load watch later videos</div>
        <Button onClick={() => refetch()} variant="primary">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center space-x-3 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Watch Later
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalVideos} video{totalVideos !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Play all button */}
          {watchLaterVideos.length > 0 && (
            <Button
              variant="primary"
              className="flex items-center space-x-2"
              onClick={() => {
                // Navigate to first video in watch later
                const firstVideo = watchLaterVideos[0]?.video
                if (firstVideo) {
                  window.location.href = `/watch/${firstVideo._id}`
                }
              }}
            >
              <Play className="w-4 h-4" />
              <span>Play all</span>
            </Button>
          )}

          {/* View mode toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-700 shadow-sm'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {watchLaterVideos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No videos in Watch Later
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Videos you save to watch later will appear here. Start exploring and save videos you want to watch later!
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/'}
          >
            Explore Videos
          </Button>
        </div>
      ) : (
        <>
          {/* Videos Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
              {watchLaterVideos.map((item: any) => (
                <VideoCard key={item._id} video={item.video} viewMode="grid" />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 mb-8">
              {watchLaterVideos.map((item: any, index: number) => (
                <div key={item._id} className="relative">
                  <VideoCard
                    video={item.video}
                    viewMode="list"
                    showIndex={true}
                    index={(page - 1) * 20 + index}
                  />

                  {/* Added date */}
                  <div className="absolute top-3 right-3 text-xs text-gray-500 dark:text-gray-400">
                    Added {new Date(item.addedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {(hasNextPage || hasPrevPage) && (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="secondary"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
              >
                Previous
              </Button>
              
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page}
              </span>
              
              <Button
                variant="secondary"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default WatchLaterPage
