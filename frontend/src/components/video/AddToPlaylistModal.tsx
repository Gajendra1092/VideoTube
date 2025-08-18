import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Plus, Check, Lock, Globe, EyeOff } from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import CreatePlaylistModal from '@/components/playlist/CreatePlaylistModal'

interface AddToPlaylistModalProps {
  videoId: string
  onClose: () => void
}

const AddToPlaylistModal = ({ videoId, onClose }: AddToPlaylistModalProps) => {
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false)
  const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  // Get user's playlists for this video
  const { data: playlistsData, isLoading } = useQuery({
    queryKey: [QUERY_KEYS.USER_PLAYLISTS_FOR_VIDEO, videoId],
    queryFn: () => apiService.getUserPlaylistsForVideo(videoId)
  })

  // Toggle video in playlist mutation
  const toggleVideoInPlaylistMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      return apiService.toggleVideoInPlaylist(videoId, playlistId)
    },
    onSuccess: (response, playlistId) => {
      const action = response.data.action
      toast.success(action === 'added' ? 'Added to playlist!' : 'Removed from playlist!')

      // Clear optimistic update for this playlist
      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[playlistId]
        return updated
      })

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS_FOR_VIDEO, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS] })
    },
    onError: (error: any, playlistId) => {
      toast.error(error.response?.data?.message || 'Failed to update playlist')

      // Clear optimistic update for this playlist on error
      setOptimisticUpdates(prev => {
        const updated = { ...prev }
        delete updated[playlistId]
        return updated
      })
    }
  })

  const handlePlaylistToggle = (playlistId: string, currentContainsVideo: boolean) => {
    // Prevent multiple rapid clicks
    if (toggleVideoInPlaylistMutation.isPending) {
      return
    }

    // Set optimistic update - toggle the current state
    setOptimisticUpdates(prev => ({
      ...prev,
      [playlistId]: !currentContainsVideo
    }))

    toggleVideoInPlaylistMutation.mutate(playlistId)
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
        return 'text-red-500'
      case 'unlisted':
        return 'text-yellow-500'
      default:
        return 'text-green-500'
    }
  }

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Add to playlist
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Create new playlist button */}
            <button
              type="button"
              onClick={() => setShowCreatePlaylist(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4"
            >
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-gray-900 dark:text-white font-medium">Create new playlist</span>
            </button>

            {/* Loading state */}
            {isLoading && (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Playlists list */}
            {playlistsData?.data && (
              <div className="space-y-2">
                {playlistsData.data.map((playlist: any) => {
                  // Use optimistic update if available, otherwise use actual data
                  const isVideoInPlaylist = optimisticUpdates.hasOwnProperty(playlist._id)
                    ? optimisticUpdates[playlist._id]
                    : playlist.containsVideo

                  return (
                    <div
                      key={playlist._id}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => handlePlaylistToggle(playlist._id, playlist.containsVideo)}
                        disabled={toggleVideoInPlaylistMutation.isPending}
                        className={`w-8 h-8 border-2 rounded flex items-center justify-center transition-colors disabled:opacity-50 ${
                          isVideoInPlaylist
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                        }`}
                      >
                        {isVideoInPlaylist && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {playlist.title}
                          </h3>
                          <div className={`${getPrivacyColor(playlist.privacy)}`}>
                            {getPrivacyIcon(playlist.privacy)}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {playlist.videoCount} video{playlist.videoCount !== 1 ? 's' : ''} • {playlist.privacy}
                        </p>
                      </div>
                    </div>
                  )
                })}

                {playlistsData.data.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      You don't have any playlists yet
                    </p>
                    <Button
                      onClick={() => setShowCreatePlaylist(true)}
                      variant="primary"
                      size="sm"
                    >
                      Create your first playlist
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full"
            >
              Done
            </Button>
          </div>
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <CreatePlaylistModal
          onClose={() => setShowCreatePlaylist(false)}
          initialVideoId={videoId}
          onSuccess={() => {
            setShowCreatePlaylist(false)
            queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PLAYLISTS_FOR_VIDEO, videoId] })
          }}
        />
      )}
    </>
  )
}

export default AddToPlaylistModal
