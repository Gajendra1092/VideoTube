import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Grid, List, Heart } from 'lucide-react'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { QUERY_KEYS } from '@/types'
import VideoCard from '@/components/video/VideoCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import { formatRelativeTime } from '@/utils'

const LikedVideosPage = () => {
  const { isAuthenticated } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [page, setPage] = useState(1)

  // Get liked videos
  const { data: likedVideosResponse, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.LIKED_VIDEOS, page],
    queryFn: () => apiService.getLikedVideos(page, 20),
    enabled: isAuthenticated
  })

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Sign in to see your liked videos
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Your liked videos will appear here after you sign in.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Error loading liked videos
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          There was an error loading your liked videos. Please try again.
        </p>
      </div>
    )
  }

  const likedVideos = likedVideosResponse?.data?.videos || []
  const pagination = likedVideosResponse?.data?.pagination

  if (likedVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No liked videos yet
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Videos you like will appear here. Start exploring and like videos you enjoy!
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Liked Videos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {pagination?.totalVideos} video{pagination?.totalVideos !== 1 ? 's' : ''}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center space-x-1"
          >
            <Grid className="w-4 h-4" />
            <span className="hidden sm:inline">Grid</span>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center space-x-1"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>
      </div>

      {/* Videos Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {likedVideos.map((item: any, index: number) => (
            <div key={item._id} className="relative">
              <VideoCard
                video={item.video}
                viewMode="grid"
              />

              {/* Liked date overlay */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Liked {formatRelativeTime(item.likedAt)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 mb-8">
          {likedVideos.map((item: any, index: number) => (
            <div key={item._id} className="relative">
              <VideoCard
                video={item.video}
                viewMode="list"
                showIndex={true}
                index={(page - 1) * 20 + index}
              />

              {/* Liked info */}
              <div className="absolute top-3 right-3 text-right">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Liked {formatRelativeTime(item.likedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="secondary"
            onClick={() => setPage(page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>

          <Button
            variant="secondary"
            onClick={() => setPage(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default LikedVideosPage
