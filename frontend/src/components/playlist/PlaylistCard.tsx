import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MoreVertical, Edit, Trash2, Lock, Globe, EyeOff, Play } from 'lucide-react'
import { Playlist } from '@/types'
import { formatDistanceToNow } from 'date-fns'

interface PlaylistCardProps {
  playlist: Playlist & {
    videoCount?: number
    firstVideoThumbnail?: string
    owner?: {
      username: string
      fullName: string
      avatar: string
    }
  }
  isOwner?: boolean
  onEdit?: (playlist: Playlist) => void
  onDelete?: (playlistId: string) => void
  showOwner?: boolean
  viewMode?: 'grid' | 'list'
  showIndex?: boolean
  index?: number
}

const PlaylistCard = ({
  playlist,
  isOwner = false,
  onEdit,
  onDelete,
  showOwner = false,
  viewMode = 'grid',
  showIndex = false,
  index
}: PlaylistCardProps) => {
  const [showMenu, setShowMenu] = useState(false)

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return <Lock className="w-4 h-4" />
      case 'unlisted':
        return <EyeOff className="w-4 h-4" />
      default:
        return <Globe className="w-4 h-4" />
    }
  }

  const getPrivacyColor = (privacy: string) => {
    switch (privacy) {
      case 'private':
        return 'text-red-600 dark:text-red-400'
      case 'unlisted':
        return 'text-yellow-600 dark:text-yellow-400'
      default:
        return 'text-green-600 dark:text-green-400'
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    onEdit?.(playlist)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    if (window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      onDelete?.(playlist._id)
    }
  }

  if (viewMode === 'list') {
    return (
      <div className="group flex items-center gap-4 p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        {/* Index */}
        {showIndex && (
          <div className="flex-shrink-0 w-8 text-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {index !== undefined ? index + 1 : ''}
            </span>
          </div>
        )}

        {/* Thumbnail */}
        <Link to={`/playlist/${playlist._id}`} className="flex-shrink-0">
          <div className="relative w-40 h-24 bg-gray-300 dark:bg-gray-600 rounded overflow-hidden">
            {playlist.firstVideoThumbnail ? (
              <img
                src={playlist.firstVideoThumbnail}
                alt={playlist.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary">
                <Play className="w-8 h-8 text-white opacity-80" />
              </div>
            )}

            {/* Video count overlay */}
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
              {playlist.videoCount || 0} video{(playlist.videoCount || 0) !== 1 ? 's' : ''}
            </div>

            {/* Privacy indicator */}
            <div className={`absolute top-1 left-1 ${getPrivacyColor(playlist.privacy || 'public')}`}>
              {getPrivacyIcon(playlist.privacy || 'public')}
            </div>
          </div>
        </Link>

        {/* Playlist info */}
        <div className="flex-1 min-w-0">
          <Link to={`/playlist/${playlist._id}`}>
            <h3 className="text-base font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-primary transition-colors mb-1">
              {playlist.title}
            </h3>
          </Link>

          {playlist.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {showOwner && playlist.owner && (
              <>
                <span>{playlist.owner.fullName}</span>
                <span>•</span>
              </>
            )}
            <span>Updated {formatDistanceToNow(new Date(playlist.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* Actions */}
        {isOwner && (onEdit || onDelete) && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="relative">
              <button
                type="button"
                onClick={handleMenuClick}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Playlist options"
                title="Playlist options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                  {onEdit && (
                    <button
                      type="button"
                      onClick={handleEdit}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Grid view (default)
  return (
    <div className="group relative">
      <Link
        to={`/playlist/${playlist._id}`}
        className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-300 dark:bg-gray-600 rounded-t-lg overflow-hidden">
          {playlist.firstVideoThumbnail ? (
            <img
              src={playlist.firstVideoThumbnail}
              alt={playlist.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-primary to-brand-secondary">
              <Play className="w-12 h-12 text-white opacity-80" />
            </div>
          )}

          {/* Video count overlay */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {playlist.videoCount || 0} video{(playlist.videoCount || 0) !== 1 ? 's' : ''}
          </div>

          {/* Privacy indicator */}
          <div className={`absolute top-2 left-2 ${getPrivacyColor(playlist.privacy || 'public')}`}>
            {getPrivacyIcon(playlist.privacy || 'public')}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-primary transition-colors mb-2">
            {playlist.title}
          </h3>

          {/* Description */}
          {playlist.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {playlist.description}
            </p>
          )}

          {/* Owner info (if showing) */}
          {showOwner && playlist.owner && (
            <div className="flex items-center space-x-2 mb-2">
              <img
                src={playlist.owner.avatar}
                alt={playlist.owner.fullName}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {playlist.owner.fullName}
              </span>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              Updated {formatDistanceToNow(new Date(playlist.updatedAt), { addSuffix: true })}
            </span>
            <span className="capitalize">
              {playlist.privacy || 'public'}
            </span>
          </div>
        </div>
      </Link>

      {/* Menu button (only for owner) */}
      {isOwner && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              type="button"
              onClick={handleMenuClick}
              className="p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
              aria-label="Playlist options"
              title="Playlist options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                {onEdit && (
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}

export default PlaylistCard
