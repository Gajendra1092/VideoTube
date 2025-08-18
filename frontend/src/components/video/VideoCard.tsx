import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { Video, User } from '@/types'
import { formatDuration, formatViewCount, formatRelativeTime } from '@/utils'
import Avatar from '@/components/ui/Avatar'
import VideoActionsMenu from './VideoActionsMenu'

interface VideoCardProps {
  video: Video
  viewMode?: 'grid' | 'list'
  showIndex?: boolean
  index?: number
  className?: string
}

const VideoCard = ({ video, viewMode = 'grid', showIndex = false, index, className = '' }: VideoCardProps) => {
  const owner = video.owner as User

  if (viewMode === 'list') {
    return (
      <div className={`group flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}>
        {/* Index */}
        {showIndex && (
          <div className="flex-shrink-0 w-8 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {index !== undefined ? index + 1 : ''}
            </span>
          </div>
        )}

        {/* Thumbnail */}
        <Link to={`/watch/${video._id}`} className="flex-shrink-0">
          <div className="relative w-40 h-24 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />

            {/* Duration badge */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
          </div>
        </Link>

        {/* Video info */}
        <div className="flex-1 min-w-0">
          <Link to={`/watch/${video._id}`}>
            <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-primary transition-colors mb-1">
              {video.title}
            </h3>
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
            <Link
              to={`/channel/${owner.username}`}
              className="hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {owner.fullName}
            </Link>
            <span>•</span>
            <span>{formatViewCount(video.view)} views</span>
            <span>•</span>
            <span>{formatRelativeTime(video.createdAt)}</span>
          </div>
        </div>

        {/* Video actions menu */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <VideoActionsMenu
            videoId={video._id}
            videoTitle={video.title}
            videoUrl={`${window.location.origin}/watch/${video._id}`}
            variant="dots"
          />
        </div>
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className={`group cursor-pointer ${className}`}>
      <Link to={`/watch/${video._id}`} className="block">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(video.duration)}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200" />
        </div>
      </Link>

      {/* Video info */}
      <div className="flex space-x-3">
        {/* Channel avatar */}
        <Link to={`/channel/${owner.username}`} className="flex-shrink-0">
          <Avatar
            src={owner.avatar}
            name={owner.fullName}
            size="sm"
            className="hover:opacity-80 transition-opacity"
          />
        </Link>

        {/* Video details */}
        <div className="flex-1 min-w-0">
          <Link to={`/watch/${video._id}`}>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-primary transition-colors">
              {video.title}
            </h3>
          </Link>

          <Link
            to={`/channel/${owner.username}`}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mt-1 block"
          >
            {owner.fullName}
          </Link>

          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-2">
            <span>{formatViewCount(video.view)}</span>
            <span>•</span>
            <span>{formatRelativeTime(video.createdAt)}</span>
          </div>
        </div>

        {/* Video actions menu */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <VideoActionsMenu
            videoId={video._id}
            videoTitle={video.title}
            videoUrl={`${window.location.origin}/watch/${video._id}`}
            variant="dots"
          />
        </div>
      </div>
    </div>
  )
}

export default VideoCard
