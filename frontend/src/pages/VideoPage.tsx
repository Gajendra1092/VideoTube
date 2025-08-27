import React, { useState, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ThumbsUp,
  ThumbsDown,
  Bell,
  BellOff
} from 'lucide-react'
import { apiService } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import { QUERY_KEYS, Video, User } from '@/types'
import { formatViewCount, formatRelativeTime } from '@/utils'
import VideoPlayer from '@/components/video/VideoPlayer'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

import CommentSection from '@/components/video/CommentSection'
import VideoActionsMenu from '@/components/video/VideoActionsMenu'

const VideoPage = () => {
  const { videoId } = useParams<{ videoId: string }>()
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [showDescription, setShowDescription] = useState(false)

  // Fetch video data
  const {
    data: videoResponse,
    isLoading: videoLoading,
    error: videoError,
  } = useQuery({
    queryKey: [QUERY_KEYS.VIDEO, videoId],
    queryFn: () => apiService.getVideoById(videoId!),
    enabled: !!videoId,
  })

  // Fetch related videos
  const {
    data: relatedVideosResponse,
    isLoading: relatedLoading,
  } = useQuery({
    queryKey: [QUERY_KEYS.VIDEOS, 'related'],
    queryFn: () => apiService.getAllVideos({ limit: 10 }),
  })

  // Get video interaction status (including likes/dislikes)
  const { data: interactionStatus } = useQuery({
    queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId],
    queryFn: () => apiService.getVideoInteractionStatus(videoId!),
    enabled: !!videoId
  })

  // Extract video data first
  const video = videoResponse?.data as Video
  const owner = video?.owner as User

  // Get channel subscription status and subscriber count
  const { data: channelData } = useQuery({
    queryKey: [QUERY_KEYS.CHANNEL_STATS, owner?.username],
    queryFn: () => {
      console.log('🔍 Fetching channel profile for:', owner?.username)
      return apiService.getUserChannelProfile(owner?.username!)
    },
    enabled: !!owner?.username,

  })

  // Like video mutation
  const likeMutation = useMutation({
    mutationFn: () => apiService.toggleVideoLike(videoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIKED_VIDEOS] })
    },
  })

  // Dislike video mutation
  const dislikeMutation = useMutation({
    mutationFn: () => apiService.toggleVideoDislike(videoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO_INTERACTION_STATUS, videoId] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.LIKED_VIDEOS] })
    },
  })

  // Subscribe mutation - simplified without optimistic updates
  const subscribeMutation = useMutation({
    mutationFn: () => {
      console.log('🚀 Calling toggleSubscription API with ownerId:', owner._id)
      return apiService.toggleSubscription(owner._id)
    },
    onSuccess: async (response) => {
      // Show success message from backend
      toast.success(response.message || 'Subscription updated successfully')

      // Force invalidate and refetch the channel data
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHANNEL_STATS, owner?.username] })
    },
    onError: (err) => {
      console.error('❌ Subscription toggle failed:', err)
    }
  })

  // Record watch history mutation
  const recordWatchHistoryMutation = useMutation({
    mutationFn: ({ watchProgress, deviceInfo }: { watchProgress: number; deviceInfo?: any }) => {
      console.log('🚀 Mutation function called with:', { videoId, watchProgress, deviceInfo })
      return apiService.recordWatchHistory(videoId!, watchProgress, deviceInfo)
    },
    onSuccess: (data) => {
      console.log('✅ Watch history recorded successfully:', data)
    },
    onError: (error) => {
      console.error('❌ Failed to record watch history:', error)
      // Don't show error to user as this is background functionality
    }
  })

  // Record video view mutation (one per user per video)
  const recordVideoViewMutation = useMutation({
    mutationFn: () => {
      const sessionInfo = {
        platform: navigator.platform,
        browser: navigator.userAgent.split(' ').pop() || 'Unknown'
      }
      return apiService.recordVideoView(videoId!, sessionInfo)
    },
    onSuccess: (data) => {
      console.log('👁️ Video view recorded:', data)
      // Invalidate video data to get updated view count
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEO, videoId] })
      // Also invalidate videos list to update homepage and other video lists
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.VIDEOS] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CHANNEL_VIDEOS] })
    },
    onError: (error) => {
      console.error('❌ Failed to record video view:', error)
      // Don't show error to user as this is background functionality
    }
  })

  const relatedVideos = relatedVideosResponse?.data?.video || []

  // Handle watch progress updates
  // Track last recorded time to avoid duplicate recordings
  const lastRecordedTimeRef = useRef(0)
  // Track if view has been recorded for this session
  const viewRecordedRef = useRef(false)

  const handleWatchProgress = useCallback((currentTime: number, duration: number) => {
    console.log('🎬 Watch progress update:', { currentTime, duration, isAuthenticated, videoId })

    if (!isAuthenticated || !videoId) {
      console.log('❌ Not recording: not authenticated or no videoId')
      return
    }

    // Record view when user starts watching (after 3 seconds to ensure intentional viewing)
    if (!viewRecordedRef.current && currentTime >= 3) {
      console.log('👁️ Recording video view...')
      viewRecordedRef.current = true
      recordVideoViewMutation.mutate()
    }

    // Record progress at strategic intervals to capture meaningful watch data
    const progressInterval = 10
    const currentTimeFloor = Math.floor(currentTime)

    // Record if:
    // 1. It's been at least 10 seconds since last recording
    // 2. Video is near completion (90% or more)
    // 3. It's the first meaningful watch (at 5 seconds to capture early engagement)
    const timeSinceLastRecord = currentTimeFloor - lastRecordedTimeRef.current
    const isFirstRecord = lastRecordedTimeRef.current === 0 && currentTimeFloor >= 5
    const isIntervalRecord = timeSinceLastRecord >= progressInterval
    const isNearCompletion = currentTime >= duration * 0.9

    const shouldRecord = isFirstRecord || isIntervalRecord || isNearCompletion

    if (shouldRecord) {
      console.log('📊 Recording watch progress:', currentTimeFloor, 'seconds (reason:',
        isFirstRecord ? 'first-record' : isNearCompletion ? 'near-completion' : 'interval', ')')
      lastRecordedTimeRef.current = currentTimeFloor

      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        browser: getBrowserInfo()
      }

      recordWatchHistoryMutation.mutate({
        watchProgress: currentTimeFloor,
        deviceInfo
      })
    }
  }, [isAuthenticated, videoId, recordWatchHistoryMutation, recordVideoViewMutation])

  // Reset view tracking when video changes
  React.useEffect(() => {
    viewRecordedRef.current = false
    lastRecordedTimeRef.current = 0
  }, [videoId])

  // Helper function to get browser info
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  if (videoLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (videoError || !video) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Video not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          The video you're looking for doesn't exist or has been removed.
        </p>
      </div>
    )
  }

  const handleLike = () => {
    if (!isAuthenticated) return
    likeMutation.mutate()
  }

  const handleDislike = () => {
    if (!isAuthenticated) return
    dislikeMutation.mutate()
  }

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      return
    }
    subscribeMutation.mutate()
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main video player */}
        <div className="lg:col-span-2 min-w-0">
          <VideoPlayer
            src={video.videoFile}
            poster={video.thumbnail}
            title={video.title}
            className="mb-4"
            onTimeUpdate={handleWatchProgress}
          />

          {/* Video info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {video.title}
              </h1>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-2">
                <span>{formatViewCount(video.view)}</span>
                <span>•</span>
                <span>{formatRelativeTime(video.createdAt)}</span>
              </div>
            </div>

            {/* Channel info and actions */}
            <div className="space-y-4">
              {/* Channel info */}
              <div className="flex items-center space-x-3">
                <Link to={`/channel/${owner.username}`}>
                  <Avatar
                    src={owner.avatar}
                    name={owner.fullName}
                    size="lg"
                    className="hover:opacity-80 transition-opacity"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/channel/${owner.username}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-brand-primary transition-colors block truncate"
                  >
                    {owner.fullName}
                  </Link>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {channelData?.data?.subscribersCount?.toLocaleString() || 0} subscribers
                  </p>
                </div>
                {isAuthenticated && user?._id !== owner._id && (
                  <Button
                    variant={channelData?.data?.isSubscribed ? "secondary" : "primary"}
                    onClick={handleSubscribe}
                    loading={subscribeMutation.isPending}
                    className="flex items-center space-x-2 flex-shrink-0"
                  >
                    {channelData?.data?.isSubscribed ? (
                      <>
                        <BellOff className="w-4 h-4" />
                        <span className="hidden sm:inline">Subscribed</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" />
                        <span className="hidden sm:inline">Subscribe</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Video actions */}
              <div className="flex flex-wrap items-center gap-2 overflow-hidden">
                <div className="flex items-center bg-light-secondary dark:bg-dark-secondary rounded-full flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={!isAuthenticated || likeMutation.isPending}
                    className={`flex items-center space-x-2 rounded-l-full rounded-r-none border-r border-gray-300 dark:border-gray-600 ${
                      interactionStatus?.data?.isLiked
                        ? 'text-brand-primary bg-brand-primary/10'
                        : ''
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${interactionStatus?.data?.isLiked ? 'fill-current' : ''}`} />
                    <span>{interactionStatus?.data?.likeCount || 0}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDislike}
                    disabled={!isAuthenticated || dislikeMutation.isPending}
                    className={`rounded-r-full rounded-l-none flex items-center space-x-2 ${
                      interactionStatus?.data?.isDisliked
                        ? 'text-red-600 bg-red-600/10'
                        : ''
                    }`}
                  >
                    <ThumbsDown className={`w-4 h-4 ${interactionStatus?.data?.isDisliked ? 'fill-current' : ''}`} />
                    <span>{interactionStatus?.data?.dislikeCount || 0}</span>
                  </Button>
                </div>

                {/* Video Actions */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <VideoActionsMenu
                    videoId={video._id}
                    videoTitle={video.title}
                    videoUrl={window.location.href}
                    variant="buttons"
                    className="flex flex-wrap items-center gap-2"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 space-x-4 mb-2">
                <span>{formatViewCount(video.view)}</span>
                <span>{formatRelativeTime(video.createdAt)}</span>
              </div>
              <div className={`text-sm text-gray-700 dark:text-gray-300 ${!showDescription ? 'line-clamp-3' : ''}`}>
                {video.description}
              </div>
              {video.description.length > 150 && (
                <button
                  type="button"
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-sm text-brand-primary hover:text-brand-secondary mt-2 font-medium"
                >
                  {showDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Comments Section */}
            <CommentSection videoId={videoId!} />
          </div>
        </div>

        {/* Sidebar - Related videos */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Related Videos</h3>
          {relatedLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex space-x-3">
                  <div className="w-32 h-20 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {relatedVideos.slice(0, 10).map((relatedVideo: Video) => (
                <div key={relatedVideo._id} className="flex space-x-3 hover:bg-light-tertiary dark:hover:bg-dark-tertiary rounded-lg p-2 transition-colors">
                  <Link to={`/watch/${relatedVideo._id}`} className="flex-shrink-0">
                    <img
                      src={relatedVideo.thumbnail}
                      alt={relatedVideo.title}
                      className="w-32 h-20 object-cover rounded"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/watch/${relatedVideo._id}`}>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 hover:text-brand-primary transition-colors">
                        {relatedVideo.title}
                      </h4>
                    </Link>
                    <Link
                      to={`/channel/${(relatedVideo.owner as User).username}`}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mt-1 block"
                    >
                      {(relatedVideo.owner as User).fullName}
                    </Link>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 mt-1 space-x-1">
                      <span>{formatViewCount(relatedVideo.view)}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(relatedVideo.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoPage
