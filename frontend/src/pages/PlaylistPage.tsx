import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import {
  Play,
  Edit,
  Trash2,
  Lock,
  Globe,
  EyeOff,
  Clock,
  User,
  MoreVertical,
  Shuffle,
  PlayCircle
} from 'lucide-react'

import { apiService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { QUERY_KEYS } from '@/types'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Button from '@/components/ui/Button'
import VideoCard from '@/components/video/VideoCard'
import { formatDuration, formatViewCount, formatRelativeTime } from '@/utils'

interface PlaylistVideo {
  _id: string
  video: {
    _id: string
    title: string
    description: string
    thumbnail: string
    duration: number
    views: number
    createdAt: string
    owner: {
      _id: string
      username: string
      fullName: string
      avatar: string
    }
  }
  addedAt: string
}

interface PlaylistData {
  _id: string
  title: string
  description: string
  thumbnail: string
  privacy: 'public' | 'private' | 'unlisted'
  videos: PlaylistVideo[]
  owner: {
    _id: string
    username: string
    fullName: string
    avatar: string
  }
  videoCount: number
  totalDuration: number
  isOwner: boolean
  createdAt: string
  updatedAt: string
}

const PlaylistPage = () => {
  const { playlistId } = useParams<{ playlistId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Get playlist data
  const { data: playlistData, isLoading, error } = useQuery({
    queryKey: [QUERY_KEYS.PLAYLIST, playlistId],
    queryFn: () => apiService.getPlaylistById(playlistId!),
    enabled: !!playlistId
  })

  const playlist: PlaylistData | undefined = playlistData?.data

  // Delete playlist mutation
  const deletePlaylistMutation = useMutation({
    mutationFn: () => apiService.deletePlaylist(playlistId!),
    onSuccess: () => {
      toast.success('Playlist deleted successfully!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS] })
      navigate('/playlists')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete playlist')
    }
  })

  const handleDeletePlaylist = () => {
    if (window.confirm('Are you sure you want to delete this playlist? This action cannot be undone.')) {
      deletePlaylistMutation.mutate()
    }
  }

  const handlePlayVideo = (videoId: string, index: number) => {
    setCurrentVideoIndex(index)
    navigate(`/watch/${videoId}?playlist=${playlistId}&index=${index}`)
  }

  const handlePlayAll = () => {
    if (playlist && playlist.videos.length > 0) {
      const firstVideo = playlist.videos[0].video
      if (firstVideo) {
        handlePlayVideo(firstVideo._id, 0)
      }
    }
  }

  const handleShuffle = () => {
    if (playlist && playlist.videos.length > 0) {
      const randomIndex = Math.floor(Math.random() * playlist.videos.length)
      const randomVideo = playlist.videos[randomIndex].video
      if (randomVideo) {
        handlePlayVideo(randomVideo._id, randomIndex)
      }
    }
  }

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Playlist not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The playlist you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/playlists')}>
            Back to Playlists
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Playlist Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Playlist Thumbnail */}
          <div className="flex-shrink-0">
            <div className="relative w-full lg:w-80 aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              {playlist.thumbnail ? (
                <img
                  src={playlist.thumbnail}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PlayCircle className="w-16 h-16 text-gray-400" />
                </div>
              )}

              {/* Play overlay */}
              {playlist.videos.length > 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                     onClick={handlePlayAll}>
                  <Play className="w-12 h-12 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Playlist Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                  {playlist.title}
                </h1>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{playlist.owner.fullName || playlist.owner.username}</span>
                  </div>

                  <div className={`flex items-center gap-1 ${getPrivacyColor(playlist.privacy)}`}>
                    {getPrivacyIcon(playlist.privacy)}
                    <span className="capitalize">{playlist.privacy}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(playlist.totalDuration)}</span>
                  </div>
                </div>

                <p className="text-gray-700 dark:text-gray-300 mb-4 break-words">
                  {playlist.description}
                </p>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''} •
                  Created {formatRelativeTime(playlist.createdAt)}
                </div>
              </div>

              {/* Action buttons */}
              {playlist.isOwner && (
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/playlist/${playlistId}/edit`)}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>

                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeletePlaylist}
                    disabled={deletePlaylistMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              )}
            </div>

            {/* Play controls */}
            {playlist.videos.length > 0 && (
              <div className="flex items-center gap-3">
                <Button
                  onClick={handlePlayAll}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Play All
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleShuffle}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="w-4 h-4" />
                  Shuffle
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Videos ({playlist.videoCount})
          </h2>
        </div>

        {playlist.videos.length === 0 ? (
          <div className="p-12 text-center">
            <PlayCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No videos in this playlist
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {playlist.isOwner
                ? "Start adding videos to build your playlist collection."
                : "This playlist doesn't contain any videos yet."
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {playlist.videos.map((item, index) => {
              if (!item.video) return null

              return (
                <div
                  key={item._id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handlePlayVideo(item.video._id, index)}
                >
                  <div className="flex items-center gap-4">
                    {/* Index */}
                    <div className="flex-shrink-0 w-8 text-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                    </div>

                    {/* Video thumbnail */}
                    <div className="flex-shrink-0 relative">
                      <img
                        src={item.video.thumbnail}
                        alt={item.video.title}
                        className="w-32 h-18 object-cover rounded"
                      />
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                        {formatDuration(item.video.duration)}
                      </div>
                    </div>

                    {/* Video info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {item.video.title}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{item.video.owner.username}</span>
                        <span>•</span>
                        <span>{formatViewCount(item.video.views)} views</span>
                        <span>•</span>
                        <span>{formatRelativeTime(item.video.createdAt)}</span>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Added {formatRelativeTime(item.addedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    {playlist.isOwner && (
                      <div className="flex-shrink-0">
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          aria-label="Video options"
                          title="Video options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaylistPage
