import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, Grid, List, Filter } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import { useAuthStore } from '@/store/authStore'
import VideoCard from '@/components/video/VideoCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'

const SavedVideosPage = () => {
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [page, setPage] = useState(1)

  const categories = [
    { id: 'all', name: 'All', count: 0 },
    { id: 'general', name: 'General', count: 0 },
    { id: 'favorites', name: 'Favorites', count: 0 },
    { id: 'educational', name: 'Educational', count: 0 },
    { id: 'entertainment', name: 'Entertainment', count: 0 },
    { id: 'music', name: 'Music', count: 0 },
    { id: 'sports', name: 'Sports', count: 0 },
    { id: 'news', name: 'News', count: 0 }
  ]

  // Fetch saved videos
  const {
    data: savedVideosData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [QUERY_KEYS.SAVED_VIDEOS, page, selectedCategory],
    queryFn: () => apiService.getSavedVideos(page, 20, selectedCategory === 'all' ? undefined : selectedCategory),
    enabled: !!user
  })

  const savedVideos = savedVideosData?.data?.docs || []
  const totalVideos = savedVideosData?.data?.totalDocs || 0
  const hasNextPage = savedVideosData?.data?.hasNextPage || false
  const hasPrevPage = savedVideosData?.data?.hasPrevPage || false

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
        <div className="text-red-500 mb-4">Failed to load saved videos</div>
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
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Saved Videos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {totalVideos} video{totalVideos !== 1 ? 's' : ''} saved
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setPage(1)
              }}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

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
      {savedVideos.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Bookmark className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No saved videos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Videos you save will appear here. Start exploring and save videos you want to watch again!
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
              {savedVideos.map((item: any) => (
                <div key={item._id} className="relative">
                  <VideoCard video={item.video} viewMode="grid" />
                  {item.category !== 'general' && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {item.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 mb-8">
              {savedVideos.map((item: any, index: number) => (
                <div key={item._id} className="relative">
                  <VideoCard
                    video={item.video}
                    viewMode="list"
                    showIndex={true}
                    index={(page - 1) * 20 + index}
                  />

                  {/* Saved info */}
                  <div className="absolute top-3 right-3 text-right">
                    {item.category !== 'general' && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                          {item.category}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Saved {new Date(item.addedAt).toLocaleDateString()}
                    </div>
                    {item.notes && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 max-w-32 truncate">
                        "{item.notes}"
                      </div>
                    )}
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

export default SavedVideosPage
