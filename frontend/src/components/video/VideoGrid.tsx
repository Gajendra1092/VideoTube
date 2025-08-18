import { Video } from '@/types'
import VideoCard from './VideoCard'
import { VideoCardSkeleton } from '@/components/ui/Skeleton'

interface VideoGridProps {
  videos: Video[]
  isLoading?: boolean
  error?: Error | null
  emptyMessage?: string
  skeletonCount?: number
}

const VideoGrid = ({
  videos,
  isLoading = false,
  error = null,
  emptyMessage = "No videos found",
  skeletonCount = 12
}: VideoGridProps) => {
  // Defensive programming: ensure videos is always an array
  const safeVideos = Array.isArray(videos) ? videos : []
  if (isLoading) {
    return (
      <div className="video-grid">
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <VideoCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {error.message || "Unable to load videos. Please try again later."}
        </p>
      </div>
    )
  }

  if (safeVideos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {emptyMessage}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Check back later for new content!
        </p>
      </div>
    )
  }

  return (
    <div className="video-grid">
      {safeVideos.map((video) => (
        <VideoCard key={video._id} video={video} />
      ))}
    </div>
  )
}

export default VideoGrid
