import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import VideoGrid from '@/components/video/VideoGrid'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

const HomePage = () => {
  const {
    data: videosResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: [QUERY_KEYS.VIDEOS],
    queryFn: () => apiService.getAllVideos(),
  })

  // Extract videos array from the response structure
  const videos = videosResponse?.data?.video || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Recommended
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover amazing videos from creators around the world
        </p>
      </div>

      <ErrorBoundary>
        <VideoGrid
          videos={videos}
          isLoading={isLoading}
          error={error as Error}
          emptyMessage="No videos found. Be the first to upload a video!"
        />
      </ErrorBoundary>
    </div>
  )
}

export default HomePage
