import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  MoreVertical,
  Plus,
  Clock,
  Bookmark,
  BookmarkCheck,
  Share2,
  Flag,
  Download,
  List
} from 'lucide-react'
import { apiService } from '@/services/api'
import { QUERY_KEYS } from '@/types'
import { toast } from 'react-hot-toast'
import Button from '@/components/ui/Button'
import AddToPlaylistModal from './AddToPlaylistModal'
import ShareVideoModal from './ShareVideoModal'
import ReportVideoModal from './ReportVideoModal'
import DownloadVideoModal from './DownloadVideoModal'

interface VideoActionsMenuProps {
  videoId: string
  videoTitle?: string
  videoUrl?: string
  className?: string
  variant?: 'dots' | 'buttons'
}

const VideoActionsMenu = ({ 
  videoId, 
  videoTitle = '', 
  videoUrl = '', 
  className = '',
  variant = 'dots'
}: VideoActionsMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Get video interaction status
  const { data: interactionStatus } = useQuery({
    queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId],
    queryFn: () => apiService.getVideoInteractionStatus(videoId),
    enabled: !!videoId
  })

  // Watch Later mutations
  const addToWatchLaterMutation = useMutation({
    mutationFn: () => apiService.addToWatchLater(videoId),
    onSuccess: () => {
      toast.success('Added to Watch Later!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATCH_LATER] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to Watch Later')
    }
  })

  const removeFromWatchLaterMutation = useMutation({
    mutationFn: () => apiService.removeFromWatchLater(videoId),
    onSuccess: () => {
      toast.success('Removed from Watch Later!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATCH_LATER] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove from Watch Later')
    }
  })

  // Save Video mutations
  const saveVideoMutation = useMutation({
    mutationFn: () => apiService.saveVideo(videoId),
    onSuccess: () => {
      toast.success('Video saved!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_VIDEOS] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save video')
    }
  })

  const unsaveVideoMutation = useMutation({
    mutationFn: () => apiService.unsaveVideo(videoId),
    onSuccess: () => {
      toast.success('Video unsaved!')
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SAVED_VIDEOS] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unsave video')
    }
  })

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleWatchLaterToggle = () => {
    if (interactionStatus?.data?.isInWatchLater) {
      removeFromWatchLaterMutation.mutate()
    } else {
      addToWatchLaterMutation.mutate()
    }
    setIsOpen(false)
  }

  const handleSaveToggle = () => {
    if (interactionStatus?.data?.isSaved) {
      unsaveVideoMutation.mutate()
    } else {
      saveVideoMutation.mutate()
    }
    setIsOpen(false)
  }

  const handleDownload = () => {
    setShowDownload(true)
    setIsOpen(false)
  }

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddToPlaylist(true)}
          className="flex items-center space-x-1 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add to playlist</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleWatchLaterToggle}
          disabled={addToWatchLaterMutation.isPending || removeFromWatchLaterMutation.isPending}
          className="flex items-center space-x-1 flex-shrink-0"
        >
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">{interactionStatus?.data?.isInWatchLater ? 'Remove from' : 'Watch later'}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleSaveToggle}
          disabled={saveVideoMutation.isPending || unsaveVideoMutation.isPending}
          className="flex items-center space-x-1 flex-shrink-0"
        >
          {interactionStatus?.data?.isSaved ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{interactionStatus?.data?.isSaved ? 'Saved' : 'Save'}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowShare(true)}
          className="flex items-center space-x-1 flex-shrink-0"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          className="flex items-center space-x-1 flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </Button>

        {/* Modals */}
        {showAddToPlaylist && (
          <AddToPlaylistModal
            videoId={videoId}
            onClose={() => setShowAddToPlaylist(false)}
          />
        )}

        {showShare && (
          <ShareVideoModal
            videoId={videoId}
            videoTitle={videoTitle}
            videoUrl={videoUrl}
            onClose={() => setShowShare(false)}
          />
        )}

        {showDownload && (
          <DownloadVideoModal
            videoId={videoId}
            videoTitle={videoTitle}
            videoUrl={videoUrl}
            onClose={() => setShowDownload(false)}
          />
        )}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Video actions"
      >
        <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-[100]">
          <button
            onClick={() => {
              setShowAddToPlaylist(true)
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3"
          >
            <Plus className="w-4 h-4" />
            <span>Add to playlist</span>
          </button>

          <button
            onClick={handleWatchLaterToggle}
            disabled={addToWatchLaterMutation.isPending || removeFromWatchLaterMutation.isPending}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            <span>{interactionStatus?.data?.isInWatchLater ? 'Remove from Watch later' : 'Save to Watch later'}</span>
          </button>

          <button
            onClick={handleSaveToggle}
            disabled={saveVideoMutation.isPending || unsaveVideoMutation.isPending}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 disabled:opacity-50"
          >
            {interactionStatus?.data?.isSaved ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            <span>{interactionStatus?.data?.isSaved ? 'Remove from Saved' : 'Save video'}</span>
          </button>

          <button
            onClick={variant === 'dots' ? undefined : handleDownload}
            disabled={variant === 'dots'}
            className={`w-full px-4 py-2 text-left flex items-center space-x-3 ${
              variant === 'dots'
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={variant === 'dots' ? 'Download disabled for testing' : 'Download video'}
          >
            <Download className="w-4 h-4" />
            <div className="flex items-center space-x-2">
              <span>Download</span>
              {variant === 'dots' && (
                <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-1.5 py-0.5 rounded">
                  Testing
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              setShowShare(true)
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>

          <hr className="my-2 border-gray-200 dark:border-gray-600" />

          <button
            onClick={() => {
              setShowReport(true)
              setIsOpen(false)
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 text-red-600 dark:text-red-400"
          >
            <Flag className="w-4 h-4" />
            <span>Report</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddToPlaylist && (
        <AddToPlaylistModal
          videoId={videoId}
          onClose={() => setShowAddToPlaylist(false)}
        />
      )}

      {showShare && (
        <ShareVideoModal
          videoId={videoId}
          videoTitle={videoTitle}
          videoUrl={videoUrl}
          onClose={() => setShowShare(false)}
        />
      )}

      {showReport && (
        <ReportVideoModal
          videoId={videoId}
          onClose={() => setShowReport(false)}
        />
      )}

      {showDownload && (
        <DownloadVideoModal
          videoId={videoId}
          videoTitle={videoTitle}
          videoUrl={videoUrl}
          onClose={() => setShowDownload(false)}
        />
      )}
    </div>
  )
}

export default VideoActionsMenu
